import re

def extract_tables(file_path):
    tables = {}
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # regex to find CREATE TABLE blocks
    matches = re.finditer(r'CREATE TABLE `(\w+)` \((.*?)\) ENGINE=InnoDB', content, re.DOTALL)
    for m in matches:
        table_name = m.group(1)
        # clean up the table definition for comparison (remove AUTO_INCREMENT values, etc)
        definition = m.group(2).strip()
        # remove trailing commas
        definition = re.sub(r',\s*$', '', definition)
        tables[table_name] = definition
    return tables

local_db = r'c:\Users\yomiy\Documents\Proyectos\Villy Car\villy_car_db (1).sql'
host_db = r'c:\Users\yomiy\Documents\Proyectos\Villy Car\villycar_base_de_datos.sql'

local_tables = extract_tables(local_db)
host_tables = extract_tables(host_db)

print("\n--- ORDENES TRABAJO IN LOCAL ---")
if 'ordenes_trabajo' in local_tables:
    print(local_tables['ordenes_trabajo'])
            # Let's see what's different
            local_cols = [x.strip() for x in local_tables[t].split('\n')]
            host_cols = [x.strip() for x in host_tables[t].split('\n')]
            print(f"  Local columns: {len(local_cols)}")
            print(f"  Host columns: {len(host_cols)}")
            for lc in local_cols:
                if lc not in host_cols:
                    print(f"  + {lc}")
