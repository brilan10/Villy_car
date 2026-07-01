<?php
require_once 'db.php';

function fixDoubleEncoding($str) {
    if (empty($str)) return $str;
    
    // Very specific oddities seen in the UI
    $search = [
        'T├®cnico',
        'Mat├¡as',
        'Dise├▒ador',
        '├¡', '├®', '├▒', '├│', '├║', '├±', '├ü', '├ë', '├ì', '├ô', '├Ü', '├æ'
    ];
    $replace = [
        'Técnico',
        'Matías',
        'Diseñador',
        'í', 'é', 'ñ', 'ó', 'ú', 'ñ', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ'
    ];
    
    return str_replace($search, $replace, $str);
}

try {
    $updatedCount = 0;
    
    // 1. Trabajadores
    $stmt = $pdo->query("SELECT id, nombre, cargo FROM trabajadores");
    $trabajadores = $stmt->fetchAll();
    foreach ($trabajadores as $t) {
        $nNombre = fixDoubleEncoding($t['nombre']);
        $nCargo = fixDoubleEncoding($t['cargo']);
        if ($nNombre !== $t['nombre'] || $nCargo !== $t['cargo']) {
            $u = $pdo->prepare("UPDATE trabajadores SET nombre=?, cargo=? WHERE id=?");
            $u->execute([$nNombre, $nCargo, $t['id']]);
            $updatedCount++;
        }
    }

    // 2. Clientes
    $stmt = $pdo->query("SELECT id, nombre FROM clientes");
    $clientes = $stmt->fetchAll();
    foreach ($clientes as $t) {
        $nNombre = fixDoubleEncoding($t['nombre']);
        if ($nNombre !== $t['nombre']) {
            $u = $pdo->prepare("UPDATE clientes SET nombre=? WHERE id=?");
            $u->execute([$nNombre, $t['id']]);
            $updatedCount++;
        }
    }

    // 3. Ventas
    $stmt = $pdo->query("SELECT id, cliente_nombre FROM ventas");
    $ventas = $stmt->fetchAll();
    foreach ($ventas as $t) {
        $nNombre = fixDoubleEncoding($t['cliente_nombre']);
        if ($nNombre !== $t['cliente_nombre']) {
            $u = $pdo->prepare("UPDATE ventas SET cliente_nombre=? WHERE id=?");
            $u->execute([$nNombre, $t['id']]);
            $updatedCount++;
        }
    }
    
    // 4. Finanzas (descripcion, categoria)
    $stmt = $pdo->query("SELECT id, descripcion, categoria FROM finanzas");
    $finanzas = $stmt->fetchAll();
    foreach ($finanzas as $t) {
        $nDesc = fixDoubleEncoding($t['descripcion']);
        $nCat = fixDoubleEncoding($t['categoria']);
        if ($nDesc !== $t['descripcion'] || $nCat !== $t['categoria']) {
            $u = $pdo->prepare("UPDATE finanzas SET descripcion=?, categoria=? WHERE id=?");
            $u->execute([$nDesc, $nCat, $t['id']]);
            $updatedCount++;
        }
    }
    
    // 5. Cuentas
    $stmt = $pdo->query("SELECT id, nombre_entidad FROM cuentas_cxc_cxp");
    $cuentas = $stmt->fetchAll();
    foreach ($cuentas as $t) {
        $nNombre = fixDoubleEncoding($t['nombre_entidad']);
        if ($nNombre !== $t['nombre_entidad']) {
            $u = $pdo->prepare("UPDATE cuentas_cxc_cxp SET nombre_entidad=? WHERE id=?");
            $u->execute([$nNombre, $t['id']]);
            $updatedCount++;
        }
    }

    echo json_encode(["success" => true, "updated" => $updatedCount]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
