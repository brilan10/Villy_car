<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!$empresa_id) {
    responseJson(["error" => "empresa_id es requerido"], 400);
}

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT * FROM agendas WHERE empresa_id = ? ORDER BY fecha ASC, hora ASC");
        $stmt->execute([$empresa_id]);
        $agendas = $stmt->fetchAll();
        responseJson($agendas);
        break;

    case 'POST':
        $titulo = $inputData['titulo'] ?? '';
        $cliente = $inputData['cliente'] ?? '';
        $fecha = $inputData['fecha'] ?? '';
        $hora = $inputData['hora'] ?? '';
        $tipo = $inputData['tipo'] ?? '';
        $monto = $inputData['monto'] ?? 0;
        $detalles = $inputData['detalles'] ?? '';
        $estado = $inputData['estado'] ?? 'Agendado';
        $trabajador = $inputData['trabajador'] ?? '';

        if (empty($titulo) || empty($fecha) || empty($hora)) {
            responseJson(["error" => "Título, fecha y hora son obligatorios"], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO agendas (empresa_id, titulo, cliente, fecha, hora, tipo, monto, detalles, estado, trabajador) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        try {
            $stmt->execute([$empresa_id, $titulo, $cliente, $fecha, $hora, $tipo, $monto, $detalles, $estado, $trabajador]);
            $inputData['id'] = $pdo->lastInsertId();
            responseJson($inputData, 201);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al crear agenda", "details" => $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        $id = $inputData['id'] ?? null;
        if (!$id) responseJson(["error" => "ID es requerido para actualizar"], 400);

        $titulo = $inputData['titulo'] ?? '';
        $cliente = $inputData['cliente'] ?? '';
        $fecha = $inputData['fecha'] ?? '';
        $hora = $inputData['hora'] ?? '';
        $tipo = $inputData['tipo'] ?? '';
        $monto = $inputData['monto'] ?? 0;
        $detalles = $inputData['detalles'] ?? '';
        $estado = $inputData['estado'] ?? 'Agendado';
        $trabajador = $inputData['trabajador'] ?? '';

        $stmt = $pdo->prepare("UPDATE agendas SET titulo=?, cliente=?, fecha=?, hora=?, tipo=?, monto=?, detalles=?, estado=?, trabajador=? WHERE id=? AND empresa_id=?");
        try {
            $stmt->execute([$titulo, $cliente, $fecha, $hora, $tipo, $monto, $detalles, $estado, $trabajador, $id, $empresa_id]);
            responseJson($inputData);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al actualizar agenda", "details" => $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if (!$id) responseJson(["error" => "ID es requerido para eliminar"], 400);

        $stmt = $pdo->prepare("DELETE FROM agendas WHERE id=? AND empresa_id=?");
        try {
            $stmt->execute([$id, $empresa_id]);
            responseJson(["success" => true]);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al eliminar agenda", "details" => $e->getMessage()], 500);
        }
        break;

    default:
        responseJson(["error" => "Metodo no soportado"], 405);
}
?>
