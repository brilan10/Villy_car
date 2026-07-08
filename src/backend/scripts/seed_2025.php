<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=villy_car_db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Nombres de ejemplo
    $nombres = ['Juan Perez', 'Maria Gonzalez', 'Carlos Silva', 'Ana Rojas', 'Pedro Morales', 'Luisa Fernandez', 'Diego Castro', 'Sofia Herrera', 'Matias Vargas', 'Camila Soto'];
    
    // Categoria de Egresos
    $categorias_egreso = ['Materiales', 'Sueldos', 'Servicios', 'Impuestos', 'Arriendo', 'Marketing', 'Mantenimiento'];
    
    // Generar transacciones desde Enero 1 2025 hasta Hoy (Junio 16 2026)
    $startDate = strtotime('2025-01-01');
    $endDate = strtotime('2026-06-16');

    // 4 empresas
    for ($empresa_id = 1; $empresa_id <= 4; $empresa_id++) {
        
        // Generar 500 transacciones financieras por empresa
        for ($i = 0; $i < 500; $i++) {
            $randomTime = mt_rand($startDate, $endDate);
            $fecha = date('Y-m-d H:i:s', $randomTime);
            
            $es_ingreso = mt_rand(1, 100) <= 60; // 60% probabilidad de ingreso
            
            if ($es_ingreso) {
                $tipo = 'ingreso';
                $categoria = 'Ventas';
                $descripcion = "Venta a cliente " . $nombres[array_rand($nombres)];
                $monto = mt_rand(15000, 400000); // 15k a 400k
            } else {
                $tipo = 'egreso';
                $categoria = $categorias_egreso[array_rand($categorias_egreso)];
                $descripcion = "Pago de " . $categoria;
                $monto = mt_rand(5000, 250000); // 5k a 250k
            }
            
            $metodos = ['efectivo', 'tarjeta', 'transferencia'];
            $metodo = $metodos[array_rand($metodos)];
            
            $stmt = $pdo->prepare("INSERT INTO finanzas (empresa_id, tipo, categoria, monto, descripcion, metodo_pago, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$empresa_id, $tipo, $categoria, $monto, $descripcion, $metodo, $fecha]);
        }
    }

    echo "Datos de 2025 a 2026 insertados correctamente.\\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\\n";
}
?>
