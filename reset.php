<?php
// Include your database connection file (adjust filename if different, e.g., db.php or config.php)
require_once 'db.php'; 

$newPassword = 'Rexjoshua_11';
$username = 'ex.oshua.el.osario2';

// Hashes using your server's native algorithm
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

$stmt = $conn->prepare("UPDATE users SET Password = ? WHERE Username = ?");
$stmt->bind_param("ss", $hashedPassword, $username);

if ($stmt->execute()) {
    echo "Password successfully updated for " . $username;
} else {
    echo "Error updating password: " . $conn->error;
}
?>