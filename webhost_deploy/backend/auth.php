<?php
require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $rut = $inputData['rut'] ?? '';
    $password = $inputData['password'] ?? '';
    
    if (empty($rut) || empty($password)) {
        responseJson(["error" => "RUT y contraseña son requeridos"], 400);
    }
    
    // First, check if there is ANY admin, if not, promote the first worker to admin
    $adminCheck = $pdo->query("SELECT count(*) FROM trabajadores WHERE rol = 'admin'")->fetchColumn();
    if ($adminCheck == 0) {
        $pdo->query("UPDATE trabajadores SET rol = 'admin' LIMIT 1");
    }

    $stmt = $pdo->prepare("SELECT id, empresa_id, nombre, rut, rol, password_hash FROM trabajadores WHERE rut = ? AND activo = 1");
    $stmt->execute([$rut]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password_hash'])) {
        responseJson([
            "success" => true,
            "user" => [
                "id" => $user['id'],
                "empresa_id" => $user['empresa_id'],
                "nombre" => $user['nombre'],
                "rut" => $user['rut'],
                "rol" => $user['rol']
            ]
        ]);
    } else {
        responseJson(["error" => "Credenciales inválidas"], 401);
    }
} else {
    responseJson(["error" => "Método no soportado"], 405);
}
?>
