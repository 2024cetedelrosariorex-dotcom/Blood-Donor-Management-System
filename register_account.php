<?php

require_once 'config/db.php';
header('Content-Type: application/json');

try {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if (!is_array($data)) {
        $data = $_POST;
    }

    if (!is_array($data) || empty($data)) {
        echo json_encode(['success' => false, 'message' => 'No donor registration data was received.']);
        exit;
    }

    $registrarRoleId = (int)($data['registrarRoleId'] ?? 0);
    if ($registrarRoleId !== 1 && $registrarRoleId !== 3) {
        echo json_encode(['success' => false, 'message' => 'Only City Health Office Admin and Barangay Health Worker accounts can register donors.']);
        exit;
    }

    $firstName = trim($data['firstName'] ?? '');
    $middleName = trim($data['middleName'] ?? '');
    $lastName = trim($data['lastName'] ?? '');
    $sex = trim($data['sex'] ?? '');
    $birthDate = trim($data['birthDate'] ?? '');
    $bloodTypeName = trim($data['bloodType'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $email = strtolower(trim($data['email'] ?? ''));
    $address = trim($data['address'] ?? '');
    $barangayName = trim($data['barangay'] ?? '');
    $city = trim($data['city'] ?? '');
    $region = trim($data['region'] ?? '');
    // [USERNAME - ADDED] the username typed in the registration form (the password is still generated below)
    $requestedUsername = trim($data['username'] ?? '');

    if ($firstName === '' || $lastName === '' || $birthDate === '' || $bloodTypeName === '' || $phone === '' || $email === '' || $address === '' || $barangayName === '' || $city === '' || $region === '') {
        echo json_encode(['success' => false, 'message' => 'Please complete all required donor registration fields.']);
        exit;
    }

    if (!preg_match("/^[A-Za-zÀ-ÿ .'-]+$/", $firstName) || !preg_match("/^[A-Za-zÀ-ÿ .'-]+$/", $lastName) || ($middleName !== '' && !preg_match("/^[A-Za-zÀ-ÿ .'-]+$/", $middleName))) {
        echo json_encode(['success' => false, 'message' => 'Name fields must contain letters only. Numbers are not allowed.']);
        exit;
    }

    if (!preg_match('/^\+639\d{9}$/', $phone)) {
        echo json_encode(['success' => false, 'message' => 'Please enter a valid Philippine phone number using +63.']);
        exit;
    }

    if (!preg_match('/^[A-Za-z0-9._%+-]+@gmail\.com$/i', $email)) {
        echo json_encode(['success' => false, 'message' => 'Please enter a valid Gmail address ending with @gmail.com.']);
        exit;
    }

    $emailColumn = $pdo->query("SHOW COLUMNS FROM USERS LIKE 'Email'")->fetch(PDO::FETCH_ASSOC);
    if (!$emailColumn) {
        $pdo->exec("ALTER TABLE USERS ADD COLUMN Email VARCHAR(120) NULL UNIQUE");
    }

    $emailCheck = $pdo->prepare("SELECT UserID FROM USERS WHERE LOWER(Email) = LOWER(?) LIMIT 1");
    $emailCheck->execute([$email]);
    if ($emailCheck->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode(['success' => false, 'message' => 'Email already exists. Please use another Gmail account.']);
        exit;
    }

    $barangayStmt = $pdo->prepare("SELECT BarangayID FROM BARANGAY WHERE BarangayName = ? LIMIT 1");
    $barangayStmt->execute([$barangayName]);
    $barangay = $barangayStmt->fetch(PDO::FETCH_ASSOC);
    if (!$barangay) {
        echo json_encode(['success' => false, 'message' => "Barangay '{$barangayName}' was not found in the database."]);
        exit;
    }

    $bloodStmt = $pdo->prepare("SELECT BloodTypeID FROM BLOOD_TYPE WHERE BloodTypeName = ? LIMIT 1");
    $bloodStmt->execute([$bloodTypeName]);
    $bloodType = $bloodStmt->fetch(PDO::FETCH_ASSOC);
    if (!$bloodType) {
        echo json_encode(['success' => false, 'message' => "Blood type '{$bloodTypeName}' was not found in the database."]);
        exit;
    }

    if ($requestedUsername !== '') {
        // [USERNAME - ADDED] use the username typed by the staff member
        if (!preg_match('/^[A-Za-z0-9._-]{3,30}$/', $requestedUsername)) {
            echo json_encode(['success' => false, 'message' => 'Username must be 3-30 characters and may contain only letters, numbers, dots, underscores, or hyphens.']);
            exit;
        }
        $usernameCheck = $pdo->prepare("SELECT UserID FROM USERS WHERE LOWER(Username) = LOWER(?) LIMIT 1");
        $usernameCheck->execute([$requestedUsername]);
        if ($usernameCheck->fetch(PDO::FETCH_ASSOC)) {
            echo json_encode(['success' => false, 'message' => 'Username already exists. Please choose another username.']);
            exit;
        }
        $username = $requestedUsername;
    } else {
        // (old behaviour, kept) no username typed: make one from the first and last name
        $baseUsername = strtolower(preg_replace('/[^a-z0-9]+/', '.', trim($firstName . ' ' . $lastName)));
        $baseUsername = trim($baseUsername, '.');
        if ($baseUsername === '') {
            $baseUsername = 'donor';
        }

        $username = $baseUsername;
        $counter = 1;
        while (true) {
            $usernameCheck = $pdo->prepare("SELECT UserID FROM USERS WHERE LOWER(Username) = LOWER(?) LIMIT 1");
            $usernameCheck->execute([$username]);
            if (!$usernameCheck->fetch(PDO::FETCH_ASSOC)) {
                break;
            }
            $counter++;
            $username = $baseUsername . $counter;
        }
    }

    $temporaryPassword = 'Donor' . random_int(1000, 9999) . '!';
    $hashedPassword = password_hash($temporaryPassword, PASSWORD_DEFAULT);

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO USERS (Username, Password, ROLES_RoleID, Email) VALUES (?, ?, 4, ?)");
    $stmt->execute([$username, $hashedPassword, $email]);
    $newUserId = (int)$pdo->lastInsertId();

    $stmt = $pdo->prepare("
        INSERT INTO Volunteer_Blood_donor
        (FIR_name, MID_NAME, LST_name, SEX, BTH_DTE, phone_number, Address, USERS_UserID, BARANGAY_BarangayID, BLOOD_TYPE_BloodTypeID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $firstName, $middleName, $lastName, $sex, $birthDate, $phone, $address,
        $newUserId, $barangay['BarangayID'], $bloodType['BloodTypeID']
    ]);

    $donorId = (int)$pdo->lastInsertId();

    $subject = 'City Blood Donor System - Your Login Credentials';
    $message = "Hello {$firstName} {$lastName},\r\n\r\n"
        . "Your Volunteer Blood Donor account has been successfully registered.\r\n\r\n"
        . "Username: {$username}\r\n"
        . "Temporary Password: {$temporaryPassword}\r\n\r\n"
        . "Please log in and change your password in Account Settings.\r\n\r\n"
        . "Thank you.";
    $headers = "From: City Blood Donor System <noreply@localhost>\r\n"
        . "Reply-To: noreply@localhost\r\n"
        . "Content-Type: text/plain; charset=UTF-8";
    $emailSent = function_exists('mail') ? @mail($email, $subject, $message, $headers) : false;

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'username' => $username,
        'temporaryPassword' => $temporaryPassword,
        'emailSent' => (bool)$emailSent,
        'donor' => [
            'id' => $donorId,
            'userId' => $newUserId,
            'firstName' => $firstName,
            'middleName' => $middleName,
            'lastName' => $lastName,
            'sex' => $sex,
            'birthDate' => $birthDate,
            'phone' => $phone,
            'email' => $email,
            'address' => $address,
            'barangayId' => (int)$barangay['BarangayID'],
            'city' => $city,
            'region' => $region,
            'bloodTypeId' => (int)$bloodType['BloodTypeID'],
            'verificationStatus' => 'Pending',
            'availability' => 'Available'
        ]
    ]);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>