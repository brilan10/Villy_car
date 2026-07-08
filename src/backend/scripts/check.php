<?php require 'src/backend/api/db.php'; $stmt = $pdo->query('SHOW COLUMNS FROM ordenes_trabajo'); print_r($stmt->fetchAll(PDO::FETCH_ASSOC)); ?>
