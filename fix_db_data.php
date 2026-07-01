<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$dbContent = file_get_contents('src/backend/api/db.php');
preg_match('/\$host = (.*?);/', $dbContent, $hostMatch);
preg_match('/\$db   = (.*?);/', $dbContent, $dbMatch);
preg_match('/\$user = (.*?);/', $dbContent, $userMatch);
preg_match('/\$pass = (.*?);/', $dbContent, $passMatch);

$host = str_replace(["'", '"'], "", trim($hostMatch[1] ?? 'localhost'));
$db = str_replace(["'", '"'], "", trim($dbMatch[1] ?? 'villycar_sistema'));
$user = str_replace(["'", '"'], "", trim($userMatch[1] ?? 'root'));
$pass = str_replace(["'", '"'], "", trim($passMatch[1] ?? ''));

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // 1. Fix Quotes
    $stmt = $pdo->query("UPDATE cotizaciones SET empresa_id = 1");
    echo "Cotizaciones actualizadas a J2 (empresa_id = 1). Filas afectadas: " . $stmt->rowCount() . "\n";
    
    // 2. Clear Finances
    $stmt2 = $pdo->query("TRUNCATE TABLE finanzas");
    $stmt3 = $pdo->query("TRUNCATE TABLE cierres_caja");
    echo "Registros financieros y cierres de caja eliminados (TRUNCATE).\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
