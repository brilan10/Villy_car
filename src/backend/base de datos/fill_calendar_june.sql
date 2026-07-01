SET NAMES utf8mb4;

-- ==============================================================================
-- LLENADO DE DATOS: CALENDARIO JUNIO 2026 PARA J2 PUBLICIDAD (ID = 3)
-- ==============================================================================

-- 1. ÓRDENES DE TRABAJO PARA J2 PUBLICIDAD (Se mostrarán como [OT] en el Calendario)
INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, cliente_telefono, vehiculo_patente, vehiculo_modelo, problema_reportado, estado, area_asignada, trabajador_asignado, fecha_ingreso) VALUES 
(3, 'Constructora Los Andes', '+56911112222', 'N/A', 'N/A', 'Fabricacion Letrero Acrilico', 'completado', 'Producción', 'Felipe Neira', '2026-06-02 09:00:00'),
(3, 'Boutique Paris', '+56933334444', 'N/A', 'N/A', 'Diseno de Pendones', 'entregado', 'Diseño', 'Andrea Gomez', '2026-06-03 11:30:00'),
(3, 'Panaderia El Sol', '+56955556666', 'N/A', 'N/A', 'Impresion de Volantes', 'en_reparacion', 'Producción', 'Juan Perez', '2026-06-10 14:00:00'),
(3, 'Colegio Norte', '+56977778888', 'N/A', 'N/A', 'Instalacion Gigantografia', 'en_revision', 'Ambas', 'Luis Ramos', '2026-06-15 10:30:00'),
(3, 'Gimnasio Fit', '+56999990000', 'N/A', 'N/A', 'Rotulacion de Vidrios', 'ingresado', 'Producción', 'Matias Fernandez', '2026-06-25 09:00:00'),
(3, 'Clinica Dental', '+56922223333', 'N/A', 'N/A', 'Senaletica Interior', 'ingresado', 'Ambas', 'Roberto Valdes', '2026-06-28 15:00:00');

-- 2. AGENDAS (Citas) PARA J2 PUBLICIDAD (Se mostrarán como [Agenda] en el Calendario)
INSERT INTO agendas (empresa_id, titulo, cliente, fecha, hora, tipo, monto, detalles, estado, trabajador) VALUES 
(3, 'Reunion Cliente Constructora', 'Constructora Los Andes', '2026-06-01', '10:00:00', 'Oficina', 0, 'Reunion para definir disenos del letrero', 'Finalizado', 'Andrea Gomez'),
(3, 'Visita a Terreno Colegio', 'Colegio Norte', '2026-06-12', '12:00:00', 'Terreno', 0, 'Tomar medidas para la gigantografia', 'Finalizado', 'Felipe Neira'),
(3, 'Entrega de Volantes', 'Panaderia El Sol', '2026-06-14', '16:00:00', 'Flete', 5000, 'Llevar cajas de volantes al local', 'Confirmado', 'Juan Perez'),
(3, 'Instalacion Rotulacion', 'Gimnasio Fit', '2026-06-25', '09:00:00', 'Instalación', 150000, 'Llevar andamios y pistola de calor', 'Agendado', 'Matias Fernandez');

-- ==============================================================================
-- LLENADO DE DATOS: CALENDARIO JUNIO 2026 PARA VILLY CAR TUNING (ID = 4)
-- ==============================================================================

-- 1. ÓRDENES DE TRABAJO PARA VILLY CAR TUNING (Se mostrarán como [OT] en el Calendario)
INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, cliente_telefono, vehiculo_patente, vehiculo_modelo, problema_reportado, estado, area_asignada, trabajador_asignado, fecha_ingreso) VALUES 
(4, 'Carlos Gonzalez', '+56912345678', 'BBCC-12', 'Subaru WRX 2018', 'Instalacion Aleron Carbono', 'completado', 'Estética', 'Diego Lopez', '2026-06-04 10:00:00'),
(4, 'Maria Perez', '+56987654321', 'FFDD-99', 'Peugeot 208 GTI', 'Cambio Sistema Escape Completo', 'entregado', 'Mecánica', 'Pedro Soto', '2026-06-08 09:30:00'),
(4, 'Juan Morales', '+56911223344', 'GGHH-88', 'Ford Mustang V8', 'Reprogramacion Stage 2', 'en_reparacion', 'Electrónica', 'Diego Lopez', '2026-06-12 11:00:00'),
(4, 'Andres Silva', '+56999887766', 'JJLL-55', 'VW Golf GTI', 'Instalacion Suspension Roscada', 'en_revision', 'Mecánica', 'Carlos Ruiz', '2026-06-16 14:00:00'),
(4, 'Sebastian Rios', '+56955443322', 'XXYY-11', 'BMW M3 E46', 'Pulido y Sellado Ceramico', 'ingresado', 'Estética', 'Matias Fernandez', '2026-06-22 09:00:00'),
(4, 'Fernanda Castro', '+56977665544', 'ZZAA-22', 'Audi S3', 'Instalacion Audio Premium', 'ingresado', 'Audio', 'Pedro Soto', '2026-06-26 15:30:00');

-- 2. AGENDAS (Citas) PARA VILLY CAR TUNING (Se mostrarán como [Agenda] en el Calendario)
INSERT INTO agendas (empresa_id, titulo, cliente, fecha, hora, tipo, monto, detalles, estado, trabajador) VALUES 
(4, 'Evaluacion Proyecto Mustang', 'Juan Morales', '2026-06-05', '11:00:00', 'Mecánica', 0, 'Revisar estado del motor antes del Stage 2', 'Finalizado', 'Diego Lopez'),
(4, 'Lavado Premium BMW', 'Sebastian Rios', '2026-06-20', '10:00:00', 'Estética', 25000, 'Lavado detallado antes del sellado', 'Confirmado', 'Matias Fernandez'),
(4, 'Cotizacion Sistema Audio', 'Fernanda Castro', '2026-06-23', '16:00:00', 'Audio', 0, 'Mostrar catalogo de parlantes y amplificadores', 'Agendado', 'Pedro Soto');
