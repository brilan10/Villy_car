<?php
require 'src/backend/api/db.php';
$stmt = $pdo->query('SELECT id, cliente, cliente_email, fecha, hora, alerta_enviada FROM agendas ORDER BY id DESC LIMIT 5');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
