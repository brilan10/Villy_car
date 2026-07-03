<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo->exec("ALTER TABLE agendas ADD COLUMN estado_pago VARCHAR(50) DEFAULT 'pendiente'");
} catch (PDOException $e) {}

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
        $cliente_email = $inputData['cliente_email'] ?? null;
        $fecha = $inputData['fecha'] ?? '';
        $hora = $inputData['hora'] ?? '';
        $tipo = $inputData['tipo'] ?? '';
        $monto = $inputData['monto'] ?? 0;
        $detalles = $inputData['detalles'] ?? '';
        $estado = $inputData['estado'] ?? 'Agendado';
        $trabajador = $inputData['trabajador'] ?? '';
        $estado_pago = $inputData['estado_pago'] ?? 'pendiente';

        if (empty($titulo) || empty($fecha) || empty($hora)) {
            responseJson(["error" => "Título, fecha y hora son obligatorios"], 400);
        }

        $alerta_enviada = 0;
        
        // Send email immediately as a confirmation
        if ($cliente_email) {
            require_once 'mailer.php';
            $enviado = enviarCorreoAlerta($cliente_email, $cliente, $titulo, $fecha, $hora, $empresa_id);
            if ($enviado) {
                $alerta_enviada = 1;
            }
        }

        $stmt = $pdo->prepare("INSERT INTO agendas (empresa_id, titulo, cliente, cliente_email, fecha, hora, tipo, monto, detalles, estado, trabajador, alerta_enviada, estado_pago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        try {
            $stmt->execute([$empresa_id, $titulo, $cliente, $cliente_email, $fecha, $hora, $tipo, $monto, $detalles, $estado, $trabajador, $alerta_enviada, $estado_pago]);
            $inputData['id'] = $pdo->lastInsertId();
            $inputData['alerta_enviada'] = $alerta_enviada;
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
        $cliente_email = $inputData['cliente_email'] ?? null;
        $fecha = $inputData['fecha'] ?? '';
        $hora = $inputData['hora'] ?? '';
        $tipo = $inputData['tipo'] ?? '';
        $monto = $inputData['monto'] ?? 0;
        $detalles = $inputData['detalles'] ?? '';
        $estado = $inputData['estado'] ?? 'Agendado';
        $trabajador = $inputData['trabajador'] ?? '';
        $estado_pago = $inputData['estado_pago'] ?? 'pendiente';

        $stmt = $pdo->prepare("UPDATE agendas SET titulo=?, cliente=?, cliente_email=?, fecha=?, hora=?, tipo=?, monto=?, detalles=?, estado=?, trabajador=?, estado_pago=? WHERE id=? AND empresa_id=?");
        try {
            $stmt->execute([$titulo, $cliente, $cliente_email, $fecha, $hora, $tipo, $monto, $detalles, $estado, $trabajador, $estado_pago, $id, $empresa_id]);
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
