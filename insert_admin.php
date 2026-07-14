<?php
require_once 'src/backend/api/db.php';

$rut1 = '123';
$rut2 = 'admin';
$password = 'admin';
$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $pdo->query("INSERT IGNORE INTO empresas (id, nombre, rut) VALUES (1, 'Villy Car', '11111111-1')");
} catch (Exception $e) {
    echo "Error creating empresa: " . $e->getMessage() . "\n";
}

$stmt = $pdo->prepare("INSERT INTO trabajadores (empresa_id, nombre, rut, rol, password_hash, activo) VALUES (1, 'Administrador', ?, 'admin', ?, 1)");

try {
    $stmt->execute([$rut1, $hash]);
    echo "Usuario admin insertado (RUT: $rut1)\n";
} catch (Exception $e) {
    // If there's an error, maybe it already exists. Let's try updating it.
    $stmtUpdate = $pdo->prepare("UPDATE trabajadores SET password_hash = ?, rol = 'admin', activo = 1 WHERE rut = ?");
    $stmtUpdate->execute([$hash, $rut1]);
    echo "Usuario admin actualizado (RUT: $rut1)\n";
}

try {
    $stmt->execute([$rut2, $hash]);
    echo "Usuario admin insertado (RUT: $rut2)\n";
} catch (Exception $e) {
    $stmtUpdate = $pdo->prepare("UPDATE trabajadores SET password_hash = ?, rol = 'admin', activo = 1 WHERE rut = ?");
    $stmtUpdate->execute([$hash, $rut2]);
    echo "Usuario admin actualizado (RUT: $rut2)\n";
}

echo "Listo. Puedes iniciar sesion con rut: 123 o admin, y contraseña: admin\n";
?>
