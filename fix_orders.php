<?php
$_SERVER['SERVER_NAME'] = '127.0.0.1';
require 'src/backend/api/db.php';
$pdo->exec("UPDATE ordenes_trabajo SET empresa_id = 1, empresa_derivada_id = NULL WHERE id IN (31, 32)");
echo "Updated to company 1";
