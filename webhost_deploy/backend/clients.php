<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!$empresa_id) {
    responseJson(["error" => "empresa_id es requerido"], 400);
}

switch ($method) {
    case 'GET':
        // Seleccionamos TODOS los clientes para que sean compartidos entre todas las empresas
        $stmt = $pdo->prepare("SELECT * FROM clientes ORDER BY created_at DESC");
        $stmt->execute();
        $clientes = $stmt->fetchAll();
        responseJson($clientes);
        break;

    case 'POST':
        $nombre = $inputData['nombre'] ?? '';
        $rut = $inputData['rut'] ?? '';
        $email = $inputData['email'] ?? null;
        $telefono = $inputData['telefono'] ?? null;

        if (empty($nombre) || empty($rut)) {
            responseJson(["error" => "Nombre y RUT son obligatorios"], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO clientes (empresa_id, rut, nombre, email, telefono) VALUES (?, ?, ?, ?, ?)");
        try {
            $stmt->execute([$empresa_id, $rut, $nombre, $email, $telefono]);
            $inputData['id'] = $pdo->lastInsertId();
            responseJson($inputData, 201);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al crear cliente", "details" => $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        $id = $inputData['id'] ?? null;
        if (!$id) responseJson(["error" => "ID es requerido para actualizar"], 400);

        $nombre = $inputData['nombre'] ?? '';
        $rut = $inputData['rut'] ?? '';
        $email = $inputData['email'] ?? null;
        $telefono = $inputData['telefono'] ?? null;

        // Actualizamos sin filtrar por empresa_id para que cualquier empresa pueda editarlo
        $stmt = $pdo->prepare("UPDATE clientes SET rut=?, nombre=?, email=?, telefono=? WHERE id=?");
        try {
            $stmt->execute([$rut, $nombre, $email, $telefono, $id]);
            responseJson($inputData);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al actualizar cliente", "details" => $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if (!$id) responseJson(["error" => "ID es requerido para eliminar"], 400);

        // Eliminamos sin filtrar por empresa_id para que cualquier empresa pueda eliminarlo
        $stmt = $pdo->prepare("DELETE FROM clientes WHERE id=?");
        try {
            $stmt->execute([$id]);
            responseJson(["success" => true]);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al eliminar cliente", "details" => $e->getMessage()], 500);
        }
        break;

    default:
        responseJson(["error" => "Metodo no soportado"], 405);
}
?>
