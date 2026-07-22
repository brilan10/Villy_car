<?php
date_default_timezone_set('America/Santiago');

// Manejo de CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Si es un preflight request de CORS, terminar aqu??
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Credenciales de Produccion WebHost
$host = 'localhost'; 
$db   = 'villycar_base de datos'; // Si en hostinger usaste guiones bajos, cámbialo a villycar_base_de_datos
$user = 'villycar_joel'; 
$pass = 'abc.123.vilycar';

$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false, // Seguridad contra SQL Injections
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     http_response_code(500);
     echo json_encode(["error" => "Error de conexion a la base de datos", "details" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
     exit;
}

// Funci??n auxiliar para responder en formato JSON
function responseJson($data, $statusCode = 200) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Recibir el ID de empresa. Obligatorio para TODAS las peticiones de datos.
$empresa_id = isset($_GET['empresa_id']) ? intval($_GET['empresa_id']) : null;
// Si se env??a v??a POST/PUT body (JSON)
$inputJSON = file_get_contents('php://input');
$inputData = json_decode($inputJSON, TRUE);

if(!$empresa_id && isset($inputData['empresa_id'])) {
    $empresa_id = intval($inputData['empresa_id']);
}

