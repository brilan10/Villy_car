<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!$empresa_id) {
    responseJson(["error" => "empresa_id es requerido"], 400);
}

$action = $_GET['action'] ?? null;

if ($action === 'payrolls') {
    if ($method === 'GET') {
        $trabajador_id = $_GET['trabajador_id'] ?? null;
        if ($trabajador_id) {
            $stmt = $pdo->prepare("SELECT * FROM liquidaciones_sueldo WHERE empresa_id = ? AND trabajador_id = ? ORDER BY mes_periodo DESC");
            $stmt->execute([$empresa_id, $trabajador_id]);
        } else {
            $stmt = $pdo->prepare("SELECT l.*, t.nombre as workerName FROM liquidaciones_sueldo l JOIN trabajadores t ON l.trabajador_id = t.id WHERE l.empresa_id = ? ORDER BY l.mes_periodo DESC");
            $stmt->execute([$empresa_id]);
        }
        responseJson($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $trabajador_id = $inputData['trabajador_id'];
        $mes_periodo = $inputData['mes_periodo'] ?? date('Y-m');
        $dias_trabajados = $inputData['dias_trabajados'] ?? 30;
        $sueldo_base = $inputData['sueldo_base'] ?? 0;
        $gratificacion = $inputData['gratificacion'] ?? 0;
        $otros_imponibles = $inputData['otros_imponibles'] ?? 0;
        $total_imponible = $inputData['total_imponible'] ?? 0;
        $movilizacion = $inputData['movilizacion'] ?? 0;
        $alimentacion = $inputData['alimentacion'] ?? 0;
        $transporte = $inputData['transporte'] ?? 0;
        $otros_no_imponibles = $inputData['otros_no_imponibles'] ?? 0;
        $total_no_imponible = $inputData['total_no_imponible'] ?? 0;
        $afp_monto = $inputData['afp_monto'] ?? 0;
        $salud_monto = $inputData['salud_monto'] ?? 0;
        $seguro_cesantia = $inputData['seguro_cesantia'] ?? 0;
        $impuesto_unico = $inputData['impuesto_unico'] ?? 0;
        $cotizacion_voluntaria = $inputData['cotizacion_voluntaria'] ?? 0;
        $anticipos = $inputData['anticipos'] ?? 0;
        $otros_descuentos = $inputData['otros_descuentos'] ?? 0;
        $total_descuentos = $inputData['total_descuentos'] ?? 0;
        $sueldo_liquido = $inputData['sueldo_liquido'] ?? 0;

        $stmt = $pdo->prepare("INSERT INTO liquidaciones_sueldo (empresa_id, trabajador_id, mes_periodo, dias_trabajados, sueldo_base, gratificacion, otros_imponibles, total_imponible, movilizacion, alimentacion, transporte, otros_no_imponibles, total_no_imponible, afp_monto, salud_monto, seguro_cesantia, impuesto_unico, cotizacion_voluntaria, anticipos, otros_descuentos, total_descuentos, sueldo_liquido) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$empresa_id, $trabajador_id, $mes_periodo, $dias_trabajados, $sueldo_base, $gratificacion, $otros_imponibles, $total_imponible, $movilizacion, $alimentacion, $transporte, $otros_no_imponibles, $total_no_imponible, $afp_monto, $salud_monto, $seguro_cesantia, $impuesto_unico, $cotizacion_voluntaria, $anticipos, $otros_descuentos, $total_descuentos, $sueldo_liquido]);
        responseJson(["success" => true, "id" => $pdo->lastInsertId()], 201);
    } elseif ($method === 'PUT') {
        $id = $inputData['id'] ?? null;
        $archivo_url = $inputData['archivo_url'] ?? null;
        if (!$id || !$archivo_url) responseJson(["error" => "ID y archivo_url son requeridos"], 400);

        $stmt = $pdo->prepare("UPDATE liquidaciones_sueldo SET archivo_url = ? WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$archivo_url, $id, $empresa_id]);
        responseJson(["success" => true]);
    }
    exit;
}

if ($action === 'estados_pago') {
    if ($method === 'GET') {
        $trabajador_id = $_GET['trabajador_id'] ?? null;
        if ($trabajador_id) {
            $stmt = $pdo->prepare("SELECT * FROM estados_pago_rrhh WHERE empresa_id = ? AND trabajador_id = ? ORDER BY fecha DESC");
            $stmt->execute([$empresa_id, $trabajador_id]);
        } else {
            $stmt = $pdo->prepare("SELECT e.*, t.nombre as workerName FROM estados_pago_rrhh e JOIN trabajadores t ON e.trabajador_id = t.id WHERE e.empresa_id = ? ORDER BY e.fecha DESC");
            $stmt->execute([$empresa_id]);
        }
        responseJson($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $trabajador_id = $inputData['trabajador_id'];
        $fecha = $inputData['fecha'] ?? date('Y-m-d');
        $monto_total = $inputData['monto_total'] ?? 0;
        $descripcion_servicios = $inputData['descripcion_servicios'] ?? '';

        $stmt = $pdo->prepare("INSERT INTO estados_pago_rrhh (empresa_id, trabajador_id, fecha, monto_total, descripcion_servicios) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$empresa_id, $trabajador_id, $fecha, $monto_total, $descripcion_servicios]);
        responseJson(["success" => true, "id" => $pdo->lastInsertId()], 201);
    } elseif ($method === 'PUT') {
        $id = $inputData['id'] ?? null;
        $archivo_url = $inputData['archivo_url'] ?? null;
        $monto_total = $inputData['monto_total'] ?? null;
        $descripcion_servicios = $inputData['descripcion_servicios'] ?? null;

        if (!$id) responseJson(["error" => "ID requerido"], 400);

        if ($archivo_url !== null) {
            $stmt = $pdo->prepare("UPDATE estados_pago_rrhh SET archivo_url = ? WHERE id = ? AND empresa_id = ?");
            $stmt->execute([$archivo_url, $id, $empresa_id]);
        } elseif ($monto_total !== null || $descripcion_servicios !== null) {
            $stmt = $pdo->prepare("UPDATE estados_pago_rrhh SET monto_total = ?, descripcion_servicios = ? WHERE id = ? AND empresa_id = ?");
            $stmt->execute([$monto_total, $descripcion_servicios, $id, $empresa_id]);
        }
        responseJson(["success" => true]);
    } elseif ($method === 'DELETE') {
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if (!$id) responseJson(["error" => "ID requerido"], 400);
        $stmt = $pdo->prepare("DELETE FROM estados_pago_rrhh WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$id, $empresa_id]);
        responseJson(["success" => true]);
    }
    exit;
}

if ($action === 'anexos') {
    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM anexos_trabajador WHERE empresa_id = ? ORDER BY fecha DESC");
        $stmt->execute([$empresa_id]);
        responseJson($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $trabajador_id = $inputData['trabajador_id'];
        $fecha = $inputData['fecha'] ?? date('Y-m-d');
        $sueldo_base_nuevo = $inputData['sueldo_base_nuevo'] ?? 0;
        $detalle = $inputData['detalle'] ?? '';

        $pdo->beginTransaction();
        try {
            // Update the worker's base salary immediately
            $stmtUpdate = $pdo->prepare("UPDATE trabajadores SET sueldo_base = ? WHERE id = ? AND empresa_id = ?");
            $stmtUpdate->execute([$sueldo_base_nuevo, $trabajador_id, $empresa_id]);

            // Create the annex record
            $stmtInsert = $pdo->prepare("INSERT INTO anexos_trabajador (empresa_id, trabajador_id, fecha, sueldo_base_nuevo, detalle) VALUES (?, ?, ?, ?, ?)");
            $stmtInsert->execute([$empresa_id, $trabajador_id, $fecha, $sueldo_base_nuevo, $detalle]);
            
            $pdo->commit();
            responseJson(["success" => true, "id" => $pdo->lastInsertId()], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            responseJson(["error" => "Error al guardar el anexo: " . $e->getMessage()], 500);
        }
    } elseif ($method === 'PUT') {
        $id = $inputData['id'] ?? null;
        $archivo_url = $inputData['archivo_url'] ?? null;
        if (!$id || !$archivo_url) responseJson(["error" => "ID y archivo_url son requeridos"], 400);

        $stmt = $pdo->prepare("UPDATE anexos_trabajador SET archivo_url = ? WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$archivo_url, $id, $empresa_id]);
        responseJson(["success" => true]);
    }
    exit;
}

if ($action === 'set_password') {
    if ($method === 'POST') {
        $id = $inputData['id'] ?? null;
        $password = $inputData['password'] ?? '';
        $rol = $inputData['rol'] ?? 'trabajador';
        
        if (!$id || empty($password)) {
            responseJson(["error" => "ID y contraseña son requeridos"], 400);
        }
        
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE trabajadores SET password_hash = ?, rol = ? WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$hash, $rol, $id, $empresa_id]);
        responseJson(["success" => true]);
    }
    exit;
}

if ($action === 'change_password') {
    if ($method === 'POST') {
        $id = $inputData['id'] ?? null;
        $current_password = $inputData['current_password'] ?? '';
        $new_password = $inputData['new_password'] ?? '';
        
        if (!$id || empty($current_password) || empty($new_password)) {
            responseJson(["error" => "Todos los campos son requeridos"], 400);
        }
        
        $stmt = $pdo->prepare("SELECT password_hash FROM trabajadores WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$id, $empresa_id]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($current_password, $user['password_hash'])) {
            responseJson(["error" => "La contraseña actual es incorrecta"], 401);
        }
        
        $hash = password_hash($new_password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE trabajadores SET password_hash = ? WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$hash, $id, $empresa_id]);
        responseJson(["success" => true]);
    }
    exit;
}

// Activar/Desactivar Trabajador/Usuario
if ($action === 'toggle_status') {
    if ($method === 'POST') {
        $id = $inputData['id'] ?? null;
        $activo = isset($inputData['activo']) ? (int)$inputData['activo'] : 1;
        if (!$id) {
            responseJson(["error" => "ID es requerido"], 400);
        }
        $stmt = $pdo->prepare("UPDATE trabajadores SET activo = ? WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$activo, $id, $empresa_id]);
        responseJson(["success" => true]);
    }
    exit;
}

// Lógica de Trabajadores
switch ($method) {
    case 'GET':
        $all = isset($_GET['all']) ? (int)$_GET['all'] : 0;
        $all_companies = isset($_GET['all_companies']) ? (int)$_GET['all_companies'] : 0;
        
        if ($all_companies) {
            $stmt = $pdo->prepare("SELECT * FROM trabajadores");
            $stmt->execute();
        } else if ($all) {
            $stmt = $pdo->prepare("SELECT * FROM trabajadores WHERE empresa_id = ?");
            $stmt->execute([$empresa_id]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM trabajadores WHERE empresa_id = ? AND activo = TRUE");
            $stmt->execute([$empresa_id]);
        }
        
        responseJson($stmt->fetchAll());
        break;

    case 'POST':
        $nombre = $inputData['nombre'] ?? '';
        $rut = $inputData['rut'] ?? '';
        $cargo = $inputData['cargo'] ?? '';
        $sueldo_base = $inputData['sueldo_base'] ?? 0;
        $tipo_contrato = $inputData['tipo_contrato'] ?? 'indefinido';
        $afp = $inputData['afp'] ?? 'Modelo';
        $salud = $inputData['salud'] ?? 'Fonasa';

        if (empty($nombre) || empty($rut)) responseJson(["error" => "Nombre y RUT obligatorios"], 400);

        $stmt = $pdo->prepare("INSERT INTO trabajadores (empresa_id, rut, nombre, cargo, sueldo_base, tipo_contrato, afp, salud) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$empresa_id, $rut, $nombre, $cargo, $sueldo_base, $tipo_contrato, $afp, $salud]);
        responseJson(["success" => true, "id" => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        $id = $inputData['id'] ?? null;
        if (!$id) responseJson(["error" => "ID requerido"], 400);
        
        $archivo_contrato = $inputData['archivo_contrato'] ?? null;
        if ($archivo_contrato !== null) {
            $stmt = $pdo->prepare("UPDATE trabajadores SET archivo_contrato=? WHERE id=? AND empresa_id=?");
            $stmt->execute([$archivo_contrato, $id, $empresa_id]);
            responseJson(["success" => true]);
        }
        
        $archivo_finiquito = $inputData['archivo_finiquito'] ?? null;
        if ($archivo_finiquito !== null) {
            $stmt = $pdo->prepare("UPDATE trabajadores SET archivo_finiquito=? WHERE id=? AND empresa_id=?");
            $stmt->execute([$archivo_finiquito, $id, $empresa_id]);
            responseJson(["success" => true]);
        }
        
        $nombre = $inputData['nombre'] ?? '';
        $rut = $inputData['rut'] ?? '';
        $cargo = $inputData['cargo'] ?? '';
        $sueldo_base = $inputData['sueldo_base'] ?? 0;
        $tipo_contrato = $inputData['tipo_contrato'] ?? 'indefinido';
        $afp = $inputData['afp'] ?? 'Modelo';
        $salud = $inputData['salud'] ?? 'Fonasa';

        $stmt = $pdo->prepare("UPDATE trabajadores SET rut=?, nombre=?, cargo=?, sueldo_base=?, tipo_contrato=?, afp=?, salud=? WHERE id=? AND empresa_id=?");
        $stmt->execute([$rut, $nombre, $cargo, $sueldo_base, $tipo_contrato, $afp, $salud, $id, $empresa_id]);
        responseJson(["success" => true]);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if (!$id) responseJson(["error" => "ID requerido"], 400);
        // Soft delete
        $stmt = $pdo->prepare("UPDATE trabajadores SET activo = FALSE WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$id, $empresa_id]);
        responseJson(["success" => true]);
        break;

    default:
        responseJson(["error" => "Metodo no soportado"], 405);
}
