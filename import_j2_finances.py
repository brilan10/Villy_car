import pandas as pd
import mysql.connector
import numpy as np

# Configuración de base de datos
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '',
    'database': 'villy_car_db'
}

FILE_PATH = r'c:\Users\yomiy\Documents\Proyectos\Villy Car\Analizar, porpuestas\LIBRO MAYOR J2 PUBLICIDAD 2026 (2).xlsm'
EMPRESA_ID = 1 # J2 Publicidad

def clean_val(val):
    if pd.isna(val):
        return None
    return str(val).strip()

def clean_float(val):
    if pd.isna(val):
        return 0.0
    try:
        return float(val)
    except:
        return 0.0

def main():
    print("Conectando a la base de datos...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Primero limpiamos los datos antiguos de finanzas de J2 Publicidad para no duplicar
    print("Limpiando datos financieros anteriores de J2 Publicidad...")
    cursor.execute("DELETE FROM finanzas WHERE empresa_id = %s", (EMPRESA_ID,))
    
    print("Leyendo Excel...")
    df = pd.read_excel(FILE_PATH, sheet_name='Movimientos', skiprows=5)
    
    ingresos = 0
    egresos = 0

    print("Procesando Ingresos...")
    for index, row in df.iterrows():
        fecha = row.get('FECHA')
        monto = clean_float(row.get('MONTO'))
        if pd.notna(fecha) and monto > 0:
            if isinstance(fecha, pd.Timestamp):
                fecha_str = fecha.strftime('%Y-%m-%d')
            else:
                fecha_str = str(fecha).split(' ')[0]
                
            detalle = clean_val(row.get('DETALLE')) or 'Venta'
            forma_pago = clean_val(row.get('FORMA DE PAGO ')) or 'Transferencia'
            
            cursor.execute("""
                INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (EMPRESA_ID, fecha_str, 'ingreso', 'Ventas del Día', detalle, monto, forma_pago))
            ingresos += 1

    print("Procesando Egresos...")
    for index, row in df.iterrows():
        fecha = row.get('FECHA.1')
        monto = clean_float(row.get('IMPORTE.1'))
        if pd.notna(fecha) and monto > 0:
            if isinstance(fecha, pd.Timestamp):
                fecha_str = fecha.strftime('%Y-%m-%d')
            else:
                fecha_str = str(fecha).split(' ')[0]
                
            categoria = clean_val(row.get('CATEGORÍA')) or 'Otros Gastos'
            detalle = clean_val(row.get('DETALLE.1')) or 'Gasto'
            forma_pago = clean_val(row.get('FORMA DE PAGO .1')) or 'Transferencia'
            
            cursor.execute("""
                INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (EMPRESA_ID, fecha_str, 'egreso', categoria, detalle, monto, forma_pago))
            egresos += 1

    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"¡Proceso finalizado! Se insertaron {ingresos} ingresos y {egresos} egresos para J2 Publicidad.")

if __name__ == '__main__':
    main()
