-- Eliminar ventas y órdenes de trabajo (para evitar conflictos de foreign key restrictivos)
DELETE FROM ventas WHERE empresa_id = 1;
DELETE FROM ordenes_trabajo WHERE empresa_id = 1;
DELETE FROM productos WHERE empresa_id = 1;
DELETE FROM categorias_productos WHERE empresa_id = 1;

UPDATE empresas SET nombre = 'Dwork' WHERE id = 1;

-- Categorías y Servicios para Dwork (Maestranza)
INSERT INTO categorias_productos (empresa_id, nombre) VALUES 
(1, 'Servicios de Mecanizado'),
(1, 'Soldadura Especializada'),
(1, 'Corte y Doblez CNC'),
(1, 'Mantenimiento Industrial');

-- Insertar Servicios de Maestranza
-- Nota: como no sabemos los IDs insertados, usamos subconsultas
INSERT INTO productos (empresa_id, categoria_id, nombre, sku, descripcion, precio_compra, precio_venta, tipo, stock_actual, stock_minimo) VALUES 
(1, (SELECT id FROM categorias_productos WHERE empresa_id=1 AND nombre='Servicios de Mecanizado' LIMIT 1), 'Torneado de Pieza', 'S-TOR-01', 'Mecanizado en torno por hora', 0, 35000, 'servicio', 999, 0),
(1, (SELECT id FROM categorias_productos WHERE empresa_id=1 AND nombre='Servicios de Mecanizado' LIMIT 1), 'Fresado de Precisión', 'S-FRE-01', 'Mecanizado en fresadora por hora', 0, 40000, 'servicio', 999, 0),
(1, (SELECT id FROM categorias_productos WHERE empresa_id=1 AND nombre='Soldadura Especializada' LIMIT 1), 'Soldadura TIG Aluminio', 'S-TIG-AL', 'Cordón TIG especializado', 0, 50000, 'servicio', 999, 0),
(1, (SELECT id FROM categorias_productos WHERE empresa_id=1 AND nombre='Soldadura Especializada' LIMIT 1), 'Soldadura MIG Acero', 'S-MIG-AC', 'Cordón MIG por metro', 0, 15000, 'servicio', 999, 0),
(1, (SELECT id FROM categorias_productos WHERE empresa_id=1 AND nombre='Corte y Doblez CNC' LIMIT 1), 'Corte Plasma CNC', 'S-CNC-PL', 'Corte de plancha metalica', 0, 25000, 'servicio', 999, 0),
(1, (SELECT id FROM categorias_productos WHERE empresa_id=1 AND nombre='Corte y Doblez CNC' LIMIT 1), 'Doblez de Plancha', 'S-DOB-PL', 'Plegado de plancha en V', 0, 8000, 'servicio', 999, 0),
(1, (SELECT id FROM categorias_productos WHERE empresa_id=1 AND nombre='Mantenimiento Industrial' LIMIT 1), 'Fabricación de Estructura Base', 'S-EST-01', 'Fabricación de base metálica a medida', 0, 250000, 'servicio', 999, 0);

-- Ventas de ejemplo de Maestranza
INSERT INTO ventas (empresa_id, cliente_nombre, fecha, total, metodo_pago) VALUES 
(1, 'Constructora ABC', '2026-06-05 10:30:00', 125000, 'transferencia'),
(1, 'Ingeniería Sur', '2026-06-12 14:20:00', 350000, 'transferencia');

-- Asignar las ventas a los productos (obteniendo el id de las ventas recien insertadas)
INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES 
((SELECT id FROM ventas WHERE empresa_id=1 ORDER BY id ASC LIMIT 1), (SELECT id FROM productos WHERE empresa_id=1 AND sku='S-TIG-AL'), 2, 50000, 100000),
((SELECT id FROM ventas WHERE empresa_id=1 ORDER BY id ASC LIMIT 1), (SELECT id FROM productos WHERE empresa_id=1 AND sku='S-CNC-PL'), 1, 25000, 25000),
((SELECT id FROM ventas WHERE empresa_id=1 ORDER BY id DESC LIMIT 1), (SELECT id FROM productos WHERE empresa_id=1 AND sku='S-EST-01'), 1, 250000, 250000),
((SELECT id FROM ventas WHERE empresa_id=1 ORDER BY id DESC LIMIT 1), (SELECT id FROM productos WHERE empresa_id=1 AND sku='S-TIG-AL'), 2, 50000, 100000);

-- Ordenes de trabajo de Maestranza
INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, vehiculo_patente, vehiculo_modelo, problema_reportado, estado, total_estimado, fecha_ingreso) VALUES 
(1, 'Minería del Norte', 'N/A', 'Maquinaria Pesada', 'Reparación de tolva, soldadura estructural', 'en_reparacion', 450000, '2026-06-10 09:00:00'),
(1, 'Agroindustrias SA', 'N/A', 'Cinta Transportadora', 'Fabricación de polines de acero inox', 'completado', 180000, '2026-06-08 10:00:00');

-- Actualizar cargos de trabajadores
UPDATE trabajadores SET cargo = 'Maestro Soldador' WHERE id = 1;
UPDATE trabajadores SET cargo = 'Operador CNC' WHERE id = 2;
