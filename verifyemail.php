<?php
/*
 * verify_email.php  [EMAIL VERIFICATION - ADDED]
 * ------------------------------------------------------------------
 * Called by script.js when the donor clicks "Accept & Verify" on the
 * screen shown after opening the emailed link. Expects POST JSON:
 *   { "userId": 12, "token": "..." }
 *
 * Checks the token against USERS.EmailVerificationToken. If it matches,
 * sets EmailVerified = 1 and clears the token (so the link cannot be
 * reused). This is the ONLY place the token is actually validated -
 * everything in script.js is just the on-screen Accept/Decline prompt.
 * ------------------------------------------------------------------
 */

require_once 'config/db.php';
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

    if ((int)($user['EmailVerified'] ?? 0) === 1) {
        echo json_encode([
            'success' => true,
            'message' => 'This email was already verified.',
            'email'   => $user['Email']
        ]);
        exit;
    }

    $storedToken = $user['EmailVerificationToken'] ?? '';

    if ($storedToken === '' || $storedToken === null || !hash_equals((string)$storedToken, $token)) {
        echo json_encode(['success' => false, 'message' => 'This verification link is invalid or has expired.']);
        exit;
    }

    $update = $pdo->prepare("UPDATE USERS SET EmailVerified = 1, EmailVerificationToken = NULL WHERE UserID = ?");
    $update->execute([$userId]);

    $donorName = $user['Username'];

    $nameStmt = $pdo->prepare("SELECT FIR_name, LST_name FROM Volunteer_Blood_donor WHERE USERS_UserID = ? LIMIT 1");
    $nameStmt->execute([$userId]);
    $donorRow = $nameStmt->fetch(PDO::FETCH_ASSOC);

    if ($donorRow) {
        $donorName = trim($donorRow['FIR_name'] . ' ' . $donorRow['LST_name']);
    }

    echo json_encode([
        'success'   => true,
        'message'   => 'Email verified successfully.',
        'email'     => $user['Email'],
        'donorName' => $donorName
    ]);

} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}