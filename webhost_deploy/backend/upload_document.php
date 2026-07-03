<?php
require_once 'db.php';

// Asegurar que el método es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responseJson(["error" => "Método no permitido"], 405);
}

// Verificar que se subió un archivo
if (!isset($_FILES['documento']) || $_FILES['documento']['error'] !== UPLOAD_ERR_OK) {
    responseJson(["error" => "No se subió ningún archivo o hubo un error"], 400);
}

// Crear directorio si no existe
$uploadDir = __DIR__ . '/uploads/nomina/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Generar nombre de archivo único
$fileExtension = pathinfo($_FILES['documento']['name'], PATHINFO_EXTENSION);
$fileName = uniqid('nomina_') . '.' . $fileExtension;
$targetFilePath = $uploadDir . $fileName;

// Mover el archivo
if (move_uploaded_file($_FILES['documento']['tmp_name'], $targetFilePath)) {
    // Retornar la URL relativa para guardarla en BD
    $fileUrl = '/backend/uploads/nomina/' . $fileName;
    responseJson(["success" => true, "archivo_url" => $fileUrl]);
} else {
    responseJson(["error" => "Error al mover el archivo al directorio de destino"], 500);
}
?>
