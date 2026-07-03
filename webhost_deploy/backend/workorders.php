<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

try { $pdo->exec("ALTER TABLE ordenes_trabajo ADD COLUMN estado_pago VARCHAR(50) DEFAULT 'pendiente'"); } catch (PDOException $e) {}
try { $pdo->exec("ALTER TABLE ordenes_trabajo ADD COLUMN bitacora JSON DEFAULT NULL"); } catch (PDOException $e) {}
try { $pdo->exec("ALTER TABLE ordenes_trabajo ADD COLUMN porcentaje_avance INT DEFAULT 0"); } catch (PDOException $e) {}
try { $pdo->exec("ALTER TABLE ordenes_trabajo ADD COLUMN archivos TEXT DEFAULT NULL"); } catch (PDOException $e) {}

if (!$empresa_id) {
    responseJson(["error" => "empresa_id es requerido"], 400);
}

$action = $_GET['action'] ?? null;

if ($action === 'details') {
    $orden_id = $_GET['id'] ?? null;
    if ($method === 'GET' && $orden_id) {
        $stmt = $pdo->prepare("SELECT * FROM detalles_orden_trabajo WHERE orden_id = ?");
        $stmt->execute([$orden_id]);
        responseJson($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $orden_id = $inputData['orden_id'];
        $descripcion = $inputData['descripcion'];
        $tipo = $inputData['tipo'] ?? 'servicio';
        $cantidad = $inputData['cantidad'] ?? 1;
        $precio_unitario = $inputData['precio_unitario'] ?? 0;
        $subtotal = $cantidad * $precio_unitario;

        $stmt = $pdo->prepare("INSERT INTO detalles_orden_trabajo (orden_id, descripcion, tipo, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$orden_id, $descripcion, $tipo, $cantidad, $precio_unitario, $subtotal]);

        // Actualizar total de la orden
        $pdo->query("UPDATE ordenes_trabajo SET total_estimado = (SELECT SUM(subtotal) FROM detalles_orden_trabajo WHERE orden_id = $orden_id) WHERE id = $orden_id");

        responseJson(["success" => true, "id" => $pdo->lastInsertId()], 201);
    }
    exit;
}

switch ($method) {
    case 'GET':
        // AUTO-STATE UPDATES logic
        // We evaluate times dynamically
        $now = time();
        $stmtAll = $pdo->prepare("SELECT id, estado, fecha_ingreso FROM ordenes_trabajo WHERE empresa_id = ? AND estado IN ('ingresado', 'en_revision')");
        $stmtAll->execute([$empresa_id]);
        $activeOrders = $stmtAll->fetchAll();

        foreach ($activeOrders as $ao) {
            $ingresoTime = strtotime($ao['fecha_ingreso']);
            $newStatus = $ao['estado'];
            
            // If now is >= scheduled time and status is 'ingresado', move to 'en_revision'
            if ($ao['estado'] === 'ingresado' && $now >= $ingresoTime) {
                $newStatus = 'en_revision';
            }
            // If now is >= scheduled time + 15 mins and status is 'en_revision', move to 'en_reparacion'
            if (($ao['estado'] === 'en_revision' || $newStatus === 'en_revision') && $now >= ($ingresoTime + 900)) { // 900s = 15m
                $newStatus = 'en_reparacion';
            }

            if ($newStatus !== $ao['estado']) {
                $upd = $pdo->prepare("UPDATE ordenes_trabajo SET estado = ? WHERE id = ?");
                $upd->execute([$newStatus, $ao['id']]);
            }
        }

        // Auto-limpieza de archivos de ordenes entregadas hace mas de 30 dias
        $thirtyDaysAgo = date('Y-m-d H:i:s', strtotime('-30 days'));
        $pdo->query("UPDATE ordenes_trabajo SET archivos = NULL WHERE estado = 'entregado' AND fecha_entrega < '$thirtyDaysAgo' AND archivos IS NOT NULL");

        $stmt = $pdo->prepare("SELECT * FROM ordenes_trabajo WHERE empresa_id = ? ORDER BY fecha_ingreso DESC");
        $stmt->execute([$empresa_id]);
        $orders = $stmt->fetchAll();
        
        // Adjuntar detalles para mayor facilidad en frontend
        foreach ($orders as &$order) {
            $stmtDet = $pdo->prepare("SELECT * FROM detalles_orden_trabajo WHERE orden_id = ?");
            $stmtDet->execute([$order['id']]);
            $order['detalles'] = $stmtDet->fetchAll();
        }

        responseJson($orders);
        break;

    case 'POST':
        $cliente_nombre = $inputData['cliente_nombre'] ?? '';
        $cliente_telefono = $inputData['cliente_telefono'] ?? '';
        $vehiculo_patente = $inputData['vehiculo_patente'] ?? '';
        $vehiculo_modelo = $inputData['vehiculo_modelo'] ?? '';
        $problema_reportado = $inputData['problema_reportado'] ?? '';
        $estado = $inputData['estado'] ?? 'ingresado';
        $area_asignada = $inputData['area_asignada'] ?? 'Ambas';
        $archivos = isset($inputData['archivos']) ? json_encode($inputData['archivos']) : null;
        $empresa_derivada_id = $inputData['empresa_derivada_id'] ?? null;
        $trabajador_asignado = $inputData['trabajador_asignado'] ?? null;
        $fecha_ingreso = $inputData['fecha_ingreso'] ?? date('Y-m-d H:i:s');
        $estado_pago = $inputData['estado_pago'] ?? 'pendiente';

        $target_empresa_id = $empresa_derivada_id ? $empresa_derivada_id : $empresa_id;
        $stmt = $pdo->prepare("INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, cliente_telefono, vehiculo_patente, vehiculo_modelo, problema_reportado, estado, area_asignada, archivos, empresa_derivada_id, trabajador_asignado, fecha_ingreso, estado_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$target_empresa_id, $cliente_nombre, $cliente_telefono, $vehiculo_patente, $vehiculo_modelo, $problema_reportado, $estado, $area_asignada, $archivos, $empresa_derivada_id, $trabajador_asignado, $fecha_ingreso, $estado_pago]);
        
        $newId = $pdo->lastInsertId();
        
        responseJson(["success" => true, "id" => $newId], 201);
        break;

    case 'PUT':
        $id = $inputData['id'] ?? null;
        if (!$id) responseJson(["error" => "ID requerido"], 400);

        // Actualizar solo estado_pago si viene en la peticion y nada más
        if (isset($inputData['estado_pago']) && !isset($inputData['estado']) && count($inputData) <= 2) {
            $stmt = $pdo->prepare("UPDATE ordenes_trabajo SET estado_pago = ? WHERE id = ? AND empresa_id = ?");
            $stmt->execute([$inputData['estado_pago'], $id, $empresa_id]);
            responseJson(["success" => true]);
        }
        
        $updates = [];
        $params = [];

        // Campos permitidos para edición
        $allowedFields = ['estado', 'estado_pago', 'fecha_ingreso', 'cliente_nombre', 'cliente_telefono', 'vehiculo_patente', 'vehiculo_modelo', 'problema_reportado', 'area_asignada', 'trabajador_asignado', 'bitacora', 'porcentaje_avance'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $inputData)) {
                $updates[] = "$field = ?";
                $params[] = $inputData[$field];
                
                if ($field === 'estado' && in_array($inputData['estado'], ['completado', 'entregado'])) {
                    $updates[] = "fecha_entrega = ?";
                    $params[] = date('Y-m-d H:i:s');
                }
            }
        }

        if (empty($updates)) {
            responseJson(["success" => true, "msg" => "No hay campos para actualizar"]);
        }

        $params[] = $id;
        $params[] = $empresa_id;

        $updateSql = implode(', ', $updates);
        $stmt = $pdo->prepare("UPDATE ordenes_trabajo SET $updateSql WHERE id = ? AND empresa_id = ?");
        $stmt->execute($params);
        
        responseJson(["success" => true]);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if (!$id) responseJson(["error" => "ID requerido"], 400);

        $stmt = $pdo->prepare("DELETE FROM ordenes_trabajo WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$id, $empresa_id]);
        responseJson(["success" => true]);
        break;

    default:
        responseJson(["error" => "Metodo no soportado"], 405);
}
