import pandas as pd
import json
import datetime
import re

file_path = r'c:\Users\yomiy\Documents\Proyectos\Villy Car\analizar mejora\LIBRO MAYOR J2 PUBLICIDAD 2026 (1).xlsm'
sql_path = r'c:\Users\yomiy\Desktop\VillyCar_Webhost_Chile_BACKEND\limpiar_e_incorporar_j2.sql'

def clean_str(val):
    if pd.isna(val):
        return ""
    return str(val).strip()

def extract_date(val):
    if isinstance(val, datetime.datetime):
        return val.strftime('2026-%m-%d')
    s = str(val).split(' ')[0]
    if re.match(r'\d{4}-\d{2}-\d{2}', s):
        return "2026" + s[4:]
    return "2026-06-01"  # default fallback

try:
    xl = pd.ExcelFile(file_path)
    
    workers = set()
    descuentos = []
    bebidas = []
    deuda_dwork = []
    
    # Parse Descuentos
    df_desc = pd.read_excel(file_path, sheet_name='Descuentos colaboradores')
    for idx, row in df_desc.iterrows():
        fecha = row.iloc[1]
        concepto = row.iloc[2]
        colab = row.iloc[3]
        monto = row.iloc[4]
        if pd.notna(colab) and isinstance(colab, str) and colab.strip().upper() not in ['', 'COLABORADOR', 'NAN']:
            workers.add(colab.strip().title())
            if pd.notna(monto) and str(monto).replace('.', '').isdigit():
                descuentos.append({
                    'fecha': extract_date(fecha),
                    'concepto': str(concepto).strip(),
                    'colaborador': colab.strip().title(),
                    'monto': float(str(monto).replace(',', ''))
                })

    # Parse Bebidas
    df_beb = pd.read_excel(file_path, sheet_name='BEBIDAS', header=None)
    # Search for worker names in the sheet and the next 4 cells
    for idx, row in df_beb.iterrows():
        for col_idx in range(len(row)):
            cell_val = str(row.iloc[col_idx]).strip().upper()
            if cell_val in [w.upper() for w in workers] and col_idx + 4 < len(row):
                bebida = str(row.iloc[col_idx+1]).strip()
                cant = row.iloc[col_idx+2]
                if pd.notna(cant) and str(cant).replace('.', '').isdigit() and bebida:
                    bebidas.append({
                        'colaborador': cell_val.title(),
                        'bebida': bebida,
                        'cantidad': int(float(str(cant))),
                        'fecha': '2026-06-01'
                    })

    # Parse DEUDA DWORK
    df_dw = pd.read_excel(file_path, sheet_name='DEUDA DWORK', header=None)
    for idx, row in df_dw.iterrows():
        fecha = row.iloc[4]
        monto = row.iloc[5]
        concepto = row.iloc[6]
        abono = row.iloc[7]
        if pd.notna(monto) and str(monto).replace('.', '').isdigit() and str(monto).strip() != '0' and str(monto).strip() != 'MONTO':
            deuda_dwork.append({
                'fecha': extract_date(fecha),
                'monto': float(str(monto).replace(',', '')),
                'concepto': str(concepto).strip(),
                'abono': float(str(abono).replace(',', '')) if pd.notna(abono) and str(abono).replace('.', '').isdigit() else 0
            })

    # Generate SQL
    sql = []
    sql.append("-- =============================================")
    sql.append("-- SCRIPT DE LIMPIEZA E IMPORTACIÓN J2 PUBLICIDAD")
    sql.append("-- =============================================\n")
    
    sql.append("SET FOREIGN_KEY_CHECKS = 0;\n")
    
    sql.append("-- Corregir error de nombres de tablas de recursos humanos")
    sql.append("DROP TABLE IF EXISTS rrhh_anexos;")
    sql.append("DROP TABLE IF EXISTS rrhh_estados_pago;")
    
    sql.append("CREATE TABLE IF NOT EXISTS anexos_trabajador (id INT AUTO_INCREMENT PRIMARY KEY, empresa_id INT NOT NULL, trabajador_id INT NOT NULL, fecha DATE NOT NULL, sueldo_base_nuevo DECIMAL(10,2), detalle TEXT, archivo_url VARCHAR(255), created_at DATETIME DEFAULT CURRENT_TIMESTAMP);")
    sql.append("CREATE TABLE IF NOT EXISTS estados_pago_rrhh (id INT AUTO_INCREMENT PRIMARY KEY, empresa_id INT NOT NULL, trabajador_id INT, fecha DATE NOT NULL, monto_total DECIMAL(10,2) NOT NULL, descripcion_servicios TEXT, archivo_url VARCHAR(255), created_at DATETIME DEFAULT CURRENT_TIMESTAMP);")
    sql.append("-- Actualizar esquema de las tablas que fueron modificadas desde el viernes")
    sql.append("DROP TABLE IF EXISTS detalles_orden_trabajo;")
    sql.append("DROP TABLE IF EXISTS ordenes_trabajo;")
    sql.append("CREATE TABLE ordenes_trabajo (id INT AUTO_INCREMENT PRIMARY KEY, empresa_id INT NOT NULL, cliente_nombre VARCHAR(150) NOT NULL, cliente_telefono VARCHAR(50) DEFAULT NULL, vehiculo_patente VARCHAR(50) DEFAULT NULL, vehiculo_modelo VARCHAR(100) DEFAULT NULL, problema_reportado TEXT NOT NULL, estado VARCHAR(50) DEFAULT 'ingresado', total_estimado DECIMAL(12,2) DEFAULT 0.00, fecha_ingreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, fecha_entrega TIMESTAMP NULL DEFAULT NULL, area_asignada VARCHAR(50) DEFAULT 'Ambas', archivos TEXT DEFAULT NULL, empresa_derivada_id INT DEFAULT NULL, trabajador_asignado VARCHAR(150) DEFAULT NULL, estado_pago VARCHAR(50) DEFAULT 'pendiente');")
    sql.append("CREATE TABLE detalles_orden_trabajo (id INT AUTO_INCREMENT PRIMARY KEY, orden_id INT NOT NULL, descripcion VARCHAR(255) NOT NULL, tipo ENUM('servicio','repuesto') NOT NULL DEFAULT 'servicio', cantidad INT NOT NULL DEFAULT 1, precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00, subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00, FOREIGN KEY (orden_id) REFERENCES ordenes_trabajo(id) ON DELETE CASCADE);")
    
    sql.append("DROP TABLE IF EXISTS agendas;")
    sql.append("CREATE TABLE agendas (id INT AUTO_INCREMENT PRIMARY KEY, empresa_id INT NOT NULL, titulo VARCHAR(150) NOT NULL, cliente VARCHAR(150) DEFAULT NULL, fecha DATE NOT NULL, hora TIME NOT NULL, tipo VARCHAR(50) DEFAULT NULL, monto DECIMAL(12,2) DEFAULT NULL, detalles TEXT DEFAULT NULL, estado VARCHAR(50) DEFAULT NULL, trabajador VARCHAR(150) DEFAULT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, empresa_derivada_id INT DEFAULT NULL, cliente_email VARCHAR(100) DEFAULT NULL, alerta_enviada TINYINT(1) DEFAULT 0, estado_pago VARCHAR(50) DEFAULT 'pendiente');")
    
    sql.append("CREATE TABLE IF NOT EXISTS cotizaciones (id INT AUTO_INCREMENT PRIMARY KEY, empresa_id INT NOT NULL, cliente VARCHAR(255) DEFAULT NULL, rut VARCHAR(50) DEFAULT NULL, telefono VARCHAR(50) DEFAULT NULL, descripcion_proyecto TEXT DEFAULT NULL, items_json LONGTEXT DEFAULT NULL, subtotal DECIMAL(10,2) DEFAULT 0.00, iva DECIMAL(10,2) DEFAULT 0.00, total DECIMAL(10,2) DEFAULT 0.00, fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);\n")
    
    sql.append("DELETE FROM consumo_bebidas;")
    sql.append("DELETE FROM finanzas;")
    sql.append("DELETE FROM cuentas_cxc_cxp;")
    sql.append("DELETE FROM ordenes_trabajo;")
    sql.append("DELETE FROM agendas;")
    sql.append("DELETE FROM anexos_trabajador;")
    sql.append("DELETE FROM estados_pago_rrhh;")
    sql.append("DELETE FROM cotizaciones;")
    sql.append("DELETE FROM liquidaciones_sueldo;")
    sql.append("DELETE FROM trabajadores WHERE rol != 'admin' AND nombre NOT LIKE '%Joel%';\n")
    
    # Ensure J2 Publicidad exists
    sql.append("INSERT IGNORE INTO empresas (id, nombre) VALUES (2, 'J2 Publicidad');\n")
    
    # Insert Workers
    workers_list = list(workers)
    worker_map = {}
    worker_id_start = 100
    for w in workers_list:
        worker_map[w] = worker_id_start
        # Password for workers defaults to 123456
        sql.append(f"INSERT INTO trabajadores (id, empresa_id, nombre, rut, rol, password_hash) VALUES ({worker_id_start}, 2, '{w}', '11111111-1', 'trabajador', '$2y$10$wE0vP7L4iIqV1T0K/C/q/u9r5Z7.jF2s7W8n5zM9Z0X.a2b4c6d8e');")
        worker_id_start += 1
        
    sql.append("\n-- Descuentos / Vales")
    for d in descuentos:
        wid = worker_map[d['colaborador']]
        sql.append(f"INSERT INTO finanzas (empresa_id, tipo, categoria, monto, descripcion, fecha, metodo_pago) VALUES (2, 'egreso', 'Adelanto Sueldo', {d['monto']}, 'Vale/Descuento: {d['concepto']} - {d['colaborador']}', '{d['fecha']}', 'efectivo');")
        
    sql.append("\n-- Consumo de Bebidas")
    for b in bebidas:
        wid = worker_map[b['colaborador']]
        descripcion = f"{b['cantidad']} x {b['bebida']}"
        monto = b['cantidad'] * 1500
        sql.append(f"INSERT INTO consumo_bebidas (empresa_id, trabajador_id, fecha, monto, descripcion) VALUES (2, {wid}, '{b['fecha']}', {monto}, '{descripcion}');")
        
    sql.append("\n-- Deuda Dwork")
    for d in deuda_dwork:
        estado = 'pagada' if d['monto'] <= d['abono'] else 'debe'
        nombre = f"Taller mecanico Dwork - {d['concepto']}"
        sql.append(f"INSERT INTO cuentas_cxc_cxp (empresa_id, tipo, tipo_entidad, rut, nombre_entidad, monto_total, monto_pagado, fecha_vencimiento, estado) VALUES (2, 'pagar', 'proveedor', '12345678-9', '{nombre}', {d['monto']}, {d['abono']}, '{d['fecha']}', '{estado}');")
        
    sql.append("\nSET FOREIGN_KEY_CHECKS = 1;")
    
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql))
        
    print(f"Generated {sql_path} successfully!")
    
except Exception as e:
    print("Error:", str(e))
