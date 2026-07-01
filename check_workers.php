<?php
$_SERVER['SERVER_NAME'] = '127.0.0.1';
require 'src/backend/api/db.php';
$stmt = $pdo->query("SELECT * FROM trabajadores WHERE nombre = '' OR nombre IS NULL");
print_r($stmt->fetchAll());
