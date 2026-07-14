<?php
require_once 'db.php';

$rut1 = '123';
$rut2 = 'admin';
$password = 'admin';
$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $pdo->query("INSERT IGNORE INTO empresas (id, nombre, rut) VALUES (1, 'Villy Car', '11111111-1')");
} catch (Exception $e) {
    // Ignore error if it fails
}

$stmt = $pdo->prepare("INSERT INTO trabajadores (empresa_id, nombre, rut, rol, password_hash, activo) VALUES (1, 'Administrador', ?, 'admin', ?, 1)");

try {
    $stmt->execute([$rut1, $hash]);
    echo "Usuario admin insertado (RUT: $rut1) con exito.<br>";
} catch (Exception $e) {
    $stmtUpdate = $pdo->prepare("UPDATE trabajadores SET password_hash = ?, rol = 'admin', activo = 1 WHERE rut = ?");
    $stmtUpdate->execute([$hash, $rut1]);
    echo "Usuario admin actualizado (RUT: $rut1) con exito.<br>";
}

try {
    $stmt->execute([$rut2, $hash]);
    echo "Usuario admin insertado (RUT: $rut2) con exito.<br>";
} catch (Exception $e) {
    $stmtUpdate = $pdo->prepare("UPDATE trabajadores SET password_hash = ?, rol = 'admin', activo = 1 WHERE rut = ?");
    $stmtUpdate->execute([$hash, $rut2]);
    echo "Usuario admin actualizado (RUT: $rut2) con exito.<br>";
}

echo "Listo. Puedes volver e iniciar sesion con rut: 123 o admin, y contrasena: admin";
?>
