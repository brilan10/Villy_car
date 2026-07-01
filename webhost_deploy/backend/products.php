<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!$empresa_id) {
    responseJson(["error" => "empresa_id es requerido"], 400);
}

switch ($method) {
    case 'GET':
        // Intenta crear la columna 'activo' si no existe
        try {
            $pdo->exec("ALTER TABLE productos ADD COLUMN activo TINYINT(1) DEFAULT 1");
        } catch (PDOException $e) {
            // Ignorar el error si ya existe
        }

        // Alias de columnas para que coincidan con lo que espera el frontend (ProductManager.jsx)
        $stmt = $pdo->prepare("SELECT id, empresa_id, sku AS codigo, nombre, 'General' AS categoria, precio_venta AS precio, precio_compra, precio_venta, tipo, stock_actual AS stock, imagen_url FROM productos WHERE empresa_id = ? AND activo = 1 ORDER BY created_at DESC");
        $stmt->execute([$empresa_id]);
        $productos = $stmt->fetchAll();
        responseJson($productos);
        break;

    case 'POST':
        $nombre = $inputData['nombre'] ?? '';
        $codigo = $inputData['codigo'] ?? null;
        $precio = $inputData['precio'] ?? 0;
        $precio_compra = $inputData['precio_compra'] ?? 0;
        $precio_venta = $inputData['precio_venta'] ?? $precio;
        $imagen_url = $inputData['imagen_url'] ?? null;
        $tipo = $inputData['tipo'] ?? 'objeto';
        $stock = $inputData['stock'] !== '' ? $inputData['stock'] : null;

        if (empty($nombre) || $precio_venta === '') {
            responseJson(["error" => "Nombre y precio son obligatorios"], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO productos (empresa_id, sku, nombre, precio_compra, precio_venta, tipo, stock_actual, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        try {
            $stmt->execute([$empresa_id, $codigo, $nombre, $precio_compra, $precio_venta, $tipo, $stock, $imagen_url]);
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
        $precio_compra = $inputData['precio_compra'] ?? 0;
        $precio_venta = $inputData['precio_venta'] ?? $precio;
        $imagen_url = $inputData['imagen_url'] ?? null;
        $tipo = $inputData['tipo'] ?? 'objeto';
        $stock = $inputData['stock'] !== '' ? $inputData['stock'] : null;

        $stmt = $pdo->prepare("UPDATE productos SET sku=?, nombre=?, precio_compra=?, precio_venta=?, tipo=?, stock_actual=?, imagen_url=? WHERE id=? AND empresa_id=?");
        try {
            $stmt->execute([$codigo, $nombre, $precio_compra, $precio_venta, $tipo, $stock, $imagen_url, $id, $empresa_id]);
            responseJson($inputData);
        } catch (PDOException $e) {
            responseJson(["error" => "Error al actualizar producto", "details" => $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if (!$id) responseJson(["error" => "ID es requerido para eliminar"], 400);

        try {
            $stmt = $pdo->prepare("DELETE FROM productos WHERE id=? AND empresa_id=?");
            $stmt->execute([$id, $empresa_id]);
            responseJson(["success" => true]);
        } catch (PDOException $e) {
            if ($e->getCode() == '23000' && strpos($e->getMessage(), '1451') !== false) {
                // Borrado Lógico: el producto ya fue vendido, no se puede borrar físicamente.
                try {
                    $pdo->exec("ALTER TABLE productos ADD COLUMN activo TINYINT(1) DEFAULT 1");
                } catch (PDOException $e2) {}

                $stmt = $pdo->prepare("UPDATE productos SET activo=0 WHERE id=? AND empresa_id=?");
                $stmt->execute([$id, $empresa_id]);
                responseJson(["success" => true, "message" => "Borrado lógico aplicado."]);
            } else {
                responseJson(["error" => "Error al eliminar producto", "details" => $e->getMessage()], 500);
            }
        }
        break;

    default:
        responseJson(["error" => "Metodo no soportado"], 405);
}
?>
