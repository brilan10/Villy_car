<?php
$_SERVER['SERVER_NAME'] = '127.0.0.1';
require 'src/backend/api/db.php';
$stmt = $pdo->query('SELECT id, empresa_id, empresa_derivada_id, cliente_nombre, estado, fecha_ingreso FROM ordenes_trabajo WHERE empresa_id = 1 ORDER BY id DESC LIMIT 5');
print_r($stmt->fetchAll());
