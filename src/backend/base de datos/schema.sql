-- Database Schema for Villy Car Multi-Empresa System
-- Compatible with MySQL and MariaDB (via phpMyAdmin and Web Host Chile)

CREATE DATABASE IF NOT EXISTS villy_car_db;
USE villy_car_db;

-- 1. Tabla: empresas (Companies)
CREATE TABLE IF NOT EXISTS `empresas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `rut` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `instagram` VARCHAR(100) DEFAULT NULL,
  `logo_url` VARCHAR(255) DEFAULT NULL,
  `tema_color` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla: clientes (Clients)
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `rut` VARCHAR(20) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `telefono` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CATEGORIAS PRODUCTOS
CREATE TABLE IF NOT EXISTS `categorias_productos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla: productos (Products)
CREATE TABLE IF NOT EXISTS `productos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `categoria_id` INT DEFAULT NULL,
  `sku` VARCHAR(50) DEFAULT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `precio_compra` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `precio_venta` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `tipo` ENUM('objeto', 'servicio', 'm2') NOT NULL DEFAULT 'objeto',
  `stock_actual` INT DEFAULT 0,
  `stock_minimo` INT DEFAULT 0,
  `imagen_url` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoria_id`) REFERENCES `categorias_productos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla: trabajadores (Workers / Employees)
CREATE TABLE IF NOT EXISTS `trabajadores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `rut` VARCHAR(20) NOT NULL,
  `nombre` VARCHAR(150) NOT NULL,
  `cargo` VARCHAR(100) DEFAULT NULL,
  `sueldo_base` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `tipo_contrato` VARCHAR(50) DEFAULT 'indefinido',
  `afp` VARCHAR(50) DEFAULT 'Modelo',
  `salud` VARCHAR(50) DEFAULT 'Fonasa',
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `rol` ENUM('admin', 'trabajador') DEFAULT 'trabajador',
  `activo` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla: cierres_caja (Cash Register Closures / Arqueos)
CREATE TABLE IF NOT EXISTS `cierres_caja` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `fecha_cierre` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `monto_apertura` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `ventas_efectivo_esperado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `ventas_tarjeta_esperado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `ventas_transferencia_esperado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `arqueo_efectivo_real` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `descuadre` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `detalles_denominacion` JSON DEFAULT NULL,
  `notas` TEXT DEFAULT NULL,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla: ventas (Sales Transactions)
CREATE TABLE IF NOT EXISTS `ventas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `cliente_nombre` VARCHAR(150) DEFAULT NULL,
  `total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `metodo_pago` ENUM('tarjeta', 'efectivo', 'transferencia', 'credito') NOT NULL,
  `fecha` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabla: detalles_venta (Sale Items / Breakdown)
CREATE TABLE IF NOT EXISTS `detalles_venta` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `venta_id` INT NOT NULL,
  `producto_id` INT NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 1,
  `precio_unitario` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabla: cuentas_cxc_cxp (Accounts Receivable / Accounts Payable)
CREATE TABLE IF NOT EXISTS `cuentas_cxc_cxp` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `tipo` ENUM('cobrar', 'pagar') NOT NULL,
  `tipo_entidad` ENUM('cliente', 'proveedor', 'trabajador') NOT NULL,
  `rut` VARCHAR(20) NOT NULL,
  `nombre_entidad` VARCHAR(150) NOT NULL,
  `monto_total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `monto_pagado` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `fecha_vencimiento` DATE NOT NULL,
  `estado` ENUM('debe', 'pagada') NOT NULL DEFAULT 'debe',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FINANZAS
CREATE TABLE IF NOT EXISTS `finanzas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `tipo` ENUM('ingreso', 'egreso') NOT NULL,
  `categoria` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `monto` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `metodo_pago` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabla: liquidaciones_sueldo (Processed Monthly Salaries)
CREATE TABLE IF NOT EXISTS `liquidaciones_sueldo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `trabajador_id` INT NOT NULL,
  `mes_periodo` VARCHAR(7) NOT NULL, -- 'YYYY-MM'
  `sueldo_base` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `bonos` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `gratificacion` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `total_imponible` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `afp_monto` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `salud_monto` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `anticipos` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `sueldo_liquido` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabla: estados_pago_rrhh (Payment Statuses for Contractors/Workers)
CREATE TABLE IF NOT EXISTS `estados_pago_rrhh` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `trabajador_id` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `monto_total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `descripcion_servicios` TEXT,
  `archivo_url` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ORDENES TRABAJO
CREATE TABLE IF NOT EXISTS `ordenes_trabajo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `empresa_id` INT NOT NULL,
  `cliente_nombre` VARCHAR(150) NOT NULL,
  `cliente_telefono` VARCHAR(50) DEFAULT NULL,
  `vehiculo_patente` VARCHAR(50) DEFAULT NULL,
  `vehiculo_modelo` VARCHAR(100) DEFAULT NULL,
  `problema_reportado` TEXT NOT NULL,
  `estado` VARCHAR(50) DEFAULT 'ingresado',
  `total_estimado` DECIMAL(12,2) DEFAULT 0.00,
  `trabajador_asignado` VARCHAR(150) DEFAULT NULL,
  `fecha_ingreso` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `fecha_entrega` TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DETALLES ORDEN TRABAJO
CREATE TABLE IF NOT EXISTS `detalles_orden_trabajo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orden_id` INT NOT NULL,
  `descripcion` VARCHAR(255) NOT NULL,
  `tipo` ENUM('servicio', 'repuesto') NOT NULL DEFAULT 'servicio',
  `cantidad` INT NOT NULL DEFAULT 1,
  `precio_unitario` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`orden_id`) REFERENCES `ordenes_trabajo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Semilla de Datos Iniciales para las 4 Empresas
INSERT INTO `empresas` (`id`, `nombre`, `rut`, `email`, `instagram`, `logo_url`, `tema_color`) VALUES
(1, 'J2 PUBLICIDAD SPA', '77.551.117-6', 'contacto@j2publicidad.com', NULL, 'Logfo j2 publicidad.jpeg', 'purple'),
(2, 'DWORK SPA', '78.083.174-K', 'dworkchile@gmail.com', NULL, NULL, 'slate'),
(3, 'Villy Car Spa', '78.263.871-8', 'contacto@villycartuning.com', 'villycar_tuning', 'Logo Villy Car.jpg', 'red'),
(4, 'Transportes y Turismos J2 SpA', '78.406.906-0', 'transportesyturismosj2@gmail.com', NULL, NULL, 'amber')
ON DUPLICATE KEY UPDATE `nombre`=VALUES(`nombre`), `rut`=VALUES(`rut`), `email`=VALUES(`email`), `instagram`=VALUES(`instagram`), `logo_url`=VALUES(`logo_url`), `tema_color`=VALUES(`tema_color`);
