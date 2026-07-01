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
