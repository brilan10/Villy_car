<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!$empresa_id) {
    responseJson(["error" => "empresa_id es requerido"], 400);
}

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT * FROM ventas WHERE empresa_id = ? ORDER BY fecha DESC");
        $stmt->execute([$empresa_id]);
        $ventas = $stmt->fetchAll();
        
        // Fetch items para cada venta (puede no ser performante para cientos de ventas, pero para el prototipo está bien)
        // Idealmente sería un JOIN o fetch por demanda
        foreach($ventas as &$venta) {
            $stmtDet = $pdo->prepare("SELECT * FROM detalles_venta WHERE venta_id = ?");
            $stmtDet->execute([$venta['id']]);
            $venta['items'] = $stmtDet->fetchAll();
        }

        responseJson($ventas);
        break;

    case 'POST':
        // Payload expected:
        // { 
        //   "empresa_id": 1,
        //   "cierre_caja_id": null,
        //   "total": 15000,
        //   "metodo_pago": "efectivo",
        //   "condicion_pago": "contado",
        //   "estado": "pagado",
        //   "items": [
        //      { "id": 12, "nombre": "Prod", "precio": 5000, "cantidad": 3 }
        //   ]
        // }
        
        $total = $inputData['total'] ?? 0;
        $metodo_pago = $inputData['metodo_pago'] ?? 'efectivo';
        $condicion_pago = $inputData['condicion_pago'] ?? 'contado';
        $estado = $inputData['estado'] ?? 'pagado';
        $items = $inputData['items'] ?? [];
        $cierre_caja_id = $inputData['cierre_caja_id'] ?? null;

        if (empty($items)) {
            responseJson(["error" => "La venta debe tener al menos un producto"], 400);
        }

        try {
            $pdo->beginTransaction();

            // 1. Crear Venta
            $stmt = $pdo->prepare("INSERT INTO ventas (empresa_id, total, metodo_pago) VALUES (?, ?, ?)");
            $stmt->execute([$empresa_id, $total, $metodo_pago]);
            $venta_id = $pdo->lastInsertId();

            // 2. Insertar Detalles y Descontar Stock
            foreach ($items as $item) {
                $producto_id = $item['id']; // This is the ID from the frontend catalog (which matches DB)
                $precio_unitario = $item['precio'];
                $cantidad = $item['cantidad'] ?? 1;
                $subtotal = $precio_unitario * $cantidad;

                $stmtDet = $pdo->prepare("INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)");
                $stmtDet->execute([$venta_id, $producto_id, $cantidad, $precio_unitario, $subtotal]);

                // Descontar Stock si no es null
                $stmtStock = $pdo->prepare("UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ? AND empresa_id = ? AND stock_actual IS NOT NULL");
                $stmtStock->execute([$cantidad, $producto_id, $empresa_id]);
            }

            // Si es pago a crédito, se debe crear en la tabla cuentas_cxc_cxp (Cobrar)
            if ($condicion_pago === 'credito') {
                $stmtCred = $pdo->prepare("INSERT INTO cuentas_cxc_cxp (empresa_id, tipo, tipo_entidad, rut, nombre_entidad, monto_total, fecha_vencimiento, estado) VALUES (?, 'cobrar', 'cliente', '00000000-0', 'Cliente Venta', ?, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'debe')");
                $stmtCred->execute([$empresa_id, $total]);
            }

            $pdo->commit();
            responseJson(["success" => true, "venta_id" => $venta_id], 201);
            
        } catch (PDOException $e) {
            $pdo->rollBack();
            responseJson(["error" => "Error al registrar la venta", "details" => $e->getMessage()], 500);
        }
        break;

    default:
        responseJson(["error" => "Metodo no soportado"], 405);
}
