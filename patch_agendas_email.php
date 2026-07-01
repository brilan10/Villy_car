<?php
require_once __DIR__ . '/src/backend/api/db.php';

try {
    $pdo->exec("ALTER TABLE agendas ADD COLUMN cliente_email VARCHAR(100) DEFAULT NULL");
    echo "Column cliente_email added to agendas.\n";
} catch (PDOException $e) {
    echo "Info (cliente_email): " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE agendas ADD COLUMN alerta_enviada BOOLEAN DEFAULT FALSE");
    echo "Column alerta_enviada added to agendas.\n";
} catch (PDOException $e) {
    echo "Info (alerta_enviada): " . $e->getMessage() . "\n";
}
?>
