<?php
require_once 'db.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // Asegurar que la tabla exista
    $pdo->exec("CREATE TABLE IF NOT EXISTS cotizaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empresa_id INT NOT NULL,
        cliente VARCHAR(255),
        rut VARCHAR(50),
        telefono VARCHAR(50),
        descripcion_proyecto TEXT,
        items_json LONGTEXT,
        subtotal DECIMAL(10,2) DEFAULT 0,
        iva DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
} catch (PDOException $e) {
    // Ignorar si hay error de permisos, asumimos que existe
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!isset($_GET['empresa_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'empresa_id es requerido']);
        exit;
    }
    
    $empresa_id_param = $_GET['empresa_id'];
    
    try {
        if ($empresa_id_param === 'all') {
            $stmt = $pdo->prepare("SELECT * FROM cotizaciones ORDER BY fecha DESC");
            $stmt->execute();
        } else {
            $stmt = $pdo->prepare("SELECT * FROM cotizaciones WHERE empresa_id = ? ORDER BY fecha DESC");
            $stmt->execute([$empresa_id_param]);
        }
        $quotes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($quotes as &$quote) {
            $quote['items'] = json_decode($quote['items_json'], true) ?: [];
            unset($quote['items_json']);
        }
        
        echo json_encode($quotes);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener cotizaciones: ' . $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Si no viene en el body, usar el parámetro GET
    $empresa_id_post = $data['empresa_id'] ?? $_GET['empresa_id'] ?? null;
    
    if (!$empresa_id_post || !isset($data['cliente'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan campos requeridos (empresa_id o cliente)']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO cotizaciones (empresa_id, cliente, rut, telefono, descripcion_proyecto, items_json, subtotal, iva, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $empresa_id_post,
            $data['cliente'],
            $data['rut'] ?? '',
            $data['telefono'] ?? '',
            $data['descripcion_proyecto'] ?? '',
            json_encode($data['items'] ?? []),
            $data['subtotal'] ?? 0,
            $data['iva'] ?? 0,
            $data['total'] ?? 0
        ]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Cotización creada con éxito']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear cotización: ' . $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID es requerido']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE cotizaciones SET cliente=?, rut=?, telefono=?, descripcion_proyecto=?, items_json=?, subtotal=?, iva=?, total=? WHERE id=?");
        $stmt->execute([
            $data['cliente'] ?? '',
            $data['rut'] ?? '',
            $data['telefono'] ?? '',
            $data['descripcion_proyecto'] ?? '',
            json_encode($data['items'] ?? []),
            $data['subtotal'] ?? 0,
            $data['iva'] ?? 0,
            $data['total'] ?? 0,
            $data['id']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Cotización actualizada con éxito']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al actualizar cotización: ' . $e->getMessage()]);
    }
} elseif ($method === 'DELETE') {
    if (!isset($_GET['id'])) {
        responseJson(['error' => 'ID es requerido'], 400);
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM cotizaciones WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        responseJson(['success' => true, 'message' => 'Cotización eliminada']);
    } catch (PDOException $e) {
        responseJson(['error' => 'Error al eliminar cotización: ' . $e->getMessage()], 500);
    }
} else {
    responseJson(['error' => 'Método no permitido'], 405);
}
