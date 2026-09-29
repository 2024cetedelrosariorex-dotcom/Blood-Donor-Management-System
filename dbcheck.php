<?php
/*
 * db_check.php - quick test of the database connection for the system.
 * Open http://localhost/blood_donor_system/db_check.php  (every line should say OK)
 * DELETE this file after the test.
 */
if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
    http_response_code(403);
    exit('This page can only be opened from localhost.');
}

require_once 'config/db.php';
header('Content-Type: text/plain; charset=utf-8');

echo "DATABASE CHECK\n==============\n\n";

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "1. Connected to MySQL, database: " . $pdo->query('SELECT DATABASE()')->fetchColumn() . "  ... OK\n";

    $pdo->exec("CREATE TABLE IF NOT EXISTS app_records (
        Collection VARCHAR(30) NOT NULL,
        RecordID   BIGINT NOT NULL,
        Data       LONGTEXT NOT NULL,
        UpdatedAt  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (Collection, RecordID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    echo "2. Table app_records exists / created ... OK\n";

    $pdo->exec("DELETE FROM app_records WHERE Collection = '_test'");
    $pdo->prepare("INSERT INTO app_records (Collection, RecordID, Data) VALUES ('_test', 1, ?)")->execute(['{"hello":"world"}']);
    $back = $pdo->query("SELECT Data FROM app_records WHERE Collection = '_test' AND RecordID = 1")->fetchColumn();
    $pdo->exec("DELETE FROM app_records WHERE Collection = '_test'");
    echo "3. Write, read and delete a test row ... " . ($back === '{"hello":"world"}' ? 'OK' : 'FAILED') . "\n";

    $count = (int)$pdo->query("SELECT COUNT(*) FROM app_records WHERE Collection <> '_meta'")->fetchColumn();
    echo "4. Records saved so far: $count\n";

    foreach (['USERS', 'Volunteer_Blood_donor', 'BARANGAY', 'BLOOD_TYPE'] as $table) {
        try {
            $pdo->query("SELECT 1 FROM $table LIMIT 1");
            echo "5. Real table $table ... OK\n";
        } catch (Throwable $e) {
            echo "5. Real table $table ... NOT FOUND (" . $e->getMessage() . ")\n";
        }
    }

    echo "6. api.php file ... " . (file_exists(__DIR__ . '/api.php') ? 'OK' : 'MISSING - copy api.php to this folder') . "\n";

    $login = file_exists(__DIR__ . '/login.php') ? file_get_contents(__DIR__ . '/login.php') : '';
    echo "7. login.php starts the login session ... "
        . (strpos($login, 'session_start') !== false && strpos($login, "\$_SESSION['userId']") !== false
            ? 'OK'
            : 'NOT YET - replace login.php with the new login.php') . "\n";

    echo "\nIf every line says OK, log in to the system: a green 'Database: connected' label appears at the bottom left.\n";

} catch (Throwable $e) {
    echo "\nERROR: " . $e->getMessage() . "\n";
}