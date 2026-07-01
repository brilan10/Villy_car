-- SEED MASIVO PARA VILLY CAR Y FILIALES (4 EMPRESAS)
-- Generado para pruebas y demostración.

-- 1. Dwork (Maestranza, empresa_id = 1)
-- Categorías y Productos
INSERT INTO categorias_productos (empresa_id, nombre) VALUES 
(1, 'Servicios de Mecanizado'),
(1, 'Soldadura Especializada'),
(1, 'Corte y Doblez CNC'),
(1, 'Mantenimiento Industrial');

INSERT INTO productos (empresa_id, categoria_id, nombre, sku, descripcion, precio_compra, precio_venta, tipo, stock_actual, stock_minimo) VALUES 
(1, 1, 'Torneado de Pieza', 'S-TOR-01', 'Mecanizado en torno por hora', 0, 35000, 'servicio', 999, 0),
(1, 1, 'Fresado de Precisión', 'S-FRE-01', 'Mecanizado en fresadora por hora', 0, 40000, 'servicio', 999, 0),
(1, 2, 'Soldadura TIG Aluminio', 'S-TIG-AL', 'Cordón TIG especializado', 0, 50000, 'servicio', 999, 0),
(1, 2, 'Soldadura MIG Acero', 'S-MIG-AC', 'Cordón MIG por metro', 0, 15000, 'servicio', 999, 0),
(1, 3, 'Corte Plasma CNC', 'S-CNC-PL', 'Corte de plancha metalica', 0, 25000, 'servicio', 999, 0),
(1, 3, 'Doblez de Plancha', 'S-DOB-PL', 'Plegado de plancha en V', 0, 8000, 'servicio', 999, 0),
(1, 4, 'Fabricación de Estructura Base', 'S-EST-01', 'Fabricación de base metálica', 0, 250000, 'servicio', 999, 0);

-- Ventas (Dwork)
INSERT INTO ventas (empresa_id, cliente_nombre, fecha, total, metodo_pago) VALUES 
(1, 'Constructora ABC', '2026-06-05 10:30:00', 125000, 'transferencia'),
(1, 'Ingeniería Sur', '2026-06-12 14:20:00', 350000, 'transferencia');

INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES 
(1, 3, 2, 50000, 100000), (1, 5, 1, 25000, 25000), -- Venta 1
(2, 7, 1, 250000, 250000), (2, 3, 2, 50000, 100000); -- Venta 2

-- Finanzas (Dwork)
INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES 
(1, '2026-06-05', 'ingreso', 'Ventas', 'Venta Servicios Constructora', 125000, 'transferencia'),
(1, '2026-06-08', 'egreso', 'Inventario', 'Compra gas argón para TIG', 85000, 'transferencia'),
(1, '2026-06-12', 'ingreso', 'Ventas', 'Ingeniería Sur', 350000, 'transferencia'),
(1, '2026-06-15', 'egreso', 'Sueldos', 'Anticipo quincena', 300000, 'transferencia');

-- Trabajadores (Dwork)
INSERT INTO trabajadores (empresa_id, rut, nombre, cargo, sueldo_base, tipo_contrato) VALUES 
(1, '15.111.222-3', 'Pedro Gómez', 'Maestro Soldador', 850000, 'indefinido'),
(1, '18.333.444-5', 'Juan Muñoz', 'Operador CNC', 750000, 'indefinido');

-- Cuentas por Cobrar/Pagar (J2 Publicidad)
INSERT INTO cuentas_cxc_cxp (empresa_id, tipo, tipo_entidad, rut, nombre_entidad, monto_total, monto_pagado, fecha_vencimiento, estado) VALUES 
(3, 'cobrar', 'cliente', '77.888.999-0', 'Municipalidad Centro', 450000, 150000, '2026-06-30', 'debe'),
(3, 'cobrar', 'cliente', '76.555.444-1', 'Agencia Los Leones', 850000, 850000, '2026-05-15', 'pagada'),
(3, 'cobrar', 'cliente', '77.111.222-3', 'Automotora del Sur', 1200000, 600000, '2026-07-01', 'debe'),
(3, 'pagar', 'proveedor', '78.999.000-4', 'Impresiones Gigantes SPA', 450000, 0, '2026-06-25', 'debe'),
(3, 'pagar', 'proveedor', '76.333.222-1', 'Distribuidora Vinilos', 250000, 250000, '2026-04-10', 'pagada'),
(3, 'cobrar', 'cliente', '77.888.999-0', 'Inmobiliaria Los Andes', 1500000, 500000, '2026-06-15', 'debe');

-- Estados de Pago RRHH (J2 Publicidad)
INSERT INTO estados_pago_rrhh (empresa_id, trabajador_id, fecha, monto_total, descripcion_servicios, archivo_url) VALUES 
(3, 5, '2026-06-01', 500000, 'Estado de pago Junio Instalaciones', 'dummy1.pdf'),
(3, 11, '2026-06-05', 450000, 'Produccion Grafica Junio', 'dummy2.pdf');

-- Cuentas por Cobrar/Pagar (Dwork)
INSERT INTO cuentas_cxc_cxp (empresa_id, tipo, tipo_entidad, rut, nombre_entidad, monto_total, monto_pagado, fecha_vencimiento, estado) VALUES 
(1, 'pagar', 'proveedor', '76.123.456-7', 'Gases Industriales SPA', 300000, 100000, '2026-06-20', 'debe'),
(1, 'cobrar', 'cliente', '77.555.444-5', 'Minería del Norte', 550000, 0, '2026-06-30', 'debe');

-- Ordenes de Trabajo (Dwork)
INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, vehiculo_patente, vehiculo_modelo, problema_reportado, estado, fecha_ingreso) VALUES 
(1, 'Minería del Norte', 'N/A', 'Maquinaria Pesada', 'Reparación de tolva, soldadura estructural', 'en_reparacion', '2026-06-08 09:00:00'),
(1, 'Agroindustrias SA', 'N/A', 'Cinta Transportadora', 'Fabricación de polines de acero inox', 'completado', '2026-06-05 10:00:00'),
(4, 'Rosa Perez', 'XYZ-99', 'Chevrolet Sail 2020', 'Frenos largos', 'completado', '2026-06-05 10:00:00');

-- ------------------------------------------------------------------------------------------------
-- DATOS HISTORICOS PARA GRAFICOS EN J2 PUBLICIDAD (Enero a Junio 2026)
-- ------------------------------------------------------------------------------------------------
INSERT INTO ventas (empresa_id, cliente_nombre, fecha, total, metodo_pago) VALUES 
(3, 'Constructora XYZ', '2026-01-15 10:00:00', 120000, 'transferencia'),
(3, 'Panaderia El Sol', '2026-01-28 14:30:00', 45000, 'efectivo'),
(3, 'Boutique Paris', '2026-02-10 11:15:00', 85000, 'tarjeta'),
(3, 'Farmacia San Juan', '2026-02-22 16:45:00', 150000, 'transferencia'),
(3, 'Colegio Norte', '2026-03-05 09:20:00', 250000, 'transferencia'),
(3, 'Minimarket Los Andes', '2026-03-18 13:10:00', 35000, 'efectivo'),
(3, 'Zapateria Centro', '2026-04-02 10:05:00', 65000, 'tarjeta'),
(3, 'Agencia de Viajes', '2026-04-15 15:30:00', 180000, 'transferencia'),
(3, 'Restaurante El Mar', '2026-05-08 12:40:00', 110000, 'tarjeta'),
(3, 'Ferreteria Industrial', '2026-05-20 09:50:00', 320000, 'transferencia');

INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES 
(3, '2026-01-10', 'ingreso', 'Ventas', 'Abono Constructora', 60000, 'transferencia'),
(3, '2026-01-25', 'egreso', 'Materiales', 'Compra de vinilos', 80000, 'tarjeta'),
(3, '2026-02-15', 'ingreso', 'Ventas', 'Campana Farmacia', 150000, 'transferencia'),
(3, '2026-02-28', 'egreso', 'Sueldos', 'Sueldos Febrero', 600000, 'transferencia'),
(3, '2026-03-10', 'ingreso', 'Ventas', 'Letrero Colegio', 250000, 'transferencia'),
(3, '2026-03-20', 'egreso', 'Servicios', 'Luz e Internet', 45000, 'transferencia'),
(3, '2026-04-10', 'ingreso', 'Ventas', 'Publicidad Viajes', 180000, 'transferencia'),
(3, '2026-04-25', 'egreso', 'Materiales', 'Tinta plotter', 120000, 'tarjeta'),
(3, '2026-05-15', 'ingreso', 'Ventas', 'Letreros Ferreteria', 320000, 'transferencia'),
(3, '2026-05-30', 'egreso', 'Sueldos', 'Sueldos Mayo', 650000, 'transferencia');

INSERT INTO liquidaciones_sueldo (empresa_id, trabajador_id, mes_periodo, sueldo_base, bonos, total_imponible, afp_monto, salud_monto, sueldo_liquido) VALUES 
(3, 5, '2026-01', 500000, 50000, 550000, 55000, 38500, 456500),
(3, 11, '2026-01', 600000, 0, 600000, 60000, 42000, 498000),
(3, 5, '2026-02', 500000, 0, 500000, 50000, 35000, 415000),
(3, 11, '2026-02', 600000, 100000, 700000, 70000, 49000, 581000),
(3, 5, '2026-03', 500000, 50000, 550000, 55000, 38500, 456500),
(3, 11, '2026-03', 600000, 0, 600000, 60000, 42000, 498000);

INSERT INTO detalles_orden_trabajo (orden_id, descripcion, tipo, cantidad, precio_unitario, subtotal) VALUES 
(1, 'Plancha Acero Hardox 5mm', 'repuesto', 1, 150000, 150000),
(1, 'Servicio Soldadura Especial', 'servicio', 1, 300000, 300000),
(2, 'Acero Inox Tubo 2"', 'repuesto', 2, 45000, 90000),
(2, 'Torneado de ejes', 'servicio', 1, 90000, 90000);

UPDATE ordenes_trabajo SET total_estimado = 450000 WHERE id = 1;
UPDATE ordenes_trabajo SET total_estimado = 180000 WHERE id = 2;



-- 2. Transportes (empresa_id = 2)
INSERT INTO categorias_productos (empresa_id, nombre) VALUES 
(2, 'Servicios de Flete'),
(2, 'Mudanzas');

INSERT INTO productos (empresa_id, categoria_id, nombre, sku, descripcion, precio_compra, precio_venta, stock_actual, stock_minimo) VALUES 
(2, 1, 'Flete Local Normal (Camión)', 'S-FLET-LOC', 'Flete dentro de la comuna', 0, 45000, 999, 0),
(2, 2, 'Mudanza Casa Completa', 'S-MUD-CAS', 'Mudanza 3 habitaciones', 0, 180000, 999, 0);

INSERT INTO ventas (empresa_id, cliente_nombre, fecha, total, metodo_pago) VALUES 
(2, 'Constructora XYZ', '2026-05-12 08:30:00', 90000, 'transferencia'),
(2, 'Familia Soto', '2026-06-02 10:00:00', 180000, 'efectivo');

INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES 
(4, 7, 2, 45000, 90000), -- Venta 4
(5, 8, 1, 180000, 180000); -- Venta 5

INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES 
(2, '2026-05-12', 'ingreso', 'Ventas', 'Fletes Constructora', 90000, 'transferencia'),
(2, '2026-05-20', 'egreso', 'Combustible', 'Petroleo Camion 1', 65000, 'tarjeta'),
(2, '2026-06-02', 'ingreso', 'Ventas', 'Mudanza Familia Soto', 180000, 'efectivo'),
(2, '2026-06-05', 'egreso', 'Mantenimiento', 'Cambio neumaticos camion', 240000, 'transferencia');

INSERT INTO trabajadores (empresa_id, rut, nombre, cargo, sueldo_base, tipo_contrato) VALUES 
(2, '12.555.666-7', 'Carlos Rojas', 'Chofer Camión', 650000, 'indefinido'),
(2, '19.777.888-9', 'Luis Perez', 'Peoneta', 400000, 'indefinido');

INSERT INTO cuentas_cxc_cxp (empresa_id, tipo, tipo_entidad, rut, nombre_entidad, monto_total, monto_pagado, fecha_vencimiento, estado) VALUES 
(2, 'pagar', 'proveedor', '76.999.888-1', 'Copec S.A.', 500000, 200000, '2026-06-15', 'debe'),
(2, 'cobrar', 'cliente', '77.111.222-3', 'Constructora Sur', 180000, 0, '2026-07-01', 'debe');


-- 3. J2 Publicidad (empresa_id = 3)
INSERT INTO categorias_productos (empresa_id, nombre) VALUES 
(3, 'Impresión Gran Formato'),
(3, 'Diseño Gráfico'),
(3, 'Merchandising');

INSERT INTO productos (empresa_id, categoria_id, nombre, sku, descripcion, precio_compra, precio_venta, stock_actual, stock_minimo) VALUES 
(3, 3, 'Pendon Roller 80x200cm', 'I-PEN-80', 'Pendon impreso completo', 15000, 35000, 10, 2),
(3, 4, 'Hora de Diseño', 'S-DIS-HR', 'Hora de diseño grafico', 0, 15000, 999, 0),
(3, 5, 'Tazones Personalizados x12', 'M-TAZ-12', 'Tazones sublimados pack', 12000, 24000, 5, 1);

INSERT INTO ventas (empresa_id, cliente_nombre, fecha, total, metodo_pago) VALUES 
(3, 'Peluqueria Look', '2026-04-22 15:00:00', 35000, 'efectivo'),
(3, 'Agencia Creativa', '2026-05-28 11:30:00', 39000, 'transferencia'),
(3, 'Colegio San Jose', '2026-06-08 14:00:00', 48000, 'transferencia');

INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES 
(6, 9, 1, 35000, 35000), -- Venta 6
(7, 10, 1, 15000, 15000), (7, 11, 1, 24000, 24000), -- Venta 7
(8, 11, 2, 24000, 48000); -- Venta 8

INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES 
(3, '2026-04-22', 'ingreso', 'Ventas', 'Venta Peluqueria Look', 35000, 'efectivo'),
(3, '2026-05-10', 'egreso', 'Insumos', 'Tinta plotter e insumos', 150000, 'tarjeta'),
(3, '2026-05-28', 'ingreso', 'Ventas', 'Venta Agencia', 39000, 'transferencia'),
(3, '2026-06-08', 'ingreso', 'Ventas', 'Tazones Colegio', 48000, 'transferencia');

INSERT INTO trabajadores (empresa_id, rut, nombre, cargo, sueldo_base, tipo_contrato) VALUES 
(3, '16.555.444-2', 'Felipe Neira', 'Diseñador Gráfico', 700000, 'indefinido');

INSERT INTO cuentas_cxc_cxp (empresa_id, tipo, tipo_entidad, rut, nombre_entidad, monto_total, monto_pagado, fecha_vencimiento, estado) VALUES 
(3, 'pagar', 'proveedor', '76.333.222-1', 'Importadora Plotter', 250000, 0, '2026-06-25', 'debe');


-- 4. Villy Car Tuning (empresa_id = 4)
INSERT INTO categorias_productos (empresa_id, nombre) VALUES 
(4, 'Audio Car'),
(4, 'Accesorios Exteriores'),
(4, 'Accesorios Interiores');

INSERT INTO productos (empresa_id, categoria_id, nombre, sku, descripcion, precio_compra, precio_venta, stock_actual, stock_minimo) VALUES 
(4, 6, 'Radio Android 9 Pulgadas', 'A-RAD-9', 'Radio con CarPlay/AndroidAuto', 80000, 150000, 8, 2),
(4, 6, 'Subwoofer 12" Pioneer', 'A-SUB-12', 'Subwoofer 1400w', 65000, 110000, 4, 1),
(4, 7, 'Kit Luces LED H4', 'E-LED-H4', 'Ampolletas LED 8000lm', 15000, 25000, 15, 5),
(4, 8, 'Cubre Volante Sparco', 'I-CUB-SP', 'Cubre volante deportivo', 8000, 15000, 20, 5);

INSERT INTO ventas (empresa_id, cliente_nombre, fecha, total, metodo_pago) VALUES 
(4, 'Matias Fernandez', '2026-05-18 16:30:00', 150000, 'tarjeta'),
(4, 'Diego Morales', '2026-06-04 12:00:00', 135000, 'efectivo');

INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES 
(9, 12, 1, 150000, 150000), -- Venta 9
(10, 13, 1, 110000, 110000), (10, 14, 1, 25000, 25000); -- Venta 10

INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES 
(4, '2026-05-18', 'ingreso', 'Ventas', 'Venta Radio', 150000, 'tarjeta'),
(4, '2026-05-25', 'egreso', 'Inventario', 'Compra radios y parlantes', 450000, 'transferencia'),
(4, '2026-06-04', 'ingreso', 'Ventas', 'Venta audio y luces', 135000, 'efectivo');

INSERT INTO trabajadores (empresa_id, rut, nombre, cargo, sueldo_base, tipo_contrato) VALUES 
(4, '17.888.999-0', 'Matías Vera', 'Técnico Instalador', 600000, 'indefinido');

INSERT INTO cuentas_cxc_cxp (empresa_id, tipo, tipo_entidad, rut, nombre_entidad, monto_total, monto_pagado, fecha_vencimiento, estado) VALUES 
(4, 'pagar', 'proveedor', '76.444.555-1', 'Audio Pro Import', 600000, 300000, '2026-06-12', 'debe');

INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, vehiculo_patente, vehiculo_modelo, problema_reportado, estado, fecha_ingreso) VALUES 
(4, 'Jose Medina', 'HHYY-22', 'Kia Rio 5', 'Instalacion radio android', 'ingresado', '2026-06-09 10:00:00');

INSERT INTO detalles_orden_trabajo (orden_id, descripcion, tipo, cantidad, precio_unitario, subtotal) VALUES 
(3, 'Radio Android', 'repuesto', 1, 150000, 150000),
(3, 'Mano de obra instalacion', 'servicio', 1, 30000, 30000);

UPDATE ordenes_trabajo SET total_estimado = 180000 WHERE id = 3;

-- LIQUIDACIONES DE SUELDO (Demostración genérica de mayo para algunos)
INSERT INTO liquidaciones_sueldo (empresa_id, trabajador_id, mes_periodo, sueldo_base, bonos, gratificacion, total_imponible, afp_monto, salud_monto, anticipos, sueldo_liquido) VALUES 
(1, 1, '2026-05', 750000, 50000, 0, 800000, 80000, 56000, 0, 664000),
(1, 2, '2026-05', 450000, 20000, 0, 470000, 47000, 32900, 20000, 370100),
(2, 3, '2026-05', 650000, 100000, 0, 750000, 75000, 52500, 0, 622500),
(3, 5, '2026-05', 700000, 0, 0, 700000, 70000, 49000, 0, 581000),
(4, 6, '2026-05', 600000, 30000, 0, 630000, 63000, 44100, 0, 522900);
