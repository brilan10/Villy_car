<?php
require_once 'src/backend/api/db.php';

try {
    // Seed Workers
    $nombres = ["Juan Perez", "Maria Gonzalez", "Luis Soto", "Andrea Gomez", "Roberto Valdes", "Carlos Ruiz", "Ana Silva", "Pedro Soto", "Luis Ramos", "Camila Torres", "Matias Fernandez", "Sofia Vergara", "Diego Lopez", "Valentina Rojas"];
    $cargos = ["Mecánico", "Ayudante", "Administrador", "Vendedor", "Diseñador", "Instalador", "Conductor", "Secretaria"];
    
    $stmtTrabajador = $pdo->prepare("INSERT INTO trabajadores (empresa_id, nombre, rut, cargo, sueldo_base, tipo_contrato, password_hash) VALUES (?, ?, ?, ?, ?, 'indefinido', ?)");
    $hash = password_hash('123456', PASSWORD_DEFAULT);
    
    // Seed Clients
    $stmtCliente = $pdo->prepare("INSERT INTO clientes (empresa_id, nombre, rut, telefono) VALUES (?, ?, ?, ?)");
    
    // Seed Products
    $stmtProd = $pdo->prepare("INSERT INTO productos (empresa_id, sku, nombre, precio_compra, precio_venta, tipo, stock_actual, imagen_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    // Finanzas
    $stmtFin = $pdo->prepare("INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES (?, ?, ?, ?, ?, ?, 'Transferencia')");
    
    $categoriasIngreso = ["Ventas", "Servicios", "Proyectos"];
    $categoriasEgreso = ["Materiales", "Planilla", "Remodelación", "Servicios", "Gastos Operativos", "Herramientas"];
    
    $startDate = strtotime("2026-01-01");
    $endDate = strtotime("2026-06-30");
    
    for ($empresa_id = 1; $empresa_id <= 4; $empresa_id++) {
        // Trabajadores
        for ($i = 0; $i < 15; $i++) {
            $nombre = $nombres[array_rand($nombres)] . " " . rand(1, 100);
            $rut = rand(10, 25) . "." . rand(100, 999) . "." . rand(100, 999) . "-" . rand(0, 9);
            $cargo = $cargos[array_rand($cargos)];
            $sueldo = rand(4, 15) * 100000;
            $stmtTrabajador->execute([$empresa_id, $nombre, $rut, $cargo, $sueldo, $hash]);
        }
        
        // Clientes
        for ($i = 0; $i < 15; $i++) {
            $rut = rand(10, 25) . "." . rand(100, 999) . "." . rand(100, 999) . "-" . rand(0, 9);
            $stmtCliente->execute([$empresa_id, "Cliente " . rand(100,999), $rut, "+569".rand(10000000,99999999)]);
        }
        
        // Productos
        $categorias = ["Audio", "Iluminación", "Accesorios", "Repuestos", "Herramientas", "Seguridad"];
        for ($i = 0; $i < 30; $i++) {
            $stmtProd->execute([
                $empresa_id, 
                "PROD-" . rand(1000, 9999), 
                "Producto Especial " . rand(1, 100), 
                rand(3, 80) * 1000, 
                rand(5, 100) * 1000, 
                "objeto", 
                rand(10, 100),
                null
            ]);
        }
        
        // Finanzas
        for ($i = 0; $i < 150; $i++) {
            $timestamp = mt_rand($startDate, $endDate);
            $fecha = date("Y-m-d", $timestamp);
            $isIngreso = (rand(1, 100) > 40);
            
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
