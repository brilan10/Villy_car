<?php
require_once 'db.php';

function fixDoubleEncoding($str) {
    if (empty($str)) return $str;
    
    $search = [
        'Ã¡', 'Ã©', 'Ã­', 'Ã³', 'Ãº', 'Ã±',
        'Ã ', 'Ã‰', 'Ã ', 'Ã“', 'Ãš', 'Ã‘',
        'Â°', 'Â¿', 'Â¡', 'Ã¼', 'Ãœ'
    ];
    $replace = [
        'á', 'é', 'í', 'ó', 'ú', 'ñ',
        'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ',
        '°', '¿', '¡', 'ü', 'Ü'
    ];
    
    $fixed = str_replace($search, $replace, $str);
    $fixed = str_replace(['Mat|-as', 'Mat|¡as', 'Mat|-'], 'Matías', $fixed);
    
    return $fixed;
}

try {
    $updatedCount = 0;
    
    // 5. Cuentas (cuentas_cxc_cxp)
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
