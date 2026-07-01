import pandas as pd
import datetime
import re

file_path = r'c:\Users\yomiy\Documents\Proyectos\Villy Car\analizar mejora\LIBRO MAYOR J2 PUBLICIDAD 2026 (1).xlsm'
sql_path = r'c:\Users\yomiy\Desktop\VillyCar_Webhost_Chile_BACKEND\Semilla_Dashboard.sql'

def extract_date(val):
    if isinstance(val, datetime.datetime):
        return val.strftime('2026-%m-%d')
    s = str(val).split(' ')[0]
    if re.match(r'\d{4}-\d{2}-\d{2}', s):
        return "2026" + s[4:]
    return "2026-06-01"

try:
    workers = set()
    descuentos = {}
    bebidas = {}
    deuda_dwork = []
    
    # Descuentos
    df_desc = pd.read_excel(file_path, sheet_name='Descuentos colaboradores')
    for idx, row in df_desc.iterrows():
        fecha = extract_date(row.iloc[1])
        mes = fecha.split('-')[1] if '-' in fecha else '06'
        colab = row.iloc[3]
        monto = row.iloc[4]
        if pd.notna(colab) and isinstance(colab, str) and colab.strip().upper() not in ['', 'COLABORADOR', 'NAN']:
            workers.add(colab.strip().title())
            if pd.notna(monto) and str(monto).replace('.', '').isdigit():
                key = (colab.strip().title(), mes)
                descuentos[key] = descuentos.get(key, 0) + float(str(monto).replace(',', ''))
                
    # Bebidas
    df_beb = pd.read_excel(file_path, sheet_name='BEBIDAS', header=None)
    for idx, row in df_beb.iterrows():
        for col_idx in range(len(row)):
            cell_val = str(row.iloc[col_idx]).strip().upper()
            if cell_val in [w.upper() for w in workers] and col_idx + 4 < len(row):
                bebida = str(row.iloc[col_idx+1]).strip()
                cant = row.iloc[col_idx+2]
                if pd.notna(cant) and str(cant).replace('.', '').isdigit() and bebida:
                    key = (cell_val.title(), bebida)
                    bebidas[key] = bebidas.get(key, 0) + int(float(str(cant)))
                    
    # Deuda Dwork
    df_dw = pd.read_excel(file_path, sheet_name='DEUDA DWORK', header=None)
    for idx, row in df_dw.iterrows():
        fecha = extract_date(row.iloc[4])
        monto = row.iloc[5]
        abono = row.iloc[7]
        if pd.notna(monto) and str(monto).replace('.', '').isdigit() and str(monto).strip() not in ['0', 'MONTO']:
            deuda_dwork.append({
                'fecha': fecha,
                'monto': float(str(monto).replace(',', '')),
                'abono': float(str(abono).replace(',', '')) if pd.notna(abono) and str(abono).replace('.', '').isdigit() else 0
            })

    sql = []
    sql.append("-- =============================================")
    sql.append("-- SEMILLA COMPACTA PARA DASHBOARD J2 2026")
    sql.append("-- =============================================\n")
    
    sql.append("DELETE FROM consumo_bebidas;")
    sql.append("DELETE FROM finanzas;")
    sql.append("DELETE FROM cuentas_cxc_cxp;")
    sql.append("DELETE FROM ordenes_trabajo;")
    sql.append("DELETE FROM agendas;")
    sql.append("DELETE FROM anexos_trabajador;")
    sql.append("DELETE FROM estados_pago_rrhh;")
    sql.append("DELETE FROM cotizaciones;")
    sql.append("DELETE FROM liquidaciones_sueldo;")
    sql.append("DELETE FROM trabajadores WHERE id != 99 AND nombre NOT LIKE '%JOEL%';\n")
    
    sql.append("INSERT IGNORE INTO empresas (id, nombre) VALUES (3, 'J2 Publicidad');\n")
    
    # Workers
    import subprocess
    worker_map = {}
    worker_id_start = 100
    for w in list(workers):
        worker_map[w] = worker_id_start
        # Generate a unique RUT like 101001111-1 -> 10100
        # Let's use 1000, 1001, 1002 as the first 4 digits
        prefix = str(1000 + (worker_id_start - 100))
        rut = f"{prefix}1111-1"
        password = prefix
        
        # Call PHP to hash the password
        php_path = r"C:\xampp\php\php.exe"
        php_code = f"echo password_hash('{password}', PASSWORD_DEFAULT);"
        result = subprocess.run([php_path, "-r", php_code], capture_output=True, text=True)
        pwd_hash = result.stdout.strip()
        
        sql.append(f"INSERT INTO trabajadores (id, empresa_id, nombre, rut, rol, password_hash) VALUES ({worker_id_start}, 3, '{w}', '{rut}', 'trabajador', '{pwd_hash}');")
        # Add a comment so the user knows the credentials
        sql.append(f"-- CREDECIALES PARA {w}: RUT={rut} , CLAVE={password}")
        worker_id_start += 1
        
    sql.append("\n-- Descuentos / Vales (Agrupados por Mes)")
    for (colab, mes), monto in descuentos.items():
        wid = worker_map[colab]
        sql.append(f"INSERT INTO finanzas (empresa_id, tipo, categoria, monto, descripcion, fecha, metodo_pago) VALUES (3, 'egreso', 'Adelanto Sueldo', {monto}, 'Total Vales Mes {mes} - {colab}', '2026-{mes}-15', 'efectivo');")
        
    sql.append("\n-- Consumo de Bebidas (Agrupados por Bebida)")
    for (colab, bebida), cant in bebidas.items():
        wid = worker_map[colab]
        monto = cant * 1500
        sql.append(f"INSERT INTO consumo_bebidas (empresa_id, trabajador_id, fecha, monto, descripcion) VALUES (3, {wid}, '2026-06-15', {monto}, '{cant} x {bebida} (Acumulado)');")
        
    sql.append("\n-- Deuda Dwork")
    for d in deuda_dwork:
        estado = 'pagada' if d['monto'] <= d['abono'] else 'debe'
        sql.append(f"INSERT INTO cuentas_cxc_cxp (empresa_id, tipo, tipo_entidad, rut, nombre_entidad, monto_total, monto_pagado, fecha_vencimiento, estado) VALUES (3, 'pagar', 'proveedor', '12345678-9', 'Taller mecanico Dwork', {d['monto']}, {d['abono']}, '{d['fecha']}', '{estado}');")
        
    sql.append("\n-- === DATOS DE PRUEBA PARA DASHBOARD ===")
    sql.append("INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, vehiculo_patente, problema_reportado, estado, area_asignada, total_estimado, fecha_ingreso) VALUES (3, 'Cliente A', 'ABCD12', 'Rotulación de Vehículo', 'en_produccion', 'Producción', 250000, '2026-06-25 10:00:00');")
    sql.append("INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, vehiculo_patente, problema_reportado, estado, area_asignada, total_estimado, fecha_ingreso) VALUES (3, 'Cliente B', 'XYZ987', 'Ploteo Completo', 'ingresado', 'Diseño', 500000, '2026-06-28 14:00:00');")
    sql.append("INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, vehiculo_patente, problema_reportado, estado, area_asignada, total_estimado, fecha_ingreso) VALUES (3, 'Cliente C', 'QWER56', 'Cambio de color', 'entregado', 'Ambas', 800000, '2026-06-01 09:00:00');")
    
    sql.append("INSERT INTO agendas (empresa_id, titulo, cliente, fecha, hora, tipo, estado) VALUES (3, 'Reunión de Diseño', 'Cliente B', '2026-06-30', '11:00:00', 'reunion', 'pendiente');")
    sql.append("INSERT INTO agendas (empresa_id, titulo, cliente, fecha, hora, tipo, estado) VALUES (3, 'Entrega de Vehículo', 'Cliente C', '2026-06-05', '16:00:00', 'entrega', 'completada');")
    
    sql.append("INSERT INTO cotizaciones (empresa_id, cliente, descripcion_proyecto, subtotal, iva, total) VALUES (3, 'Empresa XYZ', 'Rotulación Flota 5 autos', 1000000, 190000, 1190000);")
    
    # Financial metrics for dashboard
    sql.append("\n-- === INGRESOS SIMULADOS PARA BALANCEAR EL FLUJO DE CAJA ===")
    import random
    for month in range(1, 13):
        mes_str = f"{month:02d}"
        ingreso_mensual = random.randint(18000000, 25000000) # Entre 18M y 25M mensuales
        sql.append(f"INSERT INTO finanzas (empresa_id, tipo, categoria, monto, descripcion, fecha, metodo_pago) VALUES (3, 'ingreso', 'Venta', {ingreso_mensual}, 'Ingresos Operativos Mes {mes_str}', '2026-{mes_str}-28', 'transferencia');")
        
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql))
        
    print(sql_path)
    
except Exception as e:
    print("Error:", str(e))
