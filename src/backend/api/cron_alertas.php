<?php
/**
 * Cron script to send email alerts for appointments.
 * This should be scheduled to run every 5 minutes in cPanel.
 * Command: /usr/local/bin/php /home/usuario/public_html/api/cron_alertas.php
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

try {
    // We select appointments where the date is today or tomorrow and time is within the next 60 minutes
    // And where an alert hasn't been sent yet.
    
    $stmt = $pdo->query("
        SELECT id, cliente, cliente_email, titulo, fecha, hora, empresa_id 
        FROM agendas 
        WHERE alerta_enviada = 0 
          AND cliente_email IS NOT NULL 
          AND cliente_email != ''
    ");
    $appointments = $stmt->fetchAll();

    $current_time = time();
    $sent_count = 0;

    foreach ($appointments as $appt) {
        $appointment_time = strtotime($appt['fecha'] . ' ' . $appt['hora']);
        $time_diff = $appointment_time - $current_time;

        // If the appointment is in the next 60 minutes (3600 seconds)
        // Or if it's slightly past (up to 15 mins) just in case cron was delayed
        if ($time_diff <= 3600 && $time_diff >= -900) {
            $enviado = enviarCorreoAlerta(
                $appt['cliente_email'], 
                $appt['cliente'], 
                $appt['titulo'], 
                $appt['fecha'], 
                $appt['hora'],
                $appt['empresa_id']
            );

            if ($enviado) {
                // Mark as sent
                $update_stmt = $pdo->prepare("UPDATE agendas SET alerta_enviada = 1 WHERE id = ?");
                $update_stmt->execute([$appt['id']]);
                $sent_count++;
            }
        }
    }

    echo "Cron completado. Correos enviados: $sent_count\n";

    // Auto-limpieza de archivos de ordenes entregadas hace mas de 30 dias
    $thirtyDaysAgo = date('Y-m-d H:i:s', strtotime('-30 days'));
    $stmtOldFiles = $pdo->query("SELECT id, archivos FROM ordenes_trabajo WHERE estado = 'entregado' AND fecha_entrega < '$thirtyDaysAgo' AND archivos IS NOT NULL AND archivos != '[]'");
    $oldOrders = $stmtOldFiles->fetchAll();
    
    $deleted_files_count = 0;
    foreach ($oldOrders as $oldOrd) {
        $archivosArray = json_decode($oldOrd['archivos'], true);
        if (is_array($archivosArray)) {
            foreach ($archivosArray as $url) {
                $fileName = basename($url);
                $filePath = __DIR__ . '/uploads/nomina/' . $fileName;
                if (file_exists($filePath)) {
                    if(unlink($filePath)) {
                        $deleted_files_count++;
                    }
                }
            }
        }
    }
    
    // Limpiar BD
    $pdo->query("UPDATE ordenes_trabajo SET archivos = NULL WHERE estado = 'entregado' AND fecha_entrega < '$thirtyDaysAgo' AND archivos IS NOT NULL");
    
    echo "Limpieza de archivos completada. Archivos eliminados: $deleted_files_count\n";

} catch (PDOException $e) {
    echo "Error ejecutando cron: " . $e->getMessage() . "\n";
}
?>
