import pandas as pd
import datetime
import re
import subprocess

file_path = r'c:\Users\yomiy\Documents\Proyectos\Villy Car\Analizar, porpuestas\LIBRO MAYOR J2 PUBLICIDAD 2026 (2).xlsm'
sql_path = 'Semilla_Dashboard_Real.sql'
php_path = r"C:\xampp\php\php.exe"

def extract_date(val):
    if isinstance(val, datetime.datetime):
        return val.strftime('%Y-%m-%d')
    s = str(val).split(' ')[0]
    if re.match(r'\d{4}-\d{2}-\d{2}', s):
        return s
    return "2026-06-01"

def clean_str(val):
    if pd.isna(val) or val == 'nan':
        return ""
    return str(val).strip().replace("'", "''")

def get_float(val):
    if pd.isna(val) or val == 'nan':
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).replace('.', '').replace(',', '.')
    try:
        return float(s)
    except:
        return 0.0

try:
    xl = pd.ExcelFile(file_path)
    
    workers = set()
    worker_salaries = {}
    
    # 1. First Pass: Collect Workers from Descuentos and PLANILLA
    df_desc = xl.parse('Descuentos colaboradores')
    for idx, row in df_desc.iterrows():
        colab = row.iloc[3]
        if pd.notna(colab) and isinstance(colab, str) and colab.strip().upper() not in ['', 'COLABORADOR', 'NAN']:
            workers.add(colab.strip().title())
            
    df_plan = xl.parse('PLANILLA', header=None)
    for idx, row in df_plan.iterrows():
        colab = str(row.iloc[1]).strip().title()
        base = row.iloc[2]
        if pd.notna(colab) and colab.upper() not in ['', 'COLABORADOR', 'NAN', 'DETALLE DESCUENTOS']:
            if pd.notna(base) and str(base).replace('.', '').isdigit():
                workers.add(colab)
                worker_salaries[colab] = float(str(base).replace(',', ''))
            
    sql = []
    sql.append("-- =============================================")
    sql.append("-- SEMILLA DE DATOS REALES J2 PUBLICIDAD 2026")
    sql.append("-- =============================================\n")
    
    # Clean DB
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
    
    # 2. Insert Workers
    worker_map = {'Joel': 99}
    worker_id_start = 100
    
    # Random realistic-looking RUT bases
    base_ruts = [20111, 19222, 18333, 21444, 22555, 17666, 16777, 23888, 15999, 24111, 25222, 26333, 14444, 13555]
    
    for i, w in enumerate(list(workers)):
        if w.upper() == 'JOEL':
            continue # Skip Joel, he is admin ID 99
            
        worker_map[w] = worker_id_start
        rut_prefix = base_ruts[i % len(base_ruts)]
        rut = f"{rut_prefix}111-{i%9 + 1}"
        password = str(rut_prefix)
        
        php_code = f"echo password_hash('{password}', PASSWORD_DEFAULT);"
        result = subprocess.run([php_path, "-r", php_code], capture_output=True, text=True)
        pwd_hash = result.stdout.strip()
        
        sueldo = worker_salaries.get(w, 750000.0)
        cargo = 'Instalador' if i % 2 == 0 else 'Operador'
        
        sql.append(f"INSERT INTO trabajadores (id, empresa_id, nombre, rut, rol, password_hash, sueldo_base, cargo) VALUES ({worker_id_start}, 3, '{w}', '{rut}', 'trabajador', '{pwd_hash}', {sueldo}, '{cargo}');")
        sql.append(f"-- CREDECIALES PARA {w}: RUT={rut} , CLAVE={password}")
        worker_id_start += 1
        
    sql.append("\n-- === INGRESOS Y EGRESOS REALES (HOJA MOVIMIENTOS) ===")
    # 3. Parse Movimientos
    df_mov = xl.parse('Movimientos', header=None)
    for idx, row in df_mov.iterrows():
        # Start at row 6 (index 5)
        if idx < 5:
            continue
            
        # Ingresos (cols 1 to 8)
        i_fecha = row.iloc[2]
        i_forma_pago = row.iloc[3]
        i_detalle = row.iloc[4]
        i_monto = row.iloc[6]
        
        if pd.notna(i_fecha) and str(i_fecha).strip() != 'nan' and get_float(i_monto) > 0:
            fecha_clean = extract_date(i_fecha)
            monto = get_float(i_monto)
            detalle = clean_str(i_detalle)
            forma = clean_str(i_forma_pago).lower()
            if forma not in ['efectivo', 'transferencia', 'tarjeta']:
                forma = 'transferencia'
            sql.append(f"INSERT INTO finanzas (empresa_id, tipo, categoria, monto, descripcion, fecha, metodo_pago) VALUES (3, 'ingreso', 'Venta', {monto}, '{detalle}', '{fecha_clean}', '{forma}');")

        # Egresos (cols 10 to 18)
        e_fecha = row.iloc[11]
        e_categoria = row.iloc[12]
        e_detalle = row.iloc[13]
        e_monto = row.iloc[17]
        e_forma_pago = row.iloc[18]
        
        if pd.notna(e_fecha) and str(e_fecha).strip() != 'nan' and get_float(e_monto) > 0:
            fecha_clean = extract_date(e_fecha)
            monto = get_float(e_monto)
            cat = clean_str(e_categoria)
            detalle = clean_str(e_detalle)
            forma = clean_str(e_forma_pago).lower()
            if forma not in ['efectivo', 'transferencia', 'tarjeta']:
                forma = 'efectivo'
            sql.append(f"INSERT INTO finanzas (empresa_id, tipo, categoria, monto, descripcion, fecha, metodo_pago) VALUES (3, 'egreso', '{cat}', {monto}, '{detalle}', '{fecha_clean}', '{forma}');")

    sql.append("\n-- === VALES Y DESCUENTOS (HOJA DESCUENTOS) ===")
    for idx, row in df_desc.iterrows():
        fecha = row.iloc[1]
        concepto = row.iloc[2]
        colab = row.iloc[3]
        monto = row.iloc[4]
        if pd.notna(colab) and isinstance(colab, str) and colab.strip().upper() not in ['', 'COLABORADOR', 'NAN']:
            if pd.notna(monto) and str(monto).replace('.', '').isdigit():
                m_float = float(str(monto).replace(',', ''))
                if m_float > 0:
                    fecha_clean = extract_date(fecha)
                    concepto_clean = clean_str(concepto)
                    colab_clean = colab.strip().title()
                    sql.append(f"INSERT INTO finanzas (empresa_id, tipo, categoria, monto, descripcion, fecha, metodo_pago) VALUES (3, 'egreso', 'Adelanto Sueldo', {m_float}, 'Vale: {concepto_clean} - {colab_clean}', '{fecha_clean}', 'efectivo');")

    sql.append("\n-- === DEUDA DWORK ===")
    df_dw = xl.parse('DEUDA DWORK', header=None)
    for idx, row in df_dw.iterrows():
        fecha = row.iloc[4]
        monto = row.iloc[5]
        concepto = row.iloc[6]
        abono = row.iloc[7]
        monto_float = get_float(monto)
        if monto_float > 0 and str(monto).strip().upper() != 'MONTO':
            abono_float = get_float(abono)
            fecha_clean = extract_date(fecha)
            estado = 'pagada' if monto_float <= abono_float else 'debe'
            concepto_clean = clean_str(concepto)
            sql.append(f"INSERT INTO cuentas_cxc_cxp (empresa_id, tipo, tipo_entidad, rut, nombre_entidad, monto_total, monto_pagado, fecha_vencimiento, estado) VALUES (3, 'pagar', 'proveedor', '12345678-9', 'Dwork: {concepto_clean}', {monto_float}, {abono_float}, '{fecha_clean}', '{estado}');")

    sql.append("\n-- === BEBIDAS ===")
    df_beb = xl.parse('BEBIDAS', header=None)
    for idx, row in df_beb.iterrows():
        for col_idx in range(len(row)):
            cell_val = str(row.iloc[col_idx]).strip().upper()
            if cell_val in [w.upper() for w in workers] and col_idx + 4 < len(row):
                bebida = str(row.iloc[col_idx+1]).strip()
                cant = row.iloc[col_idx+2]
                if pd.notna(cant) and str(cant).replace('.', '').isdigit() and bebida:
                    wid = worker_map[cell_val.title()]
                    cant_int = int(float(str(cant)))
                    monto = cant_int * 1500
                    bebida_clean = clean_str(bebida)
                    sql.append(f"INSERT INTO consumo_bebidas (empresa_id, trabajador_id, fecha, monto, descripcion) VALUES (3, {wid}, '2026-06-15', {monto}, '{cant_int} x {bebida_clean}');")
                    
    sql.append("\n-- === LIQUIDACIONES DE SUELDO (HOJA PLANILLA) ===")
    df_plan = xl.parse('PLANILLA', header=None)
    for idx, row in df_plan.iterrows():
        colab = str(row.iloc[1]).strip().upper()
        base = row.iloc[2]
        descuentos = row.iloc[3]
        a_pagar = row.iloc[4]
        
        # Check if it's a valid row with employee data (like CARLOS, 900000, 34000, 866000)
        if colab in [w.upper() for w in workers] and pd.notna(base) and str(base).replace('.', '').isdigit():
            wid = worker_map[colab.title()]
            base_float = float(str(base).replace(',', ''))
            desc_float = float(str(descuentos).replace(',', '')) if pd.notna(descuentos) and str(descuentos).replace('.', '').isdigit() else 0.0
            pago_float = float(str(a_pagar).replace(',', '')) if pd.notna(a_pagar) and str(a_pagar).replace('.', '').isdigit() else base_float - desc_float
            
            # Use '2026-04' as period based on the dates in the Excel
            sql.append(f"INSERT INTO liquidaciones_sueldo (empresa_id, trabajador_id, mes_periodo, sueldo_base, total_imponible, anticipos, sueldo_liquido) VALUES (3, {wid}, '2026-04', {base_float}, {base_float}, {desc_float}, {pago_float});")

    sql.append("\n-- === COMISIONES (HOJA COMISIONES) -> COTIZACIONES ===")
    df_com = xl.parse('COMISIONES', header=None)
    for idx, row in df_com.iterrows():
        # February data (columns 4 to 11)
        factura_feb = str(row.iloc[4]).strip()
        cliente_feb = str(row.iloc[5]).strip()
        neto_feb = get_float(row.iloc[6])
        iva_feb = get_float(row.iloc[7])
        total_feb = get_float(row.iloc[8])
        if factura_feb.isdigit() and neto_feb > 0:
            cliente_clean = clean_str(cliente_feb)
            sql.append(f"INSERT INTO cotizaciones (empresa_id, cliente, descripcion_proyecto, subtotal, iva, total) VALUES (3, '{cliente_clean}', 'Factura {factura_feb}', {neto_feb}, {iva_feb}, {total_feb});")
            
        # March data (columns 13 to 20)
        if len(row) >= 20:
            factura_mar = str(row.iloc[13]).strip()
            cliente_mar = str(row.iloc[14]).strip()
            neto_mar = get_float(row.iloc[15])
            iva_mar = get_float(row.iloc[16])
            total_mar = get_float(row.iloc[17])
            if factura_mar.isdigit() and neto_mar > 0:
                cliente_clean = clean_str(cliente_mar)
                sql.append(f"INSERT INTO cotizaciones (empresa_id, cliente, descripcion_proyecto, subtotal, iva, total) VALUES (3, '{cliente_clean}', 'Factura {factura_mar}', {neto_mar}, {iva_mar}, {total_mar});")

    # Generate some dummy missing data just for the charts to work completely if necessary
    # Based on the user: "si te falta informacion haz que calsen para que muestre todo"
    sql.append("\n-- === DATOS ADICIONALES DE PRUEBA (AGENDAS / ORDENES / ESTADOS PAGO RRHH) ===")
    
    for wid in worker_map.values():
        sql.append(f"INSERT INTO estados_pago_rrhh (empresa_id, trabajador_id, fecha, monto_total, descripcion_servicios) VALUES (3, {wid}, '2026-04-30', 450000, 'Pago honorarios de abril');")
        sql.append(f"INSERT INTO estados_pago_rrhh (empresa_id, trabajador_id, fecha, monto_total, descripcion_servicios) VALUES (3, {wid}, '2026-05-31', 480000, 'Pago honorarios de mayo');")
        sql.append(f"INSERT INTO estados_pago_rrhh (empresa_id, trabajador_id, fecha, monto_total, descripcion_servicios) VALUES (3, {wid}, '2026-06-28', 500000, 'Pago honorarios de junio');")
        
    sql.append("INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, vehiculo_patente, problema_reportado, estado, area_asignada, total_estimado, fecha_ingreso) VALUES (3, 'Cliente A', 'ABCD12', 'Rotulación de Vehículo', 'en_produccion', 'Producción', 250000, '2026-06-25 10:00:00');")
    sql.append("INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, vehiculo_patente, problema_reportado, estado, area_asignada, total_estimado, fecha_ingreso) VALUES (3, 'Cliente B', 'XYZ987', 'Ploteo Completo', 'ingresado', 'Diseño', 500000, '2026-06-28 14:00:00');")
    sql.append("INSERT INTO ordenes_trabajo (empresa_id, cliente_nombre, vehiculo_patente, problema_reportado, estado, area_asignada, total_estimado, fecha_ingreso) VALUES (3, 'Cliente C', 'QWER56', 'Cambio de color', 'entregado', 'Ambas', 800000, '2026-06-01 09:00:00');")
    sql.append("INSERT INTO agendas (empresa_id, titulo, cliente, fecha, hora, tipo, estado) VALUES (3, 'Reunión de Diseño', 'Cliente B', '2026-06-30', '11:00:00', 'reunion', 'pendiente');")
    sql.append("INSERT INTO agendas (empresa_id, titulo, cliente, fecha, hora, tipo, estado) VALUES (3, 'Entrega de Vehículo', 'Cliente C', '2026-06-05', '16:00:00', 'entrega', 'completada');")

    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(sql))
        
    print(f"Generated {sql_path} with {len(sql)} lines successfully!")
    
except Exception as e:
    import traceback
    traceback.print_exc()
