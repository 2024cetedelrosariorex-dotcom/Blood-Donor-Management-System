<?php
session_start(); // [DATABASE - ADDED] keep the login session so api.php knows who is logged in


require_once 'config/db.php';
header('Content-Type: application/json');

try {
    // Create the three built-in entity accounts if they do not already exist.
    $defaultBarangayStmt = $pdo->prepare(
        "SELECT BarangayID FROM BARANGAY WHERE BarangayName = ? LIMIT 1"
    );

    $defaultBarangayStmt->execute(['Lagao']);

    $defaultBarangay =
        $defaultBarangayStmt->fetch(PDO::FETCH_ASSOC);

    $defaultBarangayId =
        $defaultBarangay
            ? (int)$defaultBarangay['BarangayID']
            : 1;

    $defaultAccounts = [
        [
            'username' => 'choadmin',
            'password' => 'ChoAdmin123!',
            'roleId' => 1,
            'type' => 'cho'
        ],
        [
            'username' => 'bhwgensan',
            'password' => 'BhwGensan123!',
            'roleId' => 3,
            'type' => 'bhw'
        ],
        [
            'username' => 'hospitalstaff',
            'password' => 'Hospital123!',
            'roleId' => 2,
            'type' => 'hospital'
        ]
    ];

    foreach ($defaultAccounts as $account) {

        $check = $pdo->prepare(
            "SELECT UserID
             FROM USERS
             WHERE Username = ?
             LIMIT 1"
        );

        $check->execute([
            $account['username']
        ]);

        if ($check->fetch(PDO::FETCH_ASSOC)) {
            continue;
        }

        $insert = $pdo->prepare(
            "INSERT INTO USERS
            (Username, Password, ROLES_RoleID)
            VALUES (?, ?, ?)"
        );

        $insert->execute([
            $account['username'],
            password_hash(
                $account['password'],
                PASSWORD_DEFAULT
            ),
            $account['roleId']
        ]);

        $newUserId =
            (int)$pdo->lastInsertId();

        if ($account['type'] === 'cho') {

            $stmt = $pdo->prepare(
                "INSERT INTO CIT_Health_OFF_ADM
                (FIR_name, LST_name, USERS_UserID)
                VALUES (?, ?, ?)"
            );

            $stmt->execute([
                'City Health Office',
                'Admin',
                $newUserId
            ]);

        } elseif ($account['type'] === 'bhw') {

            $stmt = $pdo->prepare(
                "INSERT INTO Barangay_Health_Worker
                (
                    FIR_name,
                    LST_name,
                    CTT_Number,
                    USERS_UserID,
                    BARANGAY_BarangayID
                )
                VALUES (?, ?, ?, ?, ?)"
            );

            $stmt->execute([
                'Barangay',
                'Health Worker',
                '+639171234567',
                $newUserId,
                $defaultBarangayId
            ]);

        } elseif ($account['type'] === 'hospital') {

            $stmt = $pdo->prepare(
                "INSERT INTO Hospital_STF
                (
                    Hospital_name,
                    Address,
                    CTT_number,
                    USERS_UserID,
                    BARANGAY_BarangayID
                )
                VALUES (?, ?, ?, ?, ?)"
            );

            $stmt->execute([
                'General Santos Doctors Hospital',
                'General Santos City',
                '+639181234567',
                $newUserId,
                $defaultBarangayId
            ]);
        }
    }

    // Make sure USERS can store donor Gmail addresses.
    $emailColumn =
        $pdo->query(
            "SHOW COLUMNS FROM USERS LIKE 'Email'"
        )->fetch(PDO::FETCH_ASSOC);

    if (!$emailColumn) {

        $pdo->exec(
            "ALTER TABLE USERS
             ADD COLUMN Email VARCHAR(120) NULL UNIQUE"
        );
    }

    // Read login data.
    $rawInput =
        file_get_contents('php://input');

    $data =
        json_decode(
            $rawInput,
            true
        );

    if (!is_array($data)) {
        $data = $_POST;
    }

    if (
        !is_array($data) ||
        empty($data)
    ) {

        echo json_encode([
            'success' => false,
            'message' =>
                'No login data was received.'
        ]);

        exit;
    }

    $username =
        trim(
            $data['username'] ?? ''
        );

    $password =
        trim(
            $data['password'] ?? ''
        );

    if ($username === '') {

        echo json_encode([
            'success' => false,
            'message' =>
                'Username is required.'
        ]);

        exit;
    }

    if ($password === '') {

        echo json_encode([
            'success' => false,
            'message' =>
                'Password is required.'
        ]);

        exit;
    }

    // Find account by username only.
    // The role is obtained automatically from the database.
    $stmt = $pdo->prepare("
        SELECT
            USERS.UserID,
            USERS.Username,
            USERS.Password,
            USERS.ROLES_RoleID,
            ROLES.RoleID,
            ROLES.RoleName,
            USERS.Email
        FROM USERS
        INNER JOIN ROLES
            ON USERS.ROLES_RoleID = ROLES.RoleID
        WHERE USERS.Username = ?
        LIMIT 1
    ");

    $stmt->execute([
        $username
    ]);

    $user =
        $stmt->fetch(
            PDO::FETCH_ASSOC
        );

    if (!$user) {

        echo json_encode([
            'success' => false,
            'message' =>
                'Username not found.'
        ]);

        exit;
    }

    if (
        !password_verify(
            $password,
            $user['Password']
        )
    ) {

        echo json_encode([
            'success' => false,
            'message' =>
                'Incorrect password.'
        ]);

        exit;
    }

    // Get the donor profile for a Volunteer Blood Donor.
    $donor = null;

    if (
        (int)$user['RoleID'] === 4
    ) {

        $donorStmt = $pdo->prepare("
            SELECT
                VBD.FIR_name,
                VBD.MID_NAME,
                VBD.LST_name,
                VBD.SEX,
                VBD.BTH_DTE,
                VBD.phone_number,
                VBD.Address,
                VBD.USERS_UserID,
                VBD.BARANGAY_BarangayID,
                VBD.BLOOD_TYPE_BloodTypeID
            FROM Volunteer_Blood_donor VBD
            WHERE VBD.USERS_UserID = ?
            LIMIT 1
        ");

        $donorStmt->execute([
            $user['UserID']
        ]);

        $donor =
            $donorStmt->fetch(
                PDO::FETCH_ASSOC
            );

        if ($donor) {

            $donor['Email'] =
                $user['Email'] ?? '';

            $donor['city'] =
                'General Santos City';

            $donor['region'] =
                'Region XII - SOCCSKSARGEN';

            $donor['verificationStatus'] =
                'Verified';

            $donor['availability'] =
                'Available';
        }
    }

    // [DATABASE - ADDED] the login session used by api.php
    session_regenerate_id(true);
    $_SESSION['userId']   = (int)$user['UserID'];
    $_SESSION['roleId']   = (int)$user['RoleID'];
    $_SESSION['username'] = $user['Username'];

    echo json_encode([
        'success' => true,
        'id' => (int)$user['UserID'],
        'username' => $user['Username'],
        'roleId' => (int)$user['RoleID'],
        'roleName' => $user['RoleName'],
        'donor' => $donor
    ]);

} catch (PDOException $e) {

    echo json_encode([
        'success' => false,
        'message' =>
            'Database error: ' .
            $e->getMessage()
    ]);
}

?>