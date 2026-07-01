<?php
require_once 'db.php';

$sql = "ALTER TABLE `liquidaciones_sueldo` ADD COLUMN `dias_trabajados` INT NOT NULL DEFAULT 30;";

try {
    $pdo->exec($sql);
    echo "Column dias_trabajados added successfully!";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}

?>
