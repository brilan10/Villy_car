<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=villy_car_db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Nombres de ejemplo
    $nombres = ["Juan Perez", "Maria Gonzalez", "Luis Soto", "Andrea Gomez", "Roberto Valdes", "Carlos Ruiz", "Ana Silva", "Pedro Soto", "Luis Ramos", "Camila Torres", "Matias Fernandez", "Sofia Vergara", "Diego Lopez", "Valentina Rojas"];
    $cargos = ["Mecánico", "Ayudante", "Administrador", "Vendedor", "Diseñador", "Instalador", "Conductor", "Secretaria"];
    
    // Seed workers
    $stmt = $pdo->prepare("INSERT INTO trabajadores (empresa_id, nombre, rut, cargo, sueldo_base, tipo_contrato) VALUES (?, ?, ?, ?, ?, 'indefinido')");
    
    for ($empresa_id = 1; $empresa_id <= 4; $empresa_id++) {
        for ($i = 0; $i < 20; $i++) {
            $nombre = $nombres[array_rand($nombres)] . " " . rand(1, 100);
            $rut = rand(10, 25) . "." . rand(100, 999) . "." . rand(100, 999) . "-" . rand(0, 9);
            $cargo = $cargos[array_rand($cargos)];
            $sueldo = rand(4, 15) * 100000;
            $stmt->execute([$empresa_id, $nombre, $rut, $cargo, $sueldo]);
        }
    }
    
    // Seed finances (Ingresos and Egresos from Jan 1 2026 to Jun 30 2026)
    $stmtFin = $pdo->prepare("INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES (?, ?, ?, ?, ?, ?, 'Transferencia')");
    
    $categoriasIngreso = ["Ventas", "Servicios", "Proyectos"];
    $categoriasEgreso = ["Materiales", "Planilla", "Remodelación", "Servicios", "Gastos Operativos", "Herramientas"];
    
    $startDate = strtotime("2026-01-01");
    $endDate = strtotime("2026-06-30");
    
    for ($empresa_id = 1; $empresa_id <= 4; $empresa_id++) {
        // Generar 400 transacciones por empresa
        for ($i = 0; $i < 400; $i++) {
            $timestamp = mt_rand($startDate, $endDate);
            $fecha = date("Y-m-d", $timestamp);
            
            $isIngreso = (rand(1, 100) > 40); // 60% ingresos, 40% egresos
            
            if ($isIngreso) {
                $tipo = 'ingreso';
                $categoria = $categoriasIngreso[array_rand($categoriasIngreso)];
                $monto = rand(10, 800) * 1000;
                $desc = "Ingreso por " . $categoria . " #" . rand(1000, 9999);
            } else {
                $tipo = 'egreso';
                $categoria = $categoriasEgreso[array_rand($categoriasEgreso)];
                $monto = rand(5, 450) * 1000;
                $desc = "Pago de " . $categoria . " ref " . rand(100, 999);
            }
            
            $stmtFin->execute([$empresa_id, $fecha, $tipo, $categoria, $desc, $monto]);
        }
    }
    
    echo "Seed completed successfully.\n";
} catch (PDOException $e) {
    die("DB Error: " . $e->getMessage());
}
?>
