<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!$empresa_id) {
    responseJson(["error" => "empresa_id es requerido"], 400);
}

switch ($method) {
    case 'GET':
        $trabajador_id = isset($_GET['trabajador_id']) ? intval($_GET['trabajador_id']) : null;
        if (!$trabajador_id) {
            responseJson(["error" => "trabajador_id requerido"], 400);
        }
        $stmt = $pdo->prepare("SELECT * FROM consumo_bebidas WHERE empresa_id = ? AND trabajador_id = ? AND pagado = 0 ORDER BY fecha DESC");
        $stmt->execute([$empresa_id, $trabajador_id]);
        $consumos = $stmt->fetchAll();
        
        $total = 0;
        foreach($consumos as $c) {
            $total += floatval($c['monto']);
        }

        responseJson([
            "total_deuda" => $total,
            "detalles" => $consumos
        ]);
        break;

    case 'POST':
        $trabajador_id = $inputData['trabajador_id'] ?? null;
        $monto = $inputData['monto'] ?? 0;
        $descripcion = $inputData['descripcion'] ?? 'Bebida consumida';
        $fecha = $inputData['fecha'] ?? date('Y-m-d');

        if (!$trabajador_id || $monto <= 0) {
            responseJson(["error" => "trabajador_id y monto son requeridos"], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO consumo_bebidas (empresa_id, trabajador_id, fecha, monto, descripcion) VALUES (?, ?, ?, ?, ?)");
        try {
            $stmt->execute([$empresa_id, $trabajador_id, $fecha, $monto, $descripcion]);
            responseJson(["success" => true, "id" => $pdo->lastInsertId()], 201);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al registrar consumo", "details" => $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        $trabajador_id = $inputData['trabajador_id'] ?? null;
        if (!$trabajador_id) responseJson(["error" => "trabajador_id requerido"], 400);

        // Marcar todas las bebidas no pagadas del mes como pagadas
        $stmt = $pdo->prepare("UPDATE consumo_bebidas SET pagado = 1 WHERE empresa_id = ? AND trabajador_id = ? AND pagado = 0");
        try {
            $stmt->execute([$empresa_id, $trabajador_id]);
            responseJson(["success" => true]);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al actualizar consumos", "details" => $e->getMessage()], 500);
        }
        break;

    default:
        responseJson(["error" => "Metodo no soportado"], 405);
}
?>
