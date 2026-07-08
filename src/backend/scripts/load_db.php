<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Read and execute schema
    $schema = file_get_contents(__DIR__ . '/src/backend/base de datos/schema.sql');
    $pdo->exec($schema);
    echo "Schema executed successfully.\n";
    
    // Switch DB
    $pdo->exec("USE villy_car_db");
    
    // Read and execute seed
    $seed = file_get_contents(__DIR__ . '/src/backend/base de datos/seed_massive.sql');
    // Split into statements since exec sometimes fails with huge multi-statements
    $pdo->exec($seed);
    echo "Seed executed successfully.\n";
    
} catch (PDOException $e) {
    die("DB ERROR: " . $e->getMessage());
}
