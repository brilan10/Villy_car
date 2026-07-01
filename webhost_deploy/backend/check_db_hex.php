<?php
require_once 'db.php';

try {
    $stmt = $pdo->query("SELECT id, nombre, HEX(nombre) as hex_nombre, cargo, HEX(cargo) as hex_cargo FROM trabajadores WHERE nombre LIKE 'Mat%' OR cargo LIKE 'T%' LIMIT 5");
    $rows = $stmt->fetchAll();
    echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
