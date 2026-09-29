<?php
/*
 * config/mailer.php
 */

function sendAppEmail(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody = ''): array
{
    $host     = 'smtp.gmail.com';
    $port     = 587;
    $username = 'rexjoshuadelrosario1111@gmail.com';
    $password = 'koybfmemxdlupkcl';
    $fromName = 'City Blood Donor System';

    $baseDir = dirname(__DIR__);

    if (file_exists($baseDir . '/vendor/src/PHPMailer.php')) {
        require_once $baseDir . '/vendor/src/Exception.php';
        require_once $baseDir . '/vendor/src/PHPMailer.php';
        require_once $baseDir . '/vendor/src/SMTP.php';
    } else {
        return [
            'sent'  => false,
            'error' => 'PHPMailer files missing in vendor/src.'
        ];
    }

    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);

        $mail->isSMTP();
        $mail->Host       = $host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $username;
        $mail->Password   = $password;
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = $port;

        // Bypass Localhost SSL Verification
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer'       => false,
                'verify_peer_name'  => false,
                'allow_self_signed' => true
            ]
        ];

        $mail->setFrom($username, $fromName);
        $mail->addAddress($toEmail, $toName);

        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;
        $mail->AltBody = $textBody ?: strip_tags($htmlBody);

        $mail->send();

        return [
            'sent'  => true,
            'error' => ''
        ];
    } catch (Throwable $e) {
        return [
            'sent'  => false,
            'error' => 'Gmail SMTP Error: ' . $e->getMessage()
        ];
    }
}
