<?php
require_once 'src/backend/api/db.php';
try {
    $pdo->exec("ALTER TABLE productos ADD COLUMN activo TINYINT(1) DEFAULT 1");
    echo "Columna activo anadida con exito.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
