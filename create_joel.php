<?php
require 'src/backend/api/db.php';

$hash = password_hash('admin', PASSWORD_DEFAULT);
$rut = 'admin';
$nombre = 'Joel';

// Delete if exists
$pdo->query("DELETE FROM trabajadores WHERE rut = 'admin'");

// Insert into all 4 companies
for ($i = 1; $i <= 4; $i++) {
    $stmt = $pdo->prepare("INSERT INTO trabajadores (empresa_id, rut, nombre, cargo, sueldo_base, rol, password_hash, activo) VALUES (?, ?, ?, 'Administrador General', 1500000, 'admin', ?, 1)");
    $stmt->execute([$i, $rut, $nombre, $hash]);
}

echo "Joel (admin) creado exitosamente en todas las empresas.";
?>
