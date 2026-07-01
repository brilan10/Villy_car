<?php
require_once 'src/backend/api/db.php';
try {
    $pdo->exec("ALTER TABLE trabajadores ADD COLUMN archivo_contrato VARCHAR(255) NULL");
    echo "Agregado archivo_contrato\n";
} catch (Exception $e) {
    echo "Error archivo_contrato: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE trabajadores ADD COLUMN archivo_finiquito VARCHAR(255) NULL");
    echo "Agregado archivo_finiquito\n";
} catch (Exception $e) {
    echo "Error archivo_finiquito: " . $e->getMessage() . "\n";
}
?>
