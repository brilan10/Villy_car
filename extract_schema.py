import re
import sys

def get_table(content, table_name):
    m = re.search(r'CREATE TABLE `' + table_name + r'` \((.*?)\) ENGINE=InnoDB.*?;', content, re.DOTALL)
    if m:
        return m.group(0)
    return None

with open(r'c:\Users\yomiy\Documents\Proyectos\Villy Car\villy_car_db (1).sql', 'r', encoding='utf-8') as f:
    local_db = f.read()

tables_to_update = [
    'agendas',
    'anexos_trabajador',
    'cotizaciones',
    'estados_pago_rrhh',
    'ordenes_trabajo',
    'detalles_orden_trabajo'
]

output_sql = []
for t in tables_to_update:
    output_sql.append(f"DROP TABLE IF EXISTS {t};")
    create_stmt = get_table(local_db, t)
    if create_stmt:
        output_sql.append(create_stmt)
    else:
        print(f"Warning: {t} not found in local db!")

with open(r'c:\Users\yomiy\Documents\Proyectos\Villy Car\schema_to_inject.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_sql))

print("Schema extraction complete!")
