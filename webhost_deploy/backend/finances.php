<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!$empresa_id) {
    responseJson(["error" => "empresa_id es requerido"], 400);
}

// Para cierres de caja u otras acciones
$action = $_GET['action'] ?? null;

if ($action === 'closures') {
    if ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT * FROM cierres_caja WHERE empresa_id = ? ORDER BY fecha_cierre DESC");
        $stmt->execute([$empresa_id]);
        responseJson($stmt->fetchAll());
    } elseif ($method === 'POST') {
        // Guardar cierre
        $monto_apertura = $inputData['monto_apertura'] ?? 0;
        $ventas_efectivo = $inputData['ventas_efectivo_esperado'] ?? 0;
        $ventas_tarjeta = $inputData['ventas_tarjeta_esperado'] ?? 0;
        $ventas_transf = $inputData['ventas_transferencia_esperado'] ?? 0;
        $arqueo_efectivo = $inputData['arqueo_efectivo_real'] ?? 0;
        $descuadre = $inputData['descuadre'] ?? 0;
        $notas = $inputData['notas'] ?? '';
        $detalles = json_encode($inputData['detalles_denominacion'] ?? []);

        $stmt = $pdo->prepare("INSERT INTO cierres_caja (empresa_id, monto_apertura, ventas_efectivo_esperado, ventas_tarjeta_esperado, ventas_transferencia_esperado, arqueo_efectivo_real, descuadre, detalles_denominacion, notas, fecha_cierre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$empresa_id, $monto_apertura, $ventas_efectivo, $ventas_tarjeta, $ventas_transf, $arqueo_efectivo, $descuadre, $detalles, $notas]);
        responseJson(["success" => true, "cierre_id" => $pdo->lastInsertId()], 201);
    }
    exit;
}

if ($action === 'invoice_entry' && $method === 'POST') {
    // Expected structure: provider, number, date, total, items (array of products)
    $provider = $inputData['provider'] ?? '';
    $number = $inputData['number'] ?? '';
    $date = $inputData['date'] ?? date('Y-m-d');
    $items = $inputData['items'] ?? [];
    $total = $inputData['total'] ?? 0;
    
    try {
        $pdo->beginTransaction();
        
        // 1. Guardar como egreso en finanzas
        $description = "Factura #$number - $provider";
        $stmtFinanzas = $pdo->prepare("INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES (?, ?, 'egreso', 'Factura Compra', ?, ?, 'transferencia')");
        $stmtFinanzas->execute([$empresa_id, $date, $description, $total]);
        
        // 2. Actualizar o insertar productos
        $stmtCheck = $pdo->prepare("SELECT id FROM productos WHERE empresa_id = ? AND nombre = ?");
        $stmtUpdate = $pdo->prepare("UPDATE productos SET stock_actual = stock_actual + ?, precio_compra = ?, precio_venta = ?, imagen_url = ? WHERE id = ?");
        $stmtInsert = $pdo->prepare("INSERT INTO productos (empresa_id, sku, nombre, precio_compra, precio_venta, tipo, stock_actual, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        foreach ($items as $item) {
            $nombre = $item['nombre'];
            if (!$nombre) continue;
            
            $codigo = $item['codigo'] ?? null;
            $qty = $item['qty'] ?? 1;
            $precio_compra = $item['precio_compra'] ?? 0;
            $precio_venta = $item['precio_venta'] ?? 0;
            $imagen_url = $item['imagen_url'] ?? null;
            $tipo = $item['tipo'] ?? 'objeto';
            
            $stmtCheck->execute([$empresa_id, $nombre]);
            $existingProduct = $stmtCheck->fetch();
            
            if ($existingProduct) {
                // Update
                $stmtUpdate->execute([$qty, $precio_compra, $precio_venta, $imagen_url, $existingProduct['id']]);
            } else {
                // Insert
                $stmtInsert->execute([$empresa_id, $codigo, $nombre, $precio_compra, $precio_venta, $tipo, $qty, $imagen_url]);
            }
        }
        
        $pdo->commit();
        responseJson(["success" => true], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        responseJson(["error" => "Error al registrar la factura", "details" => $e->getMessage()], 500);
    }
    exit;
}

switch ($method) {
    case 'GET':
        // Obtenemos transacciones de finanzas
        $stmt = $pdo->prepare("SELECT id, fecha as date, tipo as type, categoria as category, metodo_pago as paymentMethod, descripcion as description, monto as amount FROM finanzas WHERE empresa_id = ? ORDER BY fecha DESC");
        $stmt->execute([$empresa_id]);
        $transactions = $stmt->fetchAll();

        responseJson($transactions);
        break;

    case 'POST':
        $type = $inputData['type'] ?? 'egreso'; // ingreso o egreso
        $category = $inputData['category'] ?? 'General';
        $description = $inputData['description'] ?? '';
        $amount = $inputData['amount'] ?? 0;
        $date = $inputData['date'] ?? date('Y-m-d');
        $paymentMethod = $inputData['paymentMethod'] ?? 'efectivo';
        
        $stmt = $pdo->prepare("INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES (?, ?, ?, ?, ?, ?, ?)");
        try {
            $stmt->execute([$empresa_id, $date, $type, $category, $description, $amount, $paymentMethod]);
            responseJson(["success" => true, "id" => $pdo->lastInsertId()], 201);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al registrar movimiento", "details" => $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        $id = $inputData['id'] ?? null;
        if (!$id) responseJson(["error" => "ID requerido"], 400);

        $type = $inputData['type'] ?? 'egreso';
        $category = $inputData['category'] ?? 'General';
        $description = $inputData['description'] ?? '';
        $amount = $inputData['amount'] ?? 0;
        $date = $inputData['date'] ?? date('Y-m-d');
        $paymentMethod = $inputData['paymentMethod'] ?? 'efectivo';
        
        $stmt = $pdo->prepare("UPDATE finanzas SET fecha = ?, tipo = ?, categoria = ?, descripcion = ?, monto = ?, metodo_pago = ? WHERE id = ? AND empresa_id = ?");
        try {
            $stmt->execute([$date, $type, $category, $description, $amount, $paymentMethod, $id, $empresa_id]);
            responseJson(["success" => true]);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al actualizar movimiento", "details" => $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if (!$id) responseJson(["error" => "ID requerido"], 400);
        
        $stmt = $pdo->prepare("DELETE FROM finanzas WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$id, $empresa_id]);
        responseJson(["success" => true]);
        break;

    default:
        responseJson(["error" => "Metodo no soportado"], 405);
}
