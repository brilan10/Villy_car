<?php
/**
 * Helper to send email notifications.
 * Uses PHPMailer + SMTP for reliable delivery.
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require_once __DIR__ . '/libs/PHPMailer/Exception.php';
require_once __DIR__ . '/libs/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/libs/PHPMailer/SMTP.php';

function enviarCorreoAlerta($email, $cliente, $titulo, $fecha, $hora, $empresa_id = 1) {
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $nombres_empresas = [
        1 => 'Villy Car Tuning',
        2 => 'Transporte J&J',
        3 => 'Dwork',
        4 => 'J2 Publicidad'
    ];
    $nombre_empresa = $nombres_empresas[$empresa_id] ?? 'Sistema de Agendas';

    $mail = new PHPMailer(true);

    try {
        // Configuración del servidor SMTP (Gmail)
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'villycar7@gmail.com'; // Correo que envía
        $mail->Password   = 'wwndarggwvurkmgh';    // Contraseña de Aplicación de Google
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->Timeout    = 5; // 5 seconds timeout to prevent hanging
        
        // Remitente y Destinatario
        $mail->setFrom('villycar7@gmail.com', "Sistema de Agendas $nombre_empresa");
        $mail->addAddress($email, $cliente);

        // Contenido
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = "Confirmación de Cita: $titulo";
        
        $message = "
        <html>
        <head>
          <title>Confirmación de Cita</title>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
            .header { background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .header h2 { color: #334155; margin: 0; }
            .content { color: #333; line-height: 1.6; }
            .details { background-color: #f8fafc; padding: 15px; border-left: 4px solid #6366f1; margin: 20px 0; }
            .details ul { list-style: none; padding: 0; margin: 0; }
            .details li { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class='container'>
            <div class='header'>
              <h2>Confirmación de Cita</h2>
            </div>
            <div class='content'>
              <p>Hola <strong>$cliente</strong>,</p>
              <p>Este es un mensaje automático confirmando que tu cita ha sido programada con nosotros.</p>
              
              <div class='details'>
                <ul>
                  <li><strong>Servicio/Motivo:</strong> $titulo</li>
                  <li><strong>Fecha:</strong> $fecha</li>
                  <li><strong>Hora:</strong> $hora</li>
                </ul>
              </div>
              
              <p>Por favor, asegúrate de llegar a tiempo. ¡Te esperamos!</p>
              <br>
              <p style='text-align: center; color: #666; font-size: 12px; margin-top: 30px;'>Este mensaje ha sido generado automáticamente por $nombre_empresa, por favor no lo respondas.</p>
            </div>
          </div>
        </body>
        </html>
        ";
        
        $mail->Body = $message;
        $mail->AltBody = "Hola $cliente,\n\nEste es un mensaje de confirmación de tu cita programada.\n\nServicio: $titulo\nFecha: $fecha\nHora: $hora\n\nTe esperamos.\n\n$nombre_empresa.";

        $mail->send();
        return true;
    } catch (Exception $e) {
        // En un caso real podrías guardar el error en un log: $mail->ErrorInfo
        return false;
    }
}
?>
