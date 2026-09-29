<?php
require_once 'config/db.php';

echo "Connection successful!<br><br>";

// Try pulling data from the ROLES table to confirm we can actually query it
try {
    $stmt = $pdo->query("SELECT * FROM ROLES");
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($roles) > 0) {
        echo "Roles found in database:<br>";
        foreach ($roles as $role) {
            echo $role['RoleID'] . " - " . $role['RoleName'] . "<br>";
        }
    } else {
        echo "Connected fine, but the ROLES table is empty (that's expected — you haven't added any roles yet).";
    }
} catch (PDOException $e) {
    echo "Query failed: " . $e->getMessage();
}
?>
