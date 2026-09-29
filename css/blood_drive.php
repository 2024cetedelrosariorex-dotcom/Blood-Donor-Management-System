<?php

require_once 'config/db.php';

header('Content-Type: application/json; charset=utf-8');

try {

    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (!is_array($data)) {
        $data = $_POST;
    }

    $action = $data['action'] ?? 'list';

    /*
    =========================================================
    LIST BLOOD DRIVES
    =========================================================
    */

    if ($action === 'list') {

        $stmt = $pdo->query("
            SELECT
                bd.Blood_Dive_id,
                bd.CTT_name,
                bd.LOC,
                bd.DTE,
                bd.STS,
                bd.BARANGAY_BarangayID,
                b.BarangayName
            FROM blood_drive bd
            LEFT JOIN BARANGAY b
                ON bd.BARANGAY_BarangayID = b.BarangayID
            ORDER BY bd.DTE ASC, bd.Blood_Dive_id DESC
        ");

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $drives = [];

        foreach ($rows as $row) {

            $drives[] = [
                'id' => (int)$row['Blood_Dive_id'],
                'eventName' => $row['CTT_name'],
                'venue' => $row['LOC'],
                'scheduleDate' => $row['DTE'],
                'status' => $row['STS'],
                'barangayId' => (int)$row['BARANGAY_BarangayID'],
                'barangayName' => $row['BarangayName']
            ];
        }

        echo json_encode([
            'success' => true,
            'drives' => $drives
        ]);

        exit;
    }


    /*
    =========================================================
    CREATE BLOOD DRIVE
    =========================================================
    */

    if ($action === 'create') {

        $eventName = trim($data['eventName'] ?? '');
        $venue = trim($data['venue'] ?? '');
        $scheduleDate = trim($data['scheduleDate'] ?? '');
        $barangayId = (int)($data['barangayId'] ?? 0);
        $adminUserId = (int)($data['adminUserId'] ?? 0);
        $status = trim($data['status'] ?? 'Scheduled');

        if ($eventName === '') {
            echo json_encode([
                'success' => false,
                'message' => 'Event name is required.'
            ]);
            exit;
        }

        if ($venue === '') {
            echo json_encode([
                'success' => false,
                'message' => 'Location is required.'
            ]);
            exit;
        }

        if ($scheduleDate === '') {
            echo json_encode([
                'success' => false,
                'message' => 'Schedule date is required.'
            ]);
            exit;
        }

        if ($barangayId <= 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Please select a barangay.'
            ]);
            exit;
        }


        /*
        Find the CHO Admin record.

        Your database has:
        USERS.UserID = 23
        CIT_Health_OFF_ADM.admin_id = 2

        The blood_drive table needs admin_id = 2,
        NOT USERS.UserID = 23.
        */

        $adminStmt = $pdo->prepare("
            SELECT admin_id
            FROM CIT_Health_OFF_ADM
            WHERE USERS_UserID = ?
            LIMIT 1
        ");

        $adminStmt->execute([
            $adminUserId
        ]);

        $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);


        if (!$admin) {

            /*
            If the logged-in user does not have a CHO
            admin profile, use the first available CHO admin.
            This keeps the existing BHW Blood Drive interface
            working with the current database structure.
            */

            $fallbackStmt = $pdo->query("
                SELECT admin_id
                FROM CIT_Health_OFF_ADM
                ORDER BY admin_id ASC
                LIMIT 1
            ");

            $admin = $fallbackStmt->fetch(PDO::FETCH_ASSOC);
        }


        if (!$admin) {

            echo json_encode([
                'success' => false,
                'message' => 'No City Health Office Admin record was found.'
            ]);

            exit;
        }


        /*
        Make sure barangay exists.
        */

        $barangayStmt = $pdo->prepare("
            SELECT BarangayID
            FROM BARANGAY
            WHERE BarangayID = ?
            LIMIT 1
        ");

        $barangayStmt->execute([
            $barangayId
        ]);

        if (!$barangayStmt->fetch(PDO::FETCH_ASSOC)) {

            echo json_encode([
                'success' => false,
                'message' => 'Selected barangay does not exist.'
            ]);

            exit;
        }


        /*
        INSERT INTO MYSQL
        */

        $stmt = $pdo->prepare("
            INSERT INTO blood_drive
            (
                CTT_name,
                LOC,
                DTE,
                STS,
                BARANGAY_BarangayID,
                CIT_Health_OFF_ADM_admin_id
            )
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $eventName,
            $venue,
            $scheduleDate,
            $status,
            $barangayId,
            $admin['admin_id']
        ]);


        $newId = (int)$pdo->lastInsertId();


        echo json_encode([
            'success' => true,
            'message' => 'Blood drive saved successfully.',
            'id' => $newId
        ]);

        exit;
    }


    /*
    =========================================================
    UPDATE BLOOD DRIVE
    =========================================================
    */

    if ($action === 'update') {

        $driveId = (int)($data['id'] ?? 0);
        $eventName = trim($data['eventName'] ?? '');
        $venue = trim($data['venue'] ?? '');
        $scheduleDate = trim($data['scheduleDate'] ?? '');
        $barangayId = (int)($data['barangayId'] ?? 0);
        $status = trim($data['status'] ?? 'Scheduled');

        if ($driveId <= 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid blood drive ID.'
            ]);
            exit;
        }

        $stmt = $pdo->prepare("
            UPDATE blood_drive
            SET
                CTT_name = ?,
                LOC = ?,
                DTE = ?,
                STS = ?,
                BARANGAY_BarangayID = ?
            WHERE Blood_Dive_id = ?
        ");

        $stmt->execute([
            $eventName,
            $venue,
            $scheduleDate,
            $status,
            $barangayId,
            $driveId
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Blood drive updated successfully.'
        ]);

        exit;
    }


    /*
    =========================================================
    DELETE BLOOD DRIVE
    =========================================================
    */

    if ($action === 'delete') {

        $driveId = (int)($data['id'] ?? 0);

        if ($driveId <= 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid blood drive ID.'
            ]);
            exit;
        }

        $stmt = $pdo->prepare("
            DELETE FROM blood_drive
            WHERE Blood_Dive_id = ?
        ");

        $stmt->execute([
            $driveId
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Blood drive deleted successfully.'
        ]);

        exit;
    }


    echo json_encode([
        'success' => false,
        'message' => 'Invalid action.'
    ]);

} catch (PDOException $e) {

    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>