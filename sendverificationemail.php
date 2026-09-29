<?php
/*
 * send_verification_email.php  [EMAIL VERIFICATION - ADDED]
 * ------------------------------------------------------------------
 * Called by script.js right after a donor is registered (and by the
 * "Resend Email" buttons). Expects POST JSON: { "userId": 12 }
 *
 * What it does:
 *   1. Makes sure USERS has the EmailVerified / EmailVerificationToken
 *      columns (adds them automatically the first time, the same way
 *      register_account.php / login.php already add the Email column).
 *   2. Generates a random token and saves it against that USERS row.
 *   3. Emails the donor a link back to index.html containing that
 *      token, using config/mailer.php (Gmail SMTP via PHPMailer).
 *   4. Always returns the link in the JSON response too, so the staff
 *      can copy/open it manually as a fallback if the email itself did
 *      not go through.
 * ------------------------------------------------------------------
 */

require_once 'config/db.php';
require_once 'config/mailer.php';
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
        echo json_encode(['success' => false, 'message' => 'Missing userId.']);
        exit;
    }

    // Make sure USERS has the two columns this feature needs.
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
        echo json_encode(['success' => false, 'message' => 'User account not found.']);
        exit;
    }

    $email = $user['Email'] ?: $emailFromClient;

    if (!$email) {
        echo json_encode(['success' => false, 'message' => 'This account has no email address on file.']);
        exit;
    }

    // Get the donor's name for the email greeting, if this account is a donor.
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

    $mailConfig = require 'config/mail_config.php';
    $baseUrl = rtrim($mailConfig['APP_BASE_URL'], '/');
    $verifyLink = $baseUrl . '/index.html?verifyUser=' . urlencode((string)$userId) . '&verifyToken=' . urlencode($token);

    $subject = 'Please verify your email - City Blood Donor System';

    $htmlBody = '
        <div style="font-family:Arial,Helvetica,sans-serif; max-width:520px; margin:0 auto;">
            <h2 style="color:#0f172a;">Confirm your email address</h2>
            <p>Hello ' . htmlspecialchars($donorName) . ',</p>
            <p>You (or a City Health Office / Barangay Health Worker staff member on your behalf) registered this
               email address as a Volunteer Blood Donor with the City Blood Donor Management &amp; Emergency
               Matching System.</p>
            <p>Please confirm that this is your email address by clicking the button below:</p>
            <p style="text-align:center; margin:28px 0;">
                <a href="' . htmlspecialchars($verifyLink) . '"
                   style="background:#800020; color:#ffffff; padding:12px 26px; border-radius:6px; text-decoration:none; font-weight:bold; display:inline-block;">
                   Accept &amp; Verify My Email
                </a>
            </p>
            <p style="font-size:0.85rem; color:#64748b;">
                If the button above does not work, copy and paste this link into your browser:<br>
                ' . htmlspecialchars($verifyLink) . '
            </p>
            <p style="font-size:0.85rem; color:#64748b;">
                If you did not request this, you can safely ignore this email.
            </p>
        </div>
    ';

    $textBody = "Hello {$donorName},\r\n\r\n"
        . "Please confirm your email address for the City Blood Donor Management & Emergency Matching System by opening this link:\r\n"
        . $verifyLink . "\r\n\r\n"
        . "If you did not request this, you can safely ignore this email.";

    $result = sendAppEmail($email, $donorName, $subject, $htmlBody, $textBody);

    echo json_encode([
        'success'    => true,
        'emailSent'  => $result['sent'],
        'mailError'  => $result['error'],
        // shown on screen as a fallback / for testing, whether or not the email itself went through
        'verifyLink' => $verifyLink
    ]);

} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}