<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!$empresa_id) {
    responseJson(["error" => "empresa_id es requerido"], 400);
}

$action = $_GET['action'] ?? null;

if ($action === 'pay') {
    // Abono o pago total de una cuenta
    if ($method !== 'POST') responseJson(["error" => "Método no soportado"], 405);
    
    $cuenta_id = $inputData['cuenta_id'] ?? null;
    $monto = $inputData['monto'] ?? 0;
    $metodo_pago = $inputData['metodo_pago'] ?? 'transferencia';

    if (!$cuenta_id || $monto <= 0) responseJson(["error" => "Datos inválidos"], 400);

    try {
        $pdo->beginTransaction();

        // Check if it's a "Bebidas" aggregate account
        if (strpos(strval($cuenta_id), 'bebida_') === 0) {
            $trabajador_id = intval(str_replace('bebida_', '', $cuenta_id));
            
            // Mark all unpaid bebidas for this worker as paid
            $stmtUp = $pdo->prepare("UPDATE consumo_bebidas SET pagado = 1 WHERE empresa_id = ? AND trabajador_id = ? AND pagado = 0");
            $stmtUp->execute([$empresa_id, $trabajador_id]);
            
            $pdo->commit();
            responseJson(["success" => true, "nuevo_estado" => 'pagada', "monto_pagado" => $monto]);
            exit;
        }

        // 1. Obtener la cuenta para ver si el pago excede y actualizar
        $stmtCuenta = $pdo->prepare("SELECT * FROM cuentas_cxc_cxp WHERE id = ? AND empresa_id = ?");
        $stmtCuenta->execute([$cuenta_id, $empresa_id]);
        $cuenta = $stmtCuenta->fetch();
        if (!$cuenta) throw new Exception("Cuenta no encontrada");

        $nuevo_pagado = $cuenta['monto_pagado'] + $monto;
        $estado = $nuevo_pagado >= $cuenta['monto_total'] ? 'pagada' : 'debe';

        $stmtUp = $pdo->prepare("UPDATE cuentas_cxc_cxp SET monto_pagado = ?, estado = ? WHERE id = ?");
        $stmtUp->execute([$nuevo_pagado, $estado, $cuenta_id]);

        // 2. Si la cuenta cambia a "pagada", quizás se podría inyectar algo a finanzas,
        // Pero actualmente estamos listando cuentas pagadas como egresos en finances.php.
        // Si el pago es un "abono", entonces podríamos reflejarlo en finanzas, pero en nuestro
        // finanzas.php actual tomamos `monto_total` si está 'pagada'. 
        // Para simplificar, asimilamos que los abonos son movimientos internos o ajustamos.

        $pdo->commit();
        responseJson(["success" => true, "nuevo_estado" => $estado, "monto_pagado" => $nuevo_pagado]);

    } catch (Exception $e) {
        $pdo->rollBack();
        responseJson(["error" => "Error al abonar", "details" => $e->getMessage()], 500);
    }
    exit;
}

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT * FROM cuentas_cxc_cxp WHERE empresa_id = ? ORDER BY fecha_vencimiento ASC");
        $stmt->execute([$empresa_id]);
        $cuentas = $stmt->fetchAll();

        // Inject unpaid bebidas as Accounts Receivable
        $stmtBebidas = $pdo->prepare("
            SELECT t.id as trabajador_id, t.rut, t.nombre, SUM(c.monto) as total_deuda 
            FROM consumo_bebidas c 
            JOIN trabajadores t ON c.trabajador_id = t.id 
            WHERE c.empresa_id = ? AND c.pagado = 0 
            GROUP BY t.id, t.rut, t.nombre
        ");
        $stmtBebidas->execute([$empresa_id]);
        $bebidas_agrupadas = $stmtBebidas->fetchAll();

        foreach($bebidas_agrupadas as $b) {
            $cuentas[] = [
                "id" => "bebida_" . $b['trabajador_id'],
                "empresa_id" => $empresa_id,
                "tipo" => "cobrar",
                "tipo_entidad" => "trabajador",
                "rut" => $b['rut'],
                "nombre_entidad" => $b['nombre'] . " (Consumo Bebidas)",
                "monto_total" => floatval($b['total_deuda']),
                "monto_pagado" => 0,
                "fecha_vencimiento" => date('Y-m-t'), // End of current month
                "estado" => "debe",
                "created_at" => date('Y-m-d H:i:s')
            ];
        }

        responseJson($cuentas);
        break;

    case 'POST':
        $tipo = $inputData['tipo'] ?? 'pagar'; // 'pagar' o 'cobrar'
        $tipo_entidad = $inputData['tipo_entidad'] ?? 'proveedor';
        $rut = $inputData['rut'] ?? '00000000-0';
        $numero_documento = $inputData['numero_documento'] ?? null;
        $nombre_entidad = $inputData['nombre_entidad'] ?? '';
        $monto_total = $inputData['monto_total'] ?? 0;
        $fecha_vencimiento = $inputData['fecha_vencimiento'] ?? date('Y-m-d', strtotime('+30 days'));
        $estado = $inputData['estado'] ?? 'debe';

        $stmt = $pdo->prepare("INSERT INTO cuentas_cxc_cxp (empresa_id, tipo, tipo_entidad, rut, numero_documento, nombre_entidad, monto_total, fecha_vencimiento, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$empresa_id, $tipo, $tipo_entidad, $rut, $numero_documento, $nombre_entidad, $monto_total, $fecha_vencimiento, $estado]);
        responseJson(["success" => true, "id" => $pdo->lastInsertId()], 201);
        break;

    case 'PUT':
        $id = $inputData['id'] ?? null;
        if (!$id) responseJson(["error" => "ID requerido"], 400);

        // Edit basic details
        $nombre_entidad = $inputData['nombre_entidad'] ?? '';
        $monto_total = $inputData['monto_total'] ?? 0;
        $fecha_vencimiento = $inputData['fecha_vencimiento'] ?? null;

        $stmt = $pdo->prepare("UPDATE cuentas_cxc_cxp SET nombre_entidad = ?, monto_total = ?, fecha_vencimiento = ? WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$nombre_entidad, $monto_total, $fecha_vencimiento, $id, $empresa_id]);
        responseJson(["success" => true]);
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if (!$id) responseJson(["error" => "ID requerido"], 400);

        $stmt = $pdo->prepare("DELETE FROM cuentas_cxc_cxp WHERE id = ? AND empresa_id = ?");
        $stmt->execute([$id, $empresa_id]);
        responseJson(["success" => true]);
        break;

    default:
        responseJson(["error" => "Metodo no soportado"], 405);
}
