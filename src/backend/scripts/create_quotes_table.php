<?php
require_once 'src/backend/api/db.php';
try {
    $sql = "CREATE TABLE IF NOT EXISTS cotizaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        cliente VARCHAR(255),
        rut VARCHAR(50),
        telefono VARCHAR(50),
        descripcion_proyecto TEXT,
        items_json LONGTEXT,
        subtotal DECIMAL(10,2) DEFAULT 0,
        iva DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $pdo->exec($sql);
    echo "Tabla cotizaciones creada con exito.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
