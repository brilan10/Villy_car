# Plan de Mejoras y Correcciones (Villy Car)

He analizado los requerimientos iniciales y las nuevas ideas para órdenes de trabajo y comunicación entre empresas. A continuación te detallo el plan de acción para cada punto:

## 1. Cambio de búsqueda de Cliente/Trabajador por Nombre en vez de RUT
- **Solución:** Se cambiará el campo principal para que diga "Nombre del Cliente / Trabajador". El RUT aparecerá en un formato secundario (ej: `Juan Pérez (11.111.111-1)`). Esto aplicará a Agenda, Punto de Venta, RRHH y Clientes.

## 2. Reemplazar estado "En Taller" por "En Producción"
- **Solución:** Se actualizarán todas las referencias visuales y de código en el Calendario y Órdenes de Trabajo para que el estado pase a llamarse **En Producción**.

## 3. Persistencia de la Caja (Compartida entre J2 y Villy Car)
- **Solución:** La apertura de caja y sus montos se guardarán en la memoria del navegador (`localStorage`). Así, si abres la caja, se mantendrá abierta globalmente (incluso si cambias de pestaña o de empresa) hasta que explícitamente hagas el "Cierre de Caja".

## 4. Cálculo de IVA en Factura de Compra
- **Solución:** Se cambiará la columna a **Precio Neto (Sin IVA)**. Al ingresar los montos netos, el sistema calculará correctamente el **IVA (19%)** por separado y lo sumará al Neto para dar el **Total Gasto** final.

## 5. Menú cortado (No aparecen "Cobros y Pagos" ni "RRHH")
- **Solución:** Se habilitará una barra de desplazamiento (`overflow-y: auto`) en el menú lateral para que todos los ítems sean siempre accesibles sin importar el tamaño de la pantalla.

---

## 6. Roles en Órdenes de Trabajo (Diseño vs Producción)
Solicitaste que en las órdenes de trabajo solo haya 2 tipos de roles: **Diseño** y **Producción**, para que los trabajadores solo vean las tareas que se les asignan.
- **Propuesta de Solución:** 
  1. En las Órdenes de Trabajo, agregaremos un selector de **"Área Asignada"** (Diseño, Producción, o Ambas).
  2. En la vista de Órdenes (y/o Calendario), agregaremos un **filtro rápido** (botones en la parte superior) que diga: `[Ver Todo] | [Ver Diseño] | [Ver Producción]`. 
  3. De esta forma, el trabajador que sea diseñador hace clic en "Ver Diseño" y el tablero ocultará todo lo que sea de producción, permitiéndole enfocarse solo en su rol.

## 7. Flujo Interno (Comunicación entre Empresas)
Necesitas que empresas como *Villy Car* y *J2 Publicidad* se comuniquen entre sí, por ejemplo, Villy Car le solicita un trabajo a J2, y J2 lo puede ver en su calendario/órdenes y ejecutarlo.
- **Ideas Propuestas (Se añadirá al sistema):**
  1. **Solicitud de Traspaso / Cliente Interno:** Cuando estés en Villy Car creando un evento en el calendario o una orden, en vez de un cliente normal, podrás marcar una casilla que diga **"Trabajo Interno / Derivar a otra empresa"** y seleccionar a *J2 Publicidad*.
  2. **Aparición Mágica:** Al hacer eso, el evento/orden se guardará no solo para Villy Car, sino que **automáticamente aparecerá en el Calendario y Órdenes de Trabajo de J2 Publicidad** con una etiqueta especial (ej: `🔴 Solicitud Interna de Villy Car`).
  3. De este modo, cuando el equipo de J2 abra su sistema, verá en su calendario la orden lista para descargar y ejecutar, y al cambiarla a "En Producción", la información se mantendrá sincronizada.

## 8. Formato de Cotizaciones
- **Idea Propuesta:** Se deberá implementar un módulo o diseño de formato de cotizaciones que pueda ser generado (quizás como PDF o vista previsualizada) para ser mostrado y luego corregido o ajustado según las necesidades (por ejemplo en el módulo de ventas o punto de venta).

## 9. Adjuntar Múltiples Archivos y PDFs
- **Idea Propuesta:** Implementar la capacidad de subir y adjuntar múltiples archivos (PDFs, imágenes de anexos, documentos) en diferentes áreas del sistema (como en Órdenes de Trabajo, Expedientes de RRHH, o Cotizaciones) para mantener un registro documental completo de cada operación.
