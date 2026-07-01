<?php
require_once 'src/backend/api/db.php';
try {
    $pdo->exec("DROP DATABASE IF EXISTS villy_car");
    echo "Base de datos antigua eliminada con exito.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
