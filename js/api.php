<?php
/*
 * api.php - saves and loads records using YOUR REAL DATABASE TABLES.
 *
 *   ?action=load   -> sends the saved records to the page
 *   ?action=sync   -> saves the changes made in the forms
 *   ?action=reset  -> (CHO Admin only) erases the app's records (donors/requests/drives/etc.)
 *   ?action=logout -> ends the login session
 *
 * Real tables used: USERS, Volunteer_Blood_donor, emg_blood_req, blood_drive,
 * donor_match, donor_verification, notification, BARANGAY, BLOOD_TYPE, hospital_stf.
 *
 * IMPORTANT - before this file works, run fix_database.sql and fix_database2.sql
 * (they add a few columns these forms need: Quantity, AppointmentDate/Time,
 * Instructions, and the request/donor a notification is about).
 *
 * Only logged-in users can use it (login.php starts the session).
 */
session_start();
require_once 'config/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function api_out($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $_GET['action'] ?? '';

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    api_out(['success' => true]);
}

if (empty($_SESSION['userId']) || empty($_SESSION['roleId'])) {
    api_out(['success' => false, 'message' => 'Not logged in. Please log in again.'], 401);
}

$userId  = (int)$_SESSION['userId'];
$roleId  = (int)$_SESSION['roleId'];
$isStaff = in_array($roleId, [1, 2, 3], true);

// ---------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------

// true if $table has a column named $column (checked once per request, cheap enough)
// [FIXED] MariaDB/MySQL does not allow a "?" placeholder inside SHOW COLUMNS, which caused
// "syntax error ... near '?'". information_schema.columns supports placeholders normally.
function api_has_column($pdo, $table, $column) {
    static $cache = [];
    $key = $table . '.' . $column;
    if (!array_key_exists($key, $cache)) {
        $stmt = $pdo->prepare(
            "SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?"
        );
        $stmt->execute([$table, $column]);
        $cache[$key] = ((int)$stmt->fetchColumn()) > 0;
    }
    return $cache[$key];
}

function api_barangay_id($pdo, $name) {
    if ($name === '' || $name === null) return null;
    $stmt = $pdo->prepare("SELECT BarangayID FROM BARANGAY WHERE BarangayName = ? LIMIT 1");
    $stmt->execute([$name]);
    $id = $stmt->fetchColumn();
    return $id === false ? null : (int)$id;
}

function api_blood_type_id($pdo, $name) {
    if ($name === '' || $name === null) return null;
    $stmt = $pdo->prepare("SELECT BloodTypeID FROM BLOOD_TYPE WHERE BloodTypeName = ? LIMIT 1");
    $stmt->execute([$name]);
    $id = $stmt->fetchColumn();
    return $id === false ? null : (int)$id;
}

function api_my_email($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT Email FROM USERS WHERE UserID = ? LIMIT 1");
    $stmt->execute([$userId]);
    $email = $stmt->fetchColumn();
    return $email === false ? '' : strtolower(trim((string)$email));
}

// [FIXED] donor_verification.CIT_Health_OFF_ADM_admin_id and blood_drive.CIT_Health_OFF_ADM_admin_id
// point to cit_health_off_adm's OWN id (admin_id) - not the CHO Admin's login id in USERS.
// Using the login id directly made every insert fail its foreign key check, so the change
// never actually saved (it looked like it worked, then reverted after a refresh).
function api_cho_admin_id($pdo, $userId) {
    static $cache = [];
    if (!array_key_exists($userId, $cache)) {
        $stmt = $pdo->prepare("SELECT admin_id FROM cit_health_off_adm WHERE USERS_UserID = ? LIMIT 1");
        $stmt->execute([$userId]);
        $id = $stmt->fetchColumn();
        $cache[$userId] = $id === false ? null : (int)$id;
    }
    return $cache[$userId];
}

// [FIXED] same mix-up as above: a Hospital Staff request needs hospital_stf's OWN id,
// not the staff member's login id in USERS.
function api_hospital_id($pdo, $userId) {
    static $cache = [];
    if (!array_key_exists($userId, $cache)) {
        $stmt = $pdo->prepare("SELECT Hospital_id FROM hospital_stf WHERE USERS_UserID = ? LIMIT 1");
        $stmt->execute([$userId]);
        $id = $stmt->fetchColumn();
        $cache[$userId] = $id === false ? null : (int)$id;
    }
    return $cache[$userId];
}

// ---------------------------------------------------------------------
// LOAD: turn the real tables into the doc shapes script.js expects
// ---------------------------------------------------------------------
function api_load_users($pdo) {
    $rows = $pdo->query("
        SELECT U.UserID, U.Username, U.ROLES_RoleID, R.RoleName
        FROM USERS U
        JOIN ROLES R ON R.RoleID = U.ROLES_RoleID
        WHERE U.ROLES_RoleID IN (1,2,3)
        ORDER BY U.UserID
    ")->fetchAll(PDO::FETCH_ASSOC);

    $out = [];
    foreach ($rows as $r) {
        $out[] = [
            'id' => (int)$r['UserID'],
            'username' => $r['Username'],
            'roleId' => (int)$r['ROLES_RoleID'],
            'roleName' => $r['RoleName'],
            'status' => 'Active'
        ];
    }
    return $out;
}

function api_load_donors($pdo, $onlyUserId = null) {
    $sql = "
        SELECT V.donor_id, V.FIR_name, V.MID_NAME, V.LST_name, V.SEX, V.BTH_DTE,
               V.phone_number, V.Address, V.AVE_STE, V.USERS_UserID,
               V.BARANGAY_BarangayID, V.BLOOD_TYPE_BloodTypeID, U.Email
        FROM Volunteer_Blood_donor V
        JOIN USERS U ON U.UserID = V.USERS_UserID
    ";
    $params = [];
    if ($onlyUserId !== null) {
        $sql .= " WHERE V.USERS_UserID = ?";
        $params[] = $onlyUserId;
    }
    $rows = $pdo->prepare($sql);
    $rows->execute($params);

    // latest verification per donor (none = "Pending")
    $verif = [];
    $vr = $pdo->query("
        SELECT Volunteer_Blood_donor_donor_id AS donor_id, VerificationStatus
        FROM donor_verification
        ORDER BY VerificationID DESC
    ")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($vr as $v) {
        if (!isset($verif[$v['donor_id']])) {
            $verif[$v['donor_id']] = $v['VerificationStatus'];
        }
    }

    $out = [];
    foreach ($rows->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $id = (int)$r['donor_id'];
        $out[] = [
            'id' => $id,
            'userId' => (int)$r['USERS_UserID'],
            'dbUserId' => (int)$r['USERS_UserID'],
            'firstName' => $r['FIR_name'],
            'middleName' => $r['MID_NAME'],
            'lastName' => $r['LST_name'],
            'sex' => $r['SEX'],
            'birthDate' => $r['BTH_DTE'],
            'phone' => $r['phone_number'],
            'email' => $r['Email'],
            'address' => $r['Address'],
            'barangayId' => $r['BARANGAY_BarangayID'] !== null ? (int)$r['BARANGAY_BarangayID'] : null,
            'city' => 'General Santos City',
            'region' => 'Region XII - SOCCSKSARGEN',
            'bloodTypeId' => $r['BLOOD_TYPE_BloodTypeID'] !== null ? (int)$r['BLOOD_TYPE_BloodTypeID'] : null,
            'verificationStatus' => $verif[$id] ?? 'Pending',
            'availability' => $r['AVE_STE'] ?: 'Available'
        ];
    }
    return $out;
}

function api_load_requests($pdo, $onlyIds = null) {
    $sql = "
        SELECT E.REQ_id, E.patient_name, E.REQ_DTE, E.REQ_STS, E.BLOOD_TYPE_BloodTypeID,
               E.Hospital_STF_Hospital_id, E.Quantity,
               H.Hospital_name, H.BARANGAY_BarangayID
        FROM emg_blood_req E
        LEFT JOIN hospital_stf H ON H.Hospital_id = E.Hospital_STF_Hospital_id
    ";
    if ($onlyIds !== null) {
        if (empty($onlyIds)) return [];
        $in = implode(',', array_fill(0, count($onlyIds), '?'));
        $sql .= " WHERE E.REQ_id IN ($in)";
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($onlyIds ?? []);

    $out = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $out[] = [
            'id' => (int)$r['REQ_id'],
            'patientName' => $r['patient_name'],
            'hospitalId' => $r['Hospital_STF_Hospital_id'] !== null ? (int)$r['Hospital_STF_Hospital_id'] : null,
            'hospitalName' => $r['Hospital_name'] ?: 'City Health Office',
            'bloodTypeId' => $r['BLOOD_TYPE_BloodTypeID'] !== null ? (int)$r['BLOOD_TYPE_BloodTypeID'] : null,
            'barangayId' => $r['BARANGAY_BarangayID'] !== null ? (int)$r['BARANGAY_BarangayID'] : null,
            'quantity' => $r['Quantity'] !== null ? (int)$r['Quantity'] : 1,
            'requestDate' => $r['REQ_DTE'],
            'status' => $r['REQ_STS'] ?: 'Pending'
        ];
    }
    return $out;
}

function api_load_drives($pdo) {
    $rows = $pdo->query("SELECT Blood_Dive_id, CTT_name, LOC, DTE, STS, BARANGAY_BarangayID FROM blood_drive")
        ->fetchAll(PDO::FETCH_ASSOC);
    $out = [];
    foreach ($rows as $r) {
        $out[] = [
            'id' => (int)$r['Blood_Dive_id'],
            'eventName' => $r['CTT_name'],
            'venue' => $r['LOC'],
            'scheduleDate' => $r['DTE'],
            'barangayId' => $r['BARANGAY_BarangayID'] !== null ? (int)$r['BARANGAY_BarangayID'] : null,
            'status' => $r['STS'] ?: 'Scheduled'
        ];
    }
    return $out;
}

function api_load_donations($pdo, $hasAppt, $onlyDonorIds = null) {
    $sql = "SELECT Match_id, REQ_STS, EMG_Blood_REQ_REQ_id, Volunteer_Blood_donor_donor_id" .
           ($hasAppt ? ", AppointmentDate, AppointmentTime, Instructions" : "") .
           " FROM donor_match";
    if ($onlyDonorIds !== null) {
        if (empty($onlyDonorIds)) return [];
        $in = implode(',', array_fill(0, count($onlyDonorIds), '?'));
        $sql .= " WHERE Volunteer_Blood_donor_donor_id IN ($in)";
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($onlyDonorIds ?? []);

    $out = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $doc = [
            'id' => (int)$r['Match_id'],
            'donorId' => (int)$r['Volunteer_Blood_donor_donor_id'],
            'requestId' => (int)$r['EMG_Blood_REQ_REQ_id'],
            'status' => $r['REQ_STS'] ?: 'Awaiting Confirmation'
        ];
        if ($hasAppt) {
            if (!empty($r['AppointmentDate'])) $doc['appointmentDate'] = $r['AppointmentDate'];
            if (!empty($r['AppointmentTime'])) $doc['appointmentTime'] = $r['AppointmentTime'];
            if (!empty($r['Instructions'])) $doc['appointmentNote'] = $r['Instructions'];
        }
        $out[] = $doc;
    }
    return $out;
}

function api_load_alerts($pdo, $hasCols, $onlyDonorIds = null) {
    if (!$hasCols) return []; // fix_database2.sql has not been run yet
    $sql = "SELECT NotificationID, Message, SentDate, USERS_UserID,
                   EMG_Blood_REQ_REQ_id, Volunteer_Blood_donor_donor_id, Status
            FROM notification
            WHERE EMG_Blood_REQ_REQ_id IS NOT NULL AND Volunteer_Blood_donor_donor_id IS NOT NULL";
    if ($onlyDonorIds !== null) {
        if (empty($onlyDonorIds)) return [];
        $in = implode(',', array_fill(0, count($onlyDonorIds), '?'));
        $sql .= " AND Volunteer_Blood_donor_donor_id IN ($in)";
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($onlyDonorIds ?? []);

    $out = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $out[] = [
            'id' => (int)$r['NotificationID'],
            'donorId' => (int)$r['Volunteer_Blood_donor_donor_id'],
            'requestId' => (int)$r['EMG_Blood_REQ_REQ_id'],
            'sentBy' => $r['Message'],   // the staff username is written inside the message text
            'sentAt' => $r['SentDate'],
            'status' => $r['Status'] ?: 'Sent'
        ];
    }
    return $out;
}

// ---------------------------------------------------------------------
// main
// ---------------------------------------------------------------------
try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $hasAppt = api_has_column($pdo, 'donor_match', 'AppointmentDate');
    $hasAlertCols = api_has_column($pdo, 'notification', 'EMG_Blood_REQ_REQ_id');

    // ---------------- LOAD ----------------
    if ($action === 'load') {

        if ($roleId === 4) {

            $myEmail = api_my_email($pdo, $userId);
            $myDonors = api_load_donors($pdo, $userId);
            $myDonorIds = array_map(fn($d) => $d['id'], $myDonors);

            $alerts = api_load_alerts($pdo, $hasAlertCols, $myDonorIds);
            $donations = api_load_donations($pdo, $hasAppt, $myDonorIds);

            $reqIds = array_unique(array_merge(
                array_column($alerts, 'requestId'),
                array_column($donations, 'requestId')
            ));

            $collections = [
                'donors' => $myDonors,
                'requests' => api_load_requests($pdo, array_values($reqIds)),
                'drives' => api_load_drives($pdo),
                'donations' => $donations,
                'alerts' => $alerts
            ];

        } else {

            $collections = [
                'users' => api_load_users($pdo),
                'donors' => api_load_donors($pdo),
                'requests' => api_load_requests($pdo),
                'drives' => api_load_drives($pdo),
                'donations' => api_load_donations($pdo, $hasAppt),
                'alerts' => api_load_alerts($pdo, $hasAlertCols)
            ];
        }

        // "initialized" = there is at least one real donor account already
        $initialized = (bool)$pdo->query("SELECT COUNT(*) FROM Volunteer_Blood_donor")->fetchColumn();

        api_out(['success' => true, 'initialized' => $initialized, 'role' => $roleId, 'collections' => $collections]);
    }

    // ---------------- SYNC ----------------
    if ($action === 'sync') {

        $body = json_decode(file_get_contents('php://input'), true);
        if (!is_array($body) || !isset($body['changes']) || !is_array($body['changes'])) {
            api_out(['success' => false, 'message' => 'No data was received.'], 400);
        }
        $changes = $body['changes'];
        $saved = 0;
        $removed = 0;

        $pdo->beginTransaction();

        // ---- DONORS (edit only - new donors are created by register_account.php) ----
        if (!empty($changes['donors']['upsert']) && in_array($roleId, [1, 3, 4], true)) {
            foreach ($changes['donors']['upsert'] as $doc) {

                $dbUserId = isset($doc['dbUserId']) ? (int)$doc['dbUserId'] : null;
                if (!$dbUserId) continue;
                if ($roleId === 4 && $dbUserId !== $userId) continue; // a donor may only edit himself

                $barangayId = api_barangay_id($pdo, $doc['_barangayName'] ?? '');
                $bloodTypeId = api_blood_type_id($pdo, $doc['_bloodTypeName'] ?? '');

                $set = ["FIR_name = ?", "MID_NAME = ?", "LST_name = ?", "SEX = ?", "phone_number = ?", "Address = ?"];
                $vals = [
                    trim((string)($doc['firstName'] ?? '')),
                    trim((string)($doc['middleName'] ?? '')),
                    trim((string)($doc['lastName'] ?? '')),
                    trim((string)($doc['sex'] ?? '')),
                    trim((string)($doc['phone'] ?? '')),
                    trim((string)($doc['address'] ?? ''))
                ];

                $birth = (string)($doc['birthDate'] ?? '');
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $birth)) {
                    $set[] = "BTH_DTE = ?"; $vals[] = $birth;
                }
                if ($barangayId) { $set[] = "BARANGAY_BarangayID = ?"; $vals[] = $barangayId; }
                if ($bloodTypeId) { $set[] = "BLOOD_TYPE_BloodTypeID = ?"; $vals[] = $bloodTypeId; }
                if (isset($doc['availability'])) { $set[] = "AVE_STE = ?"; $vals[] = (string)$doc['availability']; }

                $vals[] = $dbUserId;
                $pdo->prepare("UPDATE Volunteer_Blood_donor SET " . implode(', ', $set) . " WHERE USERS_UserID = ?")->execute($vals);

                $email = strtolower(trim((string)($doc['email'] ?? '')));
                if (preg_match('/^[a-z0-9._%+\-]+@gmail\.com$/', $email)) {
                    try {
                        $pdo->prepare("UPDATE USERS SET Email = ? WHERE UserID = ? AND ROLES_RoleID = 4")->execute([$email, $dbUserId]);
                    } catch (Throwable $e) { /* the Gmail address may already be used by someone else */ }
                }
                $saved++;
            }
        }

        // ---- DONOR VERIFICATION (CHO Admin clicks "Verify") ----
        if (!empty($changes['donors']['upsert']) && $roleId === 1) {
            foreach ($changes['donors']['upsert'] as $doc) {
                if (($doc['verificationStatus'] ?? '') === 'Verified' && !empty($doc['dbUserId'])) {

                    $donorRow = $pdo->prepare("SELECT donor_id FROM Volunteer_Blood_donor WHERE USERS_UserID = ? LIMIT 1");
                    $donorRow->execute([(int)$doc['dbUserId']]);
                    $donorId = $donorRow->fetchColumn();

                    if ($donorId !== false) {
                        $already = $pdo->prepare("SELECT 1 FROM donor_verification WHERE Volunteer_Blood_donor_donor_id = ? AND VerificationStatus = 'Verified' LIMIT 1");
                        $already->execute([$donorId]);
                        if (!$already->fetch()) {
                            $choAdminId = api_cho_admin_id($pdo, $userId); // [FIXED] was: raw $userId
                            if ($choAdminId !== null) {
                                try {
                                    $pdo->prepare("INSERT INTO donor_verification (VerificationStatus, VerificationDate, CIT_Health_OFF_ADM_admin_id, Volunteer_Blood_donor_donor_id) VALUES ('Verified', CURDATE(), ?, ?)")
                                        ->execute([$choAdminId, $donorId]);
                                    $saved++;
                                } catch (Throwable $e) {
                                    // one bad row should not cancel everything else in this save
                                }
                            }
                            // if $choAdminId is null, this CHO Admin has no row in cit_health_off_adm yet
                            // (see fix_database.sql) - the verification cannot be saved until that exists.
                        }
                    }
                }
            }
        }

        // ---- DELETE DONOR (real account too) ----
        if ($isStaff && in_array($roleId, [1, 3], true) && !empty($changes['donors']['delete'])) {
            foreach ($changes['donors']['delete'] as $donorId) {
                $row = $pdo->prepare("SELECT USERS_UserID FROM Volunteer_Blood_donor WHERE donor_id = ? LIMIT 1");
                $row->execute([(int)$donorId]);
                $realUserId = $row->fetchColumn();
                if ($realUserId !== false) {
                    $pdo->prepare("DELETE FROM donor_verification WHERE Volunteer_Blood_donor_donor_id = ?")->execute([(int)$donorId]);
                    $pdo->prepare("DELETE FROM donor_match WHERE Volunteer_Blood_donor_donor_id = ?")->execute([(int)$donorId]);
                    if ($hasAlertCols) {
                        $pdo->prepare("DELETE FROM notification WHERE Volunteer_Blood_donor_donor_id = ?")->execute([(int)$donorId]);
                    }
                    $pdo->prepare("DELETE FROM Volunteer_Blood_donor WHERE donor_id = ?")->execute([(int)$donorId]);
                    $pdo->prepare("DELETE FROM USERS WHERE UserID = ? AND ROLES_RoleID = 4")->execute([(int)$realUserId]);
                    $removed++;
                }
            }
        }

        // ---- EMERGENCY REQUESTS (CHO Admin, Hospital Staff) ----
        if (in_array($roleId, [1, 2], true)) {
            foreach (($changes['requests']['upsert'] ?? []) as $doc) {
                $bloodTypeId = isset($doc['bloodTypeId']) ? (int)$doc['bloodTypeId'] : null;
                $hospitalId = !empty($doc['hospitalId']) ? (int)$doc['hospitalId'] : null;
                if (!$hospitalId && $roleId === 2) {
                    $hospitalId = api_hospital_id($pdo, $userId); // [FIXED] fill in the hospital's own id automatically
                }
                $quantity = isset($doc['quantity']) ? (int)$doc['quantity'] : 1;
                $vals = [
                    trim((string)($doc['patientName'] ?? '')),
                    (string)($doc['requestDate'] ?? ''),
                    (string)($doc['status'] ?? 'Pending'),
                    $bloodTypeId, $hospitalId, $quantity
                ];
                $exists = false;
                if (!empty($doc['id'])) {
                    $chk = $pdo->prepare("SELECT REQ_id FROM emg_blood_req WHERE REQ_id = ?");
                    $chk->execute([(int)$doc['id']]);
                    $exists = (bool)$chk->fetchColumn();
                }
                if ($exists) {
                    $pdo->prepare("UPDATE emg_blood_req SET patient_name=?, REQ_DTE=?, REQ_STS=?, BLOOD_TYPE_BloodTypeID=?, Hospital_STF_Hospital_id=?, Quantity=? WHERE REQ_id=?")
                        ->execute(array_merge($vals, [(int)$doc['id']]));
                    $saved++;
                } else {
                    try {
                        $pdo->prepare("INSERT INTO emg_blood_req (patient_name, REQ_DTE, REQ_STS, BLOOD_TYPE_BloodTypeID, Hospital_STF_Hospital_id, Quantity) VALUES (?,?,?,?,?,?)")
                            ->execute($vals);
                        $saved++;
                    } catch (Throwable $e) {
                        // [FIXED - ADDED] one bad request should not cancel every other change in this save
                    }
                }
            }
            if ($isStaff) {
                foreach (($changes['requests']['delete'] ?? []) as $id) {
                    if ($hasAlertCols) $pdo->prepare("DELETE FROM notification WHERE EMG_Blood_REQ_REQ_id = ?")->execute([(int)$id]);
                    $pdo->prepare("DELETE FROM donor_match WHERE EMG_Blood_REQ_REQ_id = ?")->execute([(int)$id]);
                    $pdo->prepare("DELETE FROM emg_blood_req WHERE REQ_id = ?")->execute([(int)$id]);
                    $removed++;
                }
            }
        }

        // ---- BLOOD DRIVES (CHO Admin, Barangay Health Worker) ----
        if (in_array($roleId, [1, 3], true)) {
            foreach (($changes['drives']['upsert'] ?? []) as $doc) {
                $barangayId = isset($doc['barangayId']) ? (int)$doc['barangayId'] : null;
                $vals = [
                    trim((string)($doc['eventName'] ?? '')),
                    trim((string)($doc['venue'] ?? '')),
                    (string)($doc['scheduleDate'] ?? ''),
                    (string)($doc['status'] ?? 'Scheduled'),
                    $barangayId
                ];
                $exists = false;
                if (!empty($doc['id'])) {
                    $chk = $pdo->prepare("SELECT Blood_Dive_id FROM blood_drive WHERE Blood_Dive_id = ?");
                    $chk->execute([(int)$doc['id']]);
                    $exists = (bool)$chk->fetchColumn();
                }
                if ($exists) {
                    $pdo->prepare("UPDATE blood_drive SET CTT_name=?, LOC=?, DTE=?, STS=?, BARANGAY_BarangayID=? WHERE Blood_Dive_id=?")
                        ->execute(array_merge($vals, [(int)$doc['id']]));
                    $saved++;
                } else {
                    $choAdminId = $roleId === 1 ? api_cho_admin_id($pdo, $userId) : null; // [FIXED] was: raw $userId
                    try {
                        $pdo->prepare("INSERT INTO blood_drive (CTT_name, LOC, DTE, STS, BARANGAY_BarangayID, CIT_Health_OFF_ADM_admin_id) VALUES (?,?,?,?,?,?)")
                            ->execute(array_merge($vals, [$choAdminId]));
                        $saved++;
                    } catch (Throwable $e) {
                        // [FIXED - ADDED] one bad drive should not cancel every other change in this save
                    }
                }
            }
            if ($isStaff) {
                foreach (($changes['drives']['delete'] ?? []) as $id) {
                    $pdo->prepare("DELETE FROM blood_drive WHERE Blood_Dive_id = ?")->execute([(int)$id]);
                    $removed++;
                }
            }
        }

        // ---- DONATIONS / donor_match (CHO Admin, Hospital Staff write it; a donor may add his own "I can donate" row) ----
        foreach (($changes['donations']['upsert'] ?? []) as $doc) {
            $donorId = (int)($doc['donorId'] ?? 0);
            $requestId = (int)($doc['requestId'] ?? 0);
            if (!$donorId || !$requestId) continue;

            if ($roleId === 4) {
                $own = $pdo->prepare("SELECT 1 FROM Volunteer_Blood_donor WHERE donor_id = ? AND USERS_UserID = ?");
                $own->execute([$donorId, $userId]);
                if (!$own->fetchColumn()) continue;
            }

            $exists = $pdo->prepare("SELECT Match_id FROM donor_match WHERE Volunteer_Blood_donor_donor_id = ? AND EMG_Blood_REQ_REQ_id = ?");
            $exists->execute([$donorId, $requestId]);
            $matchId = $exists->fetchColumn();

            $status = (string)($doc['status'] ?? 'Awaiting Confirmation');

            if ($matchId) {
                $set = ["REQ_STS = ?"]; $vals = [$status];
                if ($hasAppt && $roleId !== 4) {
                    if (!empty($doc['appointmentDate'])) { $set[] = "AppointmentDate = ?"; $vals[] = $doc['appointmentDate']; }
                    if (!empty($doc['appointmentTime'])) { $set[] = "AppointmentTime = ?"; $vals[] = $doc['appointmentTime']; }
                    if (isset($doc['appointmentNote'])) { $set[] = "Instructions = ?"; $vals[] = $doc['appointmentNote']; }
                }
                $vals[] = $matchId;
                $pdo->prepare("UPDATE donor_match SET " . implode(', ', $set) . " WHERE Match_id = ?")->execute($vals);
            } else {
                $pdo->prepare("INSERT INTO donor_match (REQ_STS, EMG_Blood_REQ_REQ_id, Volunteer_Blood_donor_donor_id) VALUES (?,?,?)")
                    ->execute([$status, $requestId, $donorId]);
            }
            $saved++;
        }
        if ($isStaff) {
            foreach (($changes['donations']['delete'] ?? []) as $id) {
                $pdo->prepare("DELETE FROM donor_match WHERE Match_id = ?")->execute([(int)$id]);
                $removed++;
            }
        }

        // ---- ALERTS / notification (staff sends; a donor may only update his own to Responded/Declined) ----
        if ($hasAlertCols) {
            foreach (($changes['alerts']['upsert'] ?? []) as $doc) {
                $donorId = (int)($doc['donorId'] ?? 0);
                $requestId = (int)($doc['requestId'] ?? 0);
                if (!$donorId || !$requestId) continue;

                if ($roleId === 4) {
                    $own = $pdo->prepare("SELECT 1 FROM Volunteer_Blood_donor WHERE donor_id = ? AND USERS_UserID = ?");
                    $own->execute([$donorId, $userId]);
                    if (!$own->fetchColumn()) continue;

                    $pdo->prepare("UPDATE notification SET Status = ? WHERE Volunteer_Blood_donor_donor_id = ? AND EMG_Blood_REQ_REQ_id = ?")
                        ->execute([(string)($doc['status'] ?? 'Sent'), $donorId, $requestId]);
                    $saved++;
                    continue;
                }

                if (!$isStaff) continue;

                $exists = $pdo->prepare("SELECT NotificationID FROM notification WHERE Volunteer_Blood_donor_donor_id = ? AND EMG_Blood_REQ_REQ_id = ?");
                $exists->execute([$donorId, $requestId]);
                if ($exists->fetchColumn()) continue; // already alerted

                $donorRow = $pdo->prepare("SELECT USERS_UserID FROM Volunteer_Blood_donor WHERE donor_id = ? LIMIT 1");
                $donorRow->execute([$donorId]);
                $donorUserId = $donorRow->fetchColumn();
                if ($donorUserId === false) continue;

                $message = "Alert sent by " . (string)($doc['sentBy'] ?? $_SESSION['username'] ?? 'staff');
                $pdo->prepare("INSERT INTO notification (Message, SentDate, USERS_UserID, EMG_Blood_REQ_REQ_id, Volunteer_Blood_donor_donor_id, Status) VALUES (?, CURDATE(), ?, ?, ?, 'Sent')")
                    ->execute([$message, $donorUserId, $requestId, $donorId]);
                $saved++;
            }
        }

        $pdo->commit();
        api_out(['success' => true, 'saved' => $saved, 'removed' => $removed]);
    }

    // ---------------- RESET ----------------
    if ($action === 'reset') {
        if ($roleId !== 1) {
            api_out(['success' => false, 'message' => 'Only the City Health Office Admin can reset the records.'], 403);
        }
        if ($hasAlertCols) $pdo->exec("DELETE FROM notification WHERE EMG_Blood_REQ_REQ_id IS NOT NULL");
        $pdo->exec("DELETE FROM donor_match");
        $pdo->exec("DELETE FROM donor_verification");
        $pdo->exec("DELETE FROM emg_blood_req");
        $pdo->exec("DELETE FROM blood_drive");
        $pdo->exec("DELETE FROM Volunteer_Blood_donor");
        $pdo->exec("DELETE FROM USERS WHERE ROLES_RoleID = 4");
        api_out(['success' => true]);
    }

    api_out(['success' => false, 'message' => 'Unknown action.'], 400);

} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    api_out(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
}