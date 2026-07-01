import pandas as pd
import numpy as np
import datetime

FILE_PATH = r'c:\Users\yomiy\Documents\Proyectos\Villy Car\Analizar, porpuestas\LIBRO MAYOR J2 PUBLICIDAD 2026 (2).xlsm'
EMPRESA_ID = 1 # J2 Publicidad
OUTPUT_SQL = r'c:\Users\yomiy\Documents\Proyectos\Villy Car\ingresos_egresos_j2_hosting.sql'

def clean_val(val):
    if pd.isna(val):
        return None
    v_str = str(val).strip().replace("'", "\\'")
    return v_str

def clean_float(val):
    if pd.isna(val):
        return 0.0
    try:
        return float(val)
    except:
        return 0.0

def main():
    print("Leyendo Excel para generar SQL...")
    df = pd.read_excel(FILE_PATH, sheet_name='Movimientos', skiprows=5)
    
    with open(OUTPUT_SQL, 'w', encoding='utf-8') as f:
        f.write("-- ==========================================================\n")
        f.write("-- SCRIPT DE INSERCIÓN PARA HOSTINGER (J2 PUBLICIDAD)\n")
        f.write("-- ==========================================================\n\n")
        f.write("DELETE FROM finanzas WHERE empresa_id = 1;\n\n")
        
        # INGRESOS
        f.write("-- INGRESOS\n")
        ingresos_count = 0
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
                
                query = f"INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES ({EMPRESA_ID}, '{fecha_str}', 'ingreso', 'Ventas del Día', '{detalle}', {monto}, '{forma_pago}');\n"
                f.write(query)
                ingresos_count += 1
                
        # EGRESOS
        f.write("\n-- EGRESOS\n")
        egresos_count = 0
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
                
                query = f"INSERT INTO finanzas (empresa_id, fecha, tipo, categoria, descripcion, monto, metodo_pago) VALUES ({EMPRESA_ID}, '{fecha_str}', 'egreso', '{categoria}', '{detalle}', {monto}, '{forma_pago}');\n"
                f.write(query)
                egresos_count += 1

    print(f"¡Archivo SQL generado! Contiene {ingresos_count} ingresos y {egresos_count} egresos.")

if __name__ == '__main__':
    main()
