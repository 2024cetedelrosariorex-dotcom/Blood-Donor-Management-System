<?php
/*
 * verify_email.php  [EMAIL VERIFICATION - ADDED / CHANGED]
 * ------------------------------------------------------------------
 * Called by script.js when the donor clicks "Accept & Verify" on the
 * screen shown after opening the emailed link. Expects POST JSON:
 *   { "userId": 12, "token": "..." }
 *
 * Checks the token against USERS.EmailVerificationToken. If it matches:
 *   1. Sets EmailVerified = 1 and clears the token (so the link cannot be
 *      reused).
 *   2. [CHANGED] Only now - after acceptance - generates a fresh temporary
 *      password, saves its hash, and emails the donor their Username and
 *      Temporary Password. Before this step, register_account.php no
 *      longer emails the credentials at registration time.
 * ------------------------------------------------------------------
 */

require_once 'config/db.php';
require_once 'config/mailer.php'; // also makes $mailConfig available here
header('Content-Type: application/json');

try {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if (!is_array($data)) {
        $data = $_POST;
    }

    $userId = (int)($data['userId'] ?? 0);
    $token  = trim($data['token'] ?? '');

    if ($userId <= 0 || $token === '') {
        echo json_encode(['success' => false, 'message' => 'Missing verification details.']);
        exit;
    }

    $stmt = $pdo->prepare(
        "SELECT UserID, Username, Email, EmailVerified, EmailVerificationToken
         FROM USERS WHERE UserID = ? LIMIT 1"
    );
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Account not found.']);
        exit;
    }

    $donorName = $user['Username'];

    $nameStmt = $pdo->prepare("SELECT FIR_name, LST_name FROM Volunteer_Blood_donor WHERE USERS_UserID = ? LIMIT 1");
    $nameStmt->execute([$userId]);
    $donorRow = $nameStmt->fetch(PDO::FETCH_ASSOC);

    if ($donorRow) {
        $donorName = trim($donorRow['FIR_name'] . ' ' . $donorRow['LST_name']);
    }

    if ((int)($user['EmailVerified'] ?? 0) === 1) {
        // Already verified earlier - do not generate/email another password.
        echo json_encode([
            'success'   => true,
            'message'   => 'This email was already verified.',
            'email'     => $user['Email'],
            'donorName' => $donorName
        ]);
        exit;
    }

    $storedToken = $user['EmailVerificationToken'] ?? '';

    if ($storedToken === '' || $storedToken === null || !hash_equals((string)$storedToken, $token)) {
        echo json_encode(['success' => false, 'message' => 'This verification link is invalid or has expired.']);
        exit;
    }

    // Mark verified and generate the real login password now.
    $temporaryPassword = 'Donor' . random_int(1000, 9999) . '!';
    $hashedPassword = password_hash($temporaryPassword, PASSWORD_DEFAULT);

    $update = $pdo->prepare(
        "UPDATE USERS
         SET EmailVerified = 1, EmailVerificationToken = NULL, Password = ?
         WHERE UserID = ?"
    );
    $update->execute([$hashedPassword, $userId]);

    // Email the login credentials now that the address is confirmed.
    $subject = 'City Blood Donor System - Your Login Credentials';

    $htmlBody = '
        <div style="font-family:Arial,Helvetica,sans-serif; max-width:520px; margin:0 auto;">
            <h2 style="color:#0f172a;">Email Verified - Here Are Your Login Details</h2>
            <p>Hello ' . htmlspecialchars($donorName) . ',</p>
            <p>Thank you for confirming your email address. Your Volunteer Blood Donor account is now ready to use.</p>
            <table style="margin:18px 0; border-collapse:collapse;">
                <tr>
                    <td style="padding:6px 12px 6px 0; color:#64748b;">Username:</td>
                    <td style="padding:6px 0; font-weight:bold;">' . htmlspecialchars($user['Username']) . '</td>
                </tr>
                <tr>
                    <td style="padding:6px 12px 6px 0; color:#64748b;">Temporary Password:</td>
                    <td style="padding:6px 0; font-weight:bold;">' . htmlspecialchars($temporaryPassword) . '</td>
                </tr>
            </table>
            <p>Please log in and change your password in Account Settings.</p>
            <p style="font-size:0.85rem; color:#64748b;">If you did not request this, please contact the City Health Office.</p>
        </div>
    ';

    $textBody = "Hello {$donorName},\r\n\r\n"
        . "Thank you for confirming your email address. Your Volunteer Blood Donor account is now ready to use.\r\n\r\n"
        . "Username: {$user['Username']}\r\n"
        . "Temporary Password: {$temporaryPassword}\r\n\r\n"
        . "Please log in and change your password in Account Settings.";

    $mailResult = sendAppEmail($user['Email'], $donorName, $subject, $htmlBody, $textBody);

    echo json_encode([
        'success'            => true,
        'message'            => 'Email verified successfully.',
        'email'              => $user['Email'],
        'donorName'          => $donorName,
        'credentialsEmailed' => $mailResult['sent'],
        // fallback so staff can still hand these over manually if the
        // credentials email itself did not go through
        'username'           => $user['Username'],
        'temporaryPassword'  => $mailResult['sent'] ? null : $temporaryPassword
    ]);

} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}