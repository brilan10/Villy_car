SET NAMES utf8mb4;

-- Más Estados de Cuenta (Cuentas por cobrar y pagar) para J2 Publicidad
INSERT INTO cuentas_cxc_cxp (empresa_id, tipo, tipo_entidad, rut, nombre_entidad, monto_total, monto_pagado, fecha_vencimiento, estado) VALUES 
(3, 'cobrar', 'cliente', '76.555.444-1', 'Agencia Los Leones', 850000, 850000, '2026-05-15', 'pagada'),
(3, 'cobrar', 'cliente', '77.111.222-3', 'Automotora del Sur', 1200000, 600000, '2026-07-01', 'debe'),
(3, 'pagar', 'proveedor', '78.999.000-4', 'Impresiones Gigantes SPA', 450000, 0, '2026-06-25', 'debe'),
(3, 'pagar', 'proveedor', '76.333.222-1', 'Distribuidora Vinilos', 250000, 250000, '2026-04-10', 'pagada'),
(3, 'cobrar', 'cliente', '77.888.999-0', 'Inmobiliaria Los Andes', 1500000, 500000, '2026-06-15', 'debe');

-- Y agreguemos algunos Estados de Pago (RRHH) para J2 Publicidad para que también tenga datos
INSERT INTO estados_pago_rrhh (empresa_id, trabajador_id, fecha, monto_total, descripcion_servicios, archivo_url) VALUES 
(3, (SELECT id FROM trabajadores WHERE empresa_id=3 LIMIT 1), '2026-06-01', 500000, 'Estado de pago Junio Instalaciones', 'dummy1.pdf'),
(3, (SELECT id FROM trabajadores WHERE empresa_id=3 LIMIT 1 OFFSET 1), '2026-06-05', 450000, 'Produccion Grafica Junio', 'dummy2.pdf');
