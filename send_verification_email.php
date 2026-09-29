<?php
/*
 * send_verification_email.php
 */

require_once 'config/db.php';

ob_start();
header('Content-Type: application/json');

try {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if (!is_array($data)) {
        $data = $_POST;
    }

    $userId = (int)($data['userId'] ?? 0);
    $emailFromClient = strtolower(trim($data['email'] ?? ''));

    if ($userId <= 0) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'Missing userId.']);
        exit;
    }

    // Ensure USERS has required columns
    $col = $pdo->query("SHOW COLUMNS FROM USERS LIKE 'EmailVerified'")->fetch(PDO::FETCH_ASSOC);
    if (!$col) {
        $pdo->exec("ALTER TABLE USERS ADD COLUMN EmailVerified TINYINT(1) NOT NULL DEFAULT 0");
    }

    $col = $pdo->query("SHOW COLUMNS FROM USERS LIKE 'EmailVerificationToken'")->fetch(PDO::FETCH_ASSOC);
    if (!$col) {
        $pdo->exec("ALTER TABLE USERS ADD COLUMN EmailVerificationToken VARCHAR(64) NULL");
    }

    $stmt = $pdo->prepare("SELECT UserID, Username, Email, ROLES_RoleID FROM USERS WHERE UserID = ? LIMIT 1");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'User account not found.']);
        exit;
    }

    $email = $user['Email'] ?: $emailFromClient;

    if (!$email) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'This account has no email address on file.']);
        exit;
    }

    $donorName = $user['Username'];

    $nameStmt = $pdo->prepare("SELECT FIR_name, LST_name FROM Volunteer_Blood_donor WHERE USERS_UserID = ? LIMIT 1");
    $nameStmt->execute([$userId]);
    $donorRow = $nameStmt->fetch(PDO::FETCH_ASSOC);

    if ($donorRow) {
        $donorName = trim($donorRow['FIR_name'] . ' ' . $donorRow['LST_name']);
    }

    $token = bin2hex(random_bytes(24));

    $update = $pdo->prepare("UPDATE USERS SET EmailVerificationToken = ?, EmailVerified = 0 WHERE UserID = ?");
    $update->execute([$token, $userId]);

    $mailConfig = file_exists('config/mail_config.php') ? require 'config/mail_config.php' : [];
    $baseUrl = rtrim($mailConfig['APP_BASE_URL'] ?? 'http://localhost/blood_donor_system', '/');
    $verifyLink = $baseUrl . '/index.html?verifyUser=' . urlencode((string)$userId) . '&verifyToken=' . urlencode($token);

    $subject = 'Please verify your email - City Blood Donor System';

    $htmlBody = '
        <div style="font-family:Arial,Helvetica,sans-serif; max-width:520px; margin:0 auto; padding:20px; border:1px solid #e2e8f0; border-radius:8px;">
            <h2 style="color:#800020; margin-top:0;">Confirm your email address</h2>
            <p>Hello ' . htmlspecialchars($donorName) . ',</p>
            <p>You registered as a Volunteer Blood Donor with the City Blood Donor Management System.</p>
            <p>Please confirm that this is your email address by clicking the button below:</p>
            <p style="text-align:center; margin:25px 0;">
                <a href="' . htmlspecialchars($verifyLink) . '"
                   style="background:#800020; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold; display:inline-block;">
                   Accept &amp; Verify My Email
                </a>
            </p>
            <p style="font-size:0.85rem; color:#64748b;">
                Or copy and paste this URL into your browser:<br>
                ' . htmlspecialchars($verifyLink) . '
            </p>
        </div>
    ';

    $textBody = "Hello {$donorName},\r\n\r\n"
        . "Please confirm your email address by opening this link:\r\n"
        . $verifyLink;

    $emailSent = false;
    $mailError = '';

    if (file_exists('config/mailer.php')) {
        try {
            require_once 'config/mailer.php';
            if (function_exists('sendAppEmail')) {
                $mailResult = sendAppEmail($email, $donorName, $subject, $htmlBody, $textBody);
                $emailSent = $mailResult['sent'] ?? false;
                $mailError = $mailResult['error'] ?? '';
            }
        } catch (Throwable $mailEx) {
            $mailError = $mailEx->getMessage();
        }
    }

    ob_clean();
    echo json_encode([
        'success'    => true,
        'emailSent'  => $emailSent,
        'mailError'  => $mailError,
        'verifyLink' => $verifyLink
    ]);

} catch (Throwable $e) {
    ob_clean();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>