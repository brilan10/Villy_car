<?php
require_once __DIR__ . '/src/backend/api/db.php';

try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS anexos_trabajador (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        trabajador_id INT NOT NULL,
        fecha DATE,
        sueldo_base_nuevo DECIMAL(10,2),
        detalle TEXT,
        archivo_url VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
        FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE
    )");
    echo "Tabla anexos_trabajador creada exitosamente.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
