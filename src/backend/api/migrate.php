<?php
require_once 'db.php';

try {
    $pdo->exec("ALTER TABLE ordenes_trabajo ADD COLUMN area_asignada VARCHAR(50) DEFAULT 'Ambas'");
    echo "Column area_asignada added.\n";
} catch (Exception $e) {}

try {
    $pdo->exec("ALTER TABLE ordenes_trabajo ADD COLUMN archivos TEXT");
    echo "Column archivos added.\n";
} catch (Exception $e) {}

try {
    $pdo->exec("ALTER TABLE ordenes_trabajo ADD COLUMN empresa_derivada_id INT DEFAULT NULL");
    echo "Column empresa_derivada_id added.\n";
} catch (Exception $e) {}

try {
    $pdo->exec("ALTER TABLE agendas ADD COLUMN empresa_derivada_id INT DEFAULT NULL");
    echo "Column empresa_derivada_id added to agendas.\n";
} catch (Exception $e) {}

try {
    $pdo->exec("ALTER TABLE trabajadores ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL");
    $pdo->exec("ALTER TABLE trabajadores ADD COLUMN rol ENUM('admin', 'trabajador') DEFAULT 'trabajador'");
    
    // Set default password "123456" for all existing workers
    $defaultHash = password_hash("123456", PASSWORD_DEFAULT);
    $pdo->exec("UPDATE trabajadores SET password_hash = '$defaultHash' WHERE password_hash IS NULL");
    echo "Columns password_hash and rol added to trabajadores.\n";
} catch (Exception $e) {
    echo "Error updating trabajadores: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE ordenes_trabajo ADD COLUMN trabajador_asignado VARCHAR(150) DEFAULT NULL");
    echo "Column trabajador_asignado added to ordenes_trabajo.\n";
} catch (Exception $e) {
    echo "Error updating ordenes_trabajo: " . $e->getMessage() . "\n";
}

echo "Migration done.";
