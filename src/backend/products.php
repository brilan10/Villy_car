<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!$empresa_id) {
    responseJson(["error" => "empresa_id es requerido"], 400);
}

switch ($method) {
    case 'GET':
        // Alias de columnas para que coincidan con lo que espera el frontend (ProductManager.jsx)
        $stmt = $pdo->prepare("SELECT id, empresa_id, sku AS codigo, nombre, 'General' AS categoria, precio_venta AS precio, tipo, stock_actual AS stock FROM productos WHERE empresa_id = ? ORDER BY created_at DESC");
        $stmt->execute([$empresa_id]);
        $productos = $stmt->fetchAll();
        responseJson($productos);
        break;

    case 'POST':
        $nombre = $inputData['nombre'] ?? '';
        $codigo = $inputData['codigo'] ?? null;
        // La categoría no se guarda en esta tabla (es categoria_id), por ahora la ignoramos o ponemos null
        $precio = $inputData['precio'] ?? 0;
        $tipo = $inputData['tipo'] ?? 'objeto';
        $stock = $inputData['stock'] !== '' ? $inputData['stock'] : null;

        if (empty($nombre) || $precio === '') {
            responseJson(["error" => "Nombre y precio son obligatorios"], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO productos (empresa_id, sku, nombre, precio_venta, tipo, stock_actual) VALUES (?, ?, ?, ?, ?, ?)");
        try {
            $stmt->execute([$empresa_id, $codigo, $nombre, $precio, $tipo, $stock]);
            $inputData['id'] = $pdo->lastInsertId();
            responseJson($inputData, 201);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al crear producto", "details" => $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        $id = $inputData['id'] ?? null;
        if (!$id) responseJson(["error" => "ID es requerido para actualizar"], 400);

        $nombre = $inputData['nombre'] ?? '';
        $codigo = $inputData['codigo'] ?? null;
        $precio = $inputData['precio'] ?? 0;
        $tipo = $inputData['tipo'] ?? 'objeto';
        $stock = $inputData['stock'] !== '' ? $inputData['stock'] : null;

        $stmt = $pdo->prepare("UPDATE productos SET sku=?, nombre=?, precio_venta=?, tipo=?, stock_actual=? WHERE id=? AND empresa_id=?");
        try {
            $stmt->execute([$codigo, $nombre, $precio, $tipo, $stock, $id, $empresa_id]);
            responseJson($inputData);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al actualizar producto", "details" => $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if (!$id) responseJson(["error" => "ID es requerido para eliminar"], 400);

        $stmt = $pdo->prepare("DELETE FROM productos WHERE id=? AND empresa_id=?");
        try {
            $stmt->execute([$id, $empresa_id]);
            responseJson(["success" => true]);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al eliminar producto (puede que esté en uso en alguna venta)", "details" => $e->getMessage()], 500);
        }
        break;

    default:
        responseJson(["error" => "Metodo no soportado"], 405);
}
?>
