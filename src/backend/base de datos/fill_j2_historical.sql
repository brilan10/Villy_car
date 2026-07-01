SET NAMES utf8mb4;

-- Agregar Ventas Históricas (Enero a Junio 2026) para J2 Publicidad
INSERT INTO ventas (empresa_id, cliente_nombre, fecha, total, metodo_pago) VALUES 
(3, 'Constructora XYZ', '2026-01-15 10:00:00', 120000, 'transferencia'),
(3, 'Panadería El Sol', '2026-01-28 14:30:00', 45000, 'efectivo'),
(3, 'Boutique Paris', '2026-02-10 11:15:00', 85000, 'tarjeta'),
(3, 'Farmacia San Juan', '2026-02-22 16:45:00', 150000, 'transferencia'),
(3, 'Colegio Norte', '2026-03-05 09:20:00', 250000, 'transferencia'),
(3, 'Minimarket Los Andes', '2026-03-18 13:10:00', 35000, 'efectivo'),
(3, 'Zapatería Centro', '2026-04-02 10:05:00', 65000, 'tarjeta'),
(3, 'Agencia de Viajes', '2026-04-15 15:30:00', 180000, 'transferencia'),
(3, 'Restaurante El Mar', '2026-05-08 12:40:00', 110000, 'tarjeta'),
(3, 'Ferretería Industrial', '2026-05-20 09:50:00', 320000, 'transferencia'),
(3, 'Gimnasio Fit', '2026-06-02 11:30:00', 75000, 'efectivo'),
(3, 'Clínica Dental', '2026-06-12 14:15:00', 210000, 'transferencia'),
(3, 'Tienda de Mascotas', '2026-06-18 16:00:00', 45000, 'tarjeta'),
(3, 'Supermercado Ahorro', '2026-06-20 10:20:00', 450000, 'transferencia');

-- Agregar Finanzas Históricas (Ingresos y Egresos de Enero a Junio)
INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES 
(3, '2026-01-10', 'ingreso', 'Ventas', 'Abono Constructora', 60000, 'transferencia'),
(3, '2026-01-25', 'egreso', 'Materiales', 'Compra de vinilos', 80000, 'tarjeta'),
(3, '2026-02-15', 'ingreso', 'Ventas', 'Campaña Farmacia', 150000, 'transferencia'),
(3, '2026-02-28', 'egreso', 'Sueldos', 'Sueldos Febrero', 600000, 'transferencia'),
(3, '2026-03-10', 'ingreso', 'Ventas', 'Letrero Colegio', 250000, 'transferencia'),
(3, '2026-03-20', 'egreso', 'Servicios', 'Luz e Internet', 45000, 'transferencia'),
(3, '2026-04-10', 'ingreso', 'Ventas', 'Publicidad Viajes', 180000, 'transferencia'),
(3, '2026-04-25', 'egreso', 'Materiales', 'Tinta plotter', 120000, 'tarjeta'),
(3, '2026-05-15', 'ingreso', 'Ventas', 'Letreros Ferretería', 320000, 'transferencia'),
(3, '2026-05-30', 'egreso', 'Sueldos', 'Sueldos Mayo', 650000, 'transferencia'),
(3, '2026-06-05', 'ingreso', 'Ventas', 'Abono Clínica', 105000, 'transferencia'),
(3, '2026-06-15', 'egreso', 'Marketing', 'Publicidad en Facebook', 30000, 'tarjeta'),
(3, '2026-06-21', 'ingreso', 'Ventas', 'Pago Supermercado', 450000, 'transferencia');

-- Agregar Liquidaciones de Sueldo (Payrolls) de meses anteriores
INSERT INTO liquidaciones_sueldo (empresa_id, trabajador_id, mes_periodo, sueldo_base, bonos, total_imponible, afp_monto, salud_monto, sueldo_liquido) VALUES 
(3, 5, '2026-01', 500000, 50000, 550000, 55000, 38500, 456500),
(3, 11, '2026-01', 600000, 0, 600000, 60000, 42000, 498000),
(3, 5, '2026-02', 500000, 0, 500000, 50000, 35000, 415000),
(3, 11, '2026-02', 600000, 100000, 700000, 70000, 49000, 581000),
(3, 5, '2026-03', 500000, 50000, 550000, 55000, 38500, 456500),
(3, 11, '2026-03', 600000, 0, 600000, 60000, 42000, 498000),
(3, 5, '2026-04', 500000, 20000, 520000, 52000, 36400, 431600),
(3, 11, '2026-04', 600000, 50000, 650000, 65000, 45500, 539500),
(3, 5, '2026-05', 500000, 100000, 600000, 60000, 42000, 498000),
(3, 11, '2026-05', 600000, 0, 600000, 60000, 42000, 498000);

-- Actualizar Fechas de las ventas antiguas que ya estaban
UPDATE ventas SET fecha = '2026-03-22 15:00:00' WHERE empresa_id = 3 AND cliente_nombre = 'Peluqueria Look';
UPDATE ventas SET fecha = '2026-04-28 11:30:00' WHERE empresa_id = 3 AND cliente_nombre = 'Agencia Creativa';
