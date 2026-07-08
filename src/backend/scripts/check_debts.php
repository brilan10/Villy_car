<?php
$isLocalhost = true;
$host = '127.0.0.1';
$db   = 'villycar_sistema';
$user = 'root';
$pass = '';

$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$stmt = $pdo->query("SELECT * FROM cuentas_por_cobrar_pagar WHERE tipo_entidad='trabajador'");
echo "ACCOUNTS:\n";
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

$stmt2 = $pdo->query("SELECT * FROM consumo_bebidas");
echo "CONSUMOS:\n";
print_r($stmt2->fetchAll(PDO::FETCH_ASSOC));
