# Lista de Tareas Operativas: Proyecto Sistema Multi-Empresa (Fase 1 - Frontend Local)

Esta lista de tareas cubre el desarrollo de las interfaces gráficas interactivas locales para las 4 empresas, con persistencia y lógica simulada.

- [x] **1. Configuración de Sesión y Estructura**
  - [x] Implementar persistencia de `currentCompany` y `activeTab` en local storage (`App.jsx`).
  - [x] Añadir los nuevos módulos en el menú de la barra lateral (`Sidebar.jsx`).
  - [x] Crear los archivos de componentes vacíos y enlazarlos en `App.jsx`.

- [x] **2. Módulo Punto de Venta (POS) y Metro Cuadrado**
  - [x] Configurar propiedad `requiresM2` en productos de J2 Publicidad.
  - [x] Crear el modal interactivo de dimensiones (Ancho y Alto) en el POS para calcular metros cuadrados y el total.
  - [x] Diseñar el modal de cobro interactivo con opciones de tipo de pago (Tarjeta, Efectivo, Transferencia) y condición (Contado, Crédito 30/60 días).

- [x] **3. Módulo de Cuentas por Cobrar y Pagar (CXC / CXP)**
  - [x] Diseñar la vista de deudas dividida en Cuentas por Cobrar y Cuentas por Pagar.
  - [x] Diseñar formulario modal "Añadir Registro" que permita clasificar deudores como clientes, proveedores o empleados.
  - [x] Añadir la lógica visual de Cuenta Regresiva de días restantes con colores semáforo.
  - [x] Diseñar el modal para visualizar el detalle del documento asociado (Factura o Vale de empleado).
  - [x] Programar la opción de registrar abonos parciales que descuenten la deuda acumulada.
  - [x] **[NUEVO]** Diseñar la pantalla de Estado de Pago consolidado (EDP) por cliente (desglose de cargos vs abonos).

- [x] **4. Módulo Financiero Independiente**
  - [x] Diseñar tarjetas KPI resumen (Ingresos, Egresos, Caja Neta, IVA/PPM estimados) que carguen según la empresa activa por defecto.
  - [x] Crear el selector interactivo para filtrar y comparar métricas entre las 4 empresas.
  - [x] Mostrar el listado contable resumido con historial de egresos e ingresos.
  - [x] **[NUEVO]** Crear formulario de Arqueo de Caja denominacional (conteo de billetes físicos y descuadres).
  - [x] **[NUEVO]** Agregar reporte visual de comisiones divididas (75% J2 / 25% Joel).

- [x] **5. Módulo de Recursos Humanos y Remuneraciones**
  - [x] Crear pestaña de "Expediente del Personal" con lista de trabajadores y previsualizaciones de Contratos, Anexos y Finiquitos.
  - [x] Diseñar la "Calculadora de Remuneraciones" con campos para sueldo base, horas extras, bonos y descuentos.
  - [x] Programar la visualización/descarga de la liquidación de sueldo simulada en pantalla.
  - [x] **[NUEVO]** Incluir en el cálculo de sueldo el desglose detallado de deducciones (bebidas consumidas y vales individuales).

- [x] **6. Módulo de Órdenes de Trabajo (OT)**
  - [x] Crear un tablero Kanban interactivo con columnas: Pendiente, En Proceso, Por Entregar, Entregado.
  - [x] Diseñar tarjetas de tareas asignadas con ID de OT, Cliente, Trabajo, Técnico Responsable y Fecha de entrega con contador de días.
  - [x] Programar el modal para crear nuevas órdenes de trabajo y permitir mover las tarjetas entre estados.

- [x] **7. Recordatorios por Correo y Pruebas**
  - [x] En `CalendarManager.jsx`, añadir casilla de verificar "Enviar recordatorio por correo" y selector de tiempo (1 hora antes).
  - [x] Diseñar simulación visual mediante Toast alerts para cuando se aproxima la alerta del correo.
  - [x] Realizar pruebas cruzadas navegando entre empresas para certificar el aislamiento absoluto de los datos en `localStorage`.
