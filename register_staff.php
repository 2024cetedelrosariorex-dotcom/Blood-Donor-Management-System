<?php

require_once 'config/db.php';

header('Content-Type: application/json');

try {

    // Get JSON request body
    $rawInput = file_get_contents('php://input');

    $data = json_decode($rawInput, true);

    // If JSON was not received, try normal POST data
    if (!is_array($data)) {
        $data = $_POST;
    }

    // Make sure data exists
    if (!is_array($data) || empty($data)) {
        echo json_encode([
            'success' => false,
            'message' => 'No registration data was received.'
        ]);
        exit;
    }

    // Get login credentials
    $roleId = isset($data['roleId'])
        ? (int)$data['roleId']
        : 0;

    $username = isset($data['username'])
        ? trim($data['username'])
        : '';

    $plainPassword = isset($data['password'])
        ? trim($data['password'])
        : '';

    // Required checks
    if ($roleId < 1 || $roleId > 4) {
        echo json_encode([
            'success' => false,
            'message' => 'Please select a valid account role.'
        ]);
        exit;
    }

    if ($username === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Username is required.'
        ]);
        exit;
    }

    if ($plainPassword === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Password is required.'
        ]);
        exit;
    }

    // Check whether the role actually exists
    $roleCheck = $pdo->prepare(
        "SELECT RoleID FROM roles WHERE RoleID = ?"
    );

    $roleCheck->execute([$roleId]);

    if (!$roleCheck->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode([
            'success' => false,
            'message' => 'Selected role does not exist in the database.'
        ]);
        exit;
    }

    // Check duplicate username
    $usernameCheck = $pdo->prepare(
        "SELECT UserID FROM USERS WHERE Username = ? LIMIT 1"
    );

    $usernameCheck->execute([$username]);

    if ($usernameCheck->fetch(PDO::FETCH_ASSOC)) {
        echo json_encode([
            'success' => false,
            'message' => 'Username already exists. Please choose another username.'
        ]);
        exit;
    }

    // Hash password
    $password = password_hash(
        $plainPassword,
        PASSWORD_DEFAULT
    );

    // Helper: find barangay ID
    function getBarangayId($pdo, $name) {

        $stmt = $pdo->prepare(
            "SELECT BarangayID
             FROM BARANGAY
             WHERE BarangayName = ?
             LIMIT 1"
        );

        $stmt->execute([
            trim($name)
        ]);

        $row =
            $stmt->fetch(
                PDO::FETCH_ASSOC
            );

        return $row
            ? $row['BarangayID']
            : null;
    }

    // Helper: find blood type ID
    function getBloodTypeId($pdo, $name) {

        $stmt = $pdo->prepare(
            "SELECT BloodTypeID
             FROM BLOOD_TYPE
             WHERE BloodTypeName = ?
             LIMIT 1"
        );

        $stmt->execute([
            trim($name)
        ]);

        $row =
            $stmt->fetch(
                PDO::FETCH_ASSOC
            );

        return $row
            ? $row['BloodTypeID']
            : null;
    }

    // Start transaction
    $pdo->beginTransaction();

    // --------------------------------------------------
    // 1. CREATE USERS ACCOUNT
    // --------------------------------------------------

    $stmt = $pdo->prepare(
        "INSERT INTO USERS
        (Username, Password, ROLES_RoleID)
        VALUES (?, ?, ?)"
    );

    $stmt->execute([
        $username,
        $password,
        $roleId
    ]);

    $newUserId =
        $pdo->lastInsertId();

    // --------------------------------------------------
    // 2. ROLE-SPECIFIC ACCOUNT
    // --------------------------------------------------

    if ($roleId === 1) {

        // CITY HEALTH OFFICE ADMIN

        $firstName =
            trim(
                $data['choFirName'] ?? ''
            );

        $lastName =
            trim(
                $data['choLstName'] ?? ''
            );

        $stmt = $pdo->prepare(
            "INSERT INTO CIT_Health_OFF_ADM
            (FIR_name, LST_name, USERS_UserID)
            VALUES (?, ?, ?)"
        );

        $stmt->execute([
            $firstName,
            $lastName,
            $newUserId
        ]);

    } elseif ($roleId === 2) {

        // HOSPITAL STAFF

        $hospitalName =
            trim(
                $data['hospName'] ?? ''
            );

        $contactNumber =
            trim(
                $data['hospCttNumber'] ?? ''
            );

        $address =
            trim(
                $data['hospAdd'] ?? ''
            );

        $barangayName =
            trim(
                $data['hospBarangay'] ?? ''
            );

        $barangayId =
            getBarangayId(
                $pdo,
                $barangayName
            );

        if (!$barangayId) {

            $pdo->rollBack();

            echo json_encode([
                'success' => false,
                'message' =>
                    "Barangay '{$barangayName}' not found."
            ]);

            exit;
        }

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
            $hospitalName,
            $address,
            $contactNumber,
            $newUserId,
            $barangayId
        ]);

    } elseif ($roleId === 3) {

        // BARANGAY HEALTH WORKER

        $firstName =
            trim(
                $data['bhwFirName'] ?? ''
            );

        $lastName =
            trim(
                $data['bhwLstName'] ?? ''
            );

        $contactNumber =
            trim(
                $data['bhwCttNumber'] ?? ''
            );

        $barangayName =
            trim(
                $data['bhwBarangay'] ?? ''
            );

        $barangayId =
            getBarangayId(
                $pdo,
                $barangayName
            );

        if (!$barangayId) {

            $pdo->rollBack();

            echo json_encode([
                'success' => false,
                'message' =>
                    "Barangay '{$barangayName}' not found."
            ]);

            exit;
        }

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
            $firstName,
            $lastName,
            $contactNumber,
            $newUserId,
            $barangayId
        ]);

    } elseif ($roleId === 4) {

        // VOLUNTEER BLOOD DONOR

        $firstName =
            trim(
                $data['selfDonorFirName'] ?? ''
            );

        $middleName =
            trim(
                $data['selfDonorMidName'] ?? ''
            );

        $lastName =
            trim(
                $data['selfDonorLstName'] ?? ''
            );

        $sex =
            trim(
                $data['selfDonorSex'] ?? ''
            );

        $birthDate =
            trim(
                $data['selfDonorBth'] ?? ''
            );

        $phone =
            trim(
                $data['selfDonorPhone'] ?? ''
            );

        $address =
            trim(
                $data['selfDonorAdd'] ?? ''
            );

        $barangayName =
            trim(
                $data['selfDonorBarangay'] ?? ''
            );

        $bloodTypeName =
            trim(
                $data['selfDonorBloodType'] ?? ''
            );

        $barangayId =
            getBarangayId(
                $pdo,
                $barangayName
            );

        $bloodTypeId =
            getBloodTypeId(
                $pdo,
                $bloodTypeName
            );

        if (!$barangayId) {

            $pdo->rollBack();

            echo json_encode([
                'success' => false,
                'message' =>
                    "Barangay '{$barangayName}' not found."
            ]);

            exit;
        }

        if (!$bloodTypeId) {

            $pdo->rollBack();

            echo json_encode([
                'success' => false,
                'message' =>
                    "Blood type '{$bloodTypeName}' not found."
            ]);

            exit;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO Volunteer_Blood_donor
            (
                FIR_name,
                MID_NAME,
                LST_name,
                SEX,
                BTH_DTE,
                phone_number,
                Address,
                USERS_UserID,
                BARANGAY_BarangayID,
                BLOOD_TYPE_BloodTypeID
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->execute([
            $firstName,
            $middleName,
            $lastName,
            $sex,
            $birthDate,
            $phone,
            $address,
            $newUserId,
            $barangayId,
            $bloodTypeId
        ]);
    }

    // Save everything
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'username' => $username
    ]);

} catch (PDOException $e) {

    // Undo partial database insert
    if (
        isset($pdo) &&
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>