<?php
require_once 'db.php';

function fixDoubleEncoding($str) {
    if (empty($str)) return $str;
    
    // Very specific oddities seen in the UI
    $search = [
        'T|-cnico', 'T|cnico', 'T|-cnico Instalador',
        'Mat|-as', 'Mat|¡as', 'Mat|-', 'Mat|as',
        'DiseÃ±ador', 'Ã±'
    ];
    $replace = [
        'Técnico', 'Técnico', 'Técnico Instalador',
        'Matías', 'Matías', 'Matías', 'Matías',
        'Diseñador', 'ñ'
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

    echo json_encode(["success" => true, "updated" => $updatedCount]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
