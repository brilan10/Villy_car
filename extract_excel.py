import pandas as pd
import json

file_path = r'c:\Users\yomiy\Documents\Proyectos\Villy Car\analizar mejora\LIBRO MAYOR J2 PUBLICIDAD 2026 (1).xlsm'
xl = pd.ExcelFile(file_path)

info = {}
for sheet in ['Movimientos', 'BEBIDAS', 'Descuentos colaboradores', 'DEUDA DWORK']:
    try:
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=10)
        df = df.astype(str).fillna('')
        info[sheet] = df.to_dict('records')
    except Exception as e:
        info[sheet] = str(e)

with open('excel_sample.json', 'w', encoding='utf-8') as f:
    json.dump(info, f, indent=2, ensure_ascii=False)
