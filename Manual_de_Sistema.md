# Manual del Sistema: Plataforma de Gestión Multi-Empresa

Este documento explica el funcionamiento de la maqueta interactiva (mockup) desarrollada para la administración centralizada de cuatro empresas distintas.

## 1. Concepto General
El sistema está diseñado como un **Panel de Control Centralizado**. Permite a un administrador gestionar múltiples negocios desde una única pantalla, sin necesidad de iniciar sesión en diferentes páginas. 

Actualmente, el sistema gestiona 4 entidades:
1. **Taller Mecánico** (Tema Industrial/Ámbar)
2. **Transportes** (Tema Base, sin logo)
3. **J2 Publicidad** (Tema Púrpura/Creativo)
4. **Billy Car Tuning** (Tema Rojo Carmesí/Deportivo)

> **Nota:** Al cambiar de empresa, toda la paleta de colores y el logo se adaptan a la identidad visual corporativa seleccionada.

---

## 2. Navegación (Barra Lateral)
A la izquierda de la pantalla se encuentra el **Menú Principal**.
- **Selector de Empresa:** Un menú desplegable que te permite saltar instantáneamente entre los 4 negocios.
- **Pestañas de Módulos:** Te permite navegar entre las diferentes herramientas del negocio activo (Dashboard, Punto de Venta, Mantenedor, Egresos e Ingresos).

---

## 3. Módulos del Sistema

### 📊 Dashboard (Panel de Control Financiero)
Es la pantalla de inicio y muestra la salud del negocio seleccionado.
- **Filtros de Tiempo:** Puedes alternar la vista entre *Diario*, *Semanal* y *Mensual*. Todos los gráficos se actualizarán solos.
- **Gráficos Financieros:** Muestra la curva de Ingresos vs Egresos para entender los flujos de caja.
- **Rendimiento:** Indicadores clave como el Crecimiento de Ventas y la Tasa de Rentabilidad.
- **Sugerencia del Sistema:** Una inteligencia de negocio (simulada) que lee tus gastos mayores y te da consejos (por ejemplo: "Tus gastos en Remodelación están muy altos").

### 🛒 Punto de Venta (POS)
La herramienta principal para atender a los clientes en mostrador.
- **Catálogo Dinámico:** Si estás en "Agua Purificada", verás bidones; si estás en "Billy Car Tuning", verás instalaciones de radios y polarizados.
- **Carrito de Compras:** Puedes hacer clic en los productos para agregarlos a la boleta del lado derecho. Permite sumar o restar cantidades.
- **Cobro:** Calcula automáticamente el total de la venta a cobrar al cliente.

### 📦 Mantenedor de Productos / Servicios
Aquí es donde el administrador maneja el inventario base.
- **Listado Actual:** Muestra todos los productos y servicios con sus códigos, stock y precios.
- **Control de Stock:** Los productos físicos tienen stock (ej. 150 bidones), pero a los *Servicios* (ej. Desarrollo Web, Instalación de Radios) se les asigna un stock ilimitado (representado por "999" o el símbolo "∞").
- **Nuevo Registro:** Permite agregar un nuevo producto al catálogo (formulario de prueba).

### 💳 Egresos e Ingresos (Módulo Contable)
El libro contable del negocio.
- **Ingresos y Egresos Simples:** Botones rápidos para registrar dinero que entra o sale sin mucha justificación (ej. pago rápido de una cuenta de luz).
- **Ingresar Factura (Avanzado):** Un formulario detallado diseñado para comprar materiales. 
  - Puedes detallar el Proveedor y N° de Factura.
  - Permite agregar **múltiples ítems** a la factura (ej: 5 litros de pintura a $10.000 c/u).
  - El sistema calcula matemáticamente el Neto, el IVA (19%) y el Total a pagar.
  - Al hacer clic en "Guardar Factura", ese total se envía automáticamente al listado de gastos como un *Egreso por Factura de Compra*.

---

## 4. ¿Qué sigue? (Futuras Expansiones)
Por ahora, esta aplicación es una "Maqueta Frontend". Esto significa que funciona en tu navegador local (en `http://localhost:5173/`) para demostrar la experiencia visual y los flujos de trabajo. Los datos se reinician si refrescas la página.

Para transformarlo en un sistema real, los siguientes pasos de desarrollo serían:
1. Conectarlo a una Base de Datos en la nube (ej. MySQL o Firebase).
2. Conectar el Punto de Venta con el Módulo de Ingresos.
3. Generar PDF de boletas para imprimir.
4. Crear un sistema de Login de Empleados.
