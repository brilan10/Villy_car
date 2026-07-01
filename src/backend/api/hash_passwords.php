<?php
require_once 'db.php';

try {
    $stmt = $pdo->query("SELECT id, password_hash FROM trabajadores WHERE password_hash IS NOT NULL AND password_hash != ''");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $updatedCount = 0;
    foreach ($users as $u) {
        $pwd = $u['password_hash'];
        // Check if it's NOT a bcrypt hash (bcrypt starts with $2y$)
        if (substr($pwd, 0, 4) !== '$2y$') {
            $newHash = password_hash($pwd, PASSWORD_DEFAULT);
            $upd = $pdo->prepare("UPDATE trabajadores SET password_hash = ? WHERE id = ?");
            $upd->execute([$newHash, $u['id']]);
            $updatedCount++;
        }
    }
    
    echo json_encode(["success" => true, "updated" => $updatedCount]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
