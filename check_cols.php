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
    
    $stmt = $pdo->query('SHOW COLUMNS FROM ordenes_trabajo');
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
