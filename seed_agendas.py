import random
from datetime import datetime, timedelta
import os

companies = [1, 2, 3, 4]
clients = ["Constructora Los Andes", "Boutique Paris", "Gimnasio Fit", "Carlos Gonzalez", "Maria Perez", "Juan Morales", "Andres Silva", "Sebastian Rios", "Fernanda Castro", "Transportes Villy", "Empresa A", "Empresa B", "Juanito Perez", "Rodrigo Soto", "Camila Vallejo", "Sofia Vergara"]
workers = ["Felipe Neira", "Andrea Gomez", "Juan Perez", "Matias Fernandez", "Diego Lopez", "Pedro Soto", "Carlos Ruiz", "Juanito", "Rodolfo", "Marcelo"]

# We want events for June and July 2026
start_date = datetime(2026, 6, 1)
end_date = datetime(2026, 7, 31)
delta_days = (end_date - start_date).days

sql_statements = ["SET NAMES utf8mb4;"]
sql_statements.append("USE villy_car_db;")

for _ in range(80):
    company_id = random.choice(companies)
    client = random.choice(clients)
    worker = random.choice(workers)
    random_days = random.randint(0, delta_days)
    date = start_date + timedelta(days=random_days)
    date_str = date.strftime("%Y-%m-%d")
    
    hour = random.randint(8, 17)
    minute = random.choice([0, 30])
    time_str = f"{hour:02d}:{minute:02d}:00"
    
    title = f"Reunión / Trabajo {random.randint(100, 999)}"
    
    types = ["Reunión", "Terreno", "Mecánica", "Instalación", "Diseño", "Despacho", "Estética"]
    ev_type = random.choice(types)
    
    monto = random.choice([0, 0, 15000, 35000, 50000, 120000, 250000])
    details = f"Detalles para el trabajo programado en {date_str} con {client}."
    
    statuses = ["Agendado", "Confirmado", "En Producción", "Finalizado", "Cancelado"]
    if date < datetime(2026, 6, 26):
        status = random.choices(statuses, weights=[10, 10, 10, 60, 10])[0]
    else:
        status = random.choices(statuses, weights=[40, 40, 10, 5, 5])[0]
        
    sql = f"INSERT INTO agendas (empresa_id, titulo, cliente, fecha, hora, tipo, monto, detalles, estado, trabajador) VALUES ({company_id}, '{title}', '{client}', '{date_str}', '{time_str}', '{ev_type}', {monto}, '{details}', '{status}', '{worker}');"
    sql_statements.append(sql)

with open("seed_agendas_random.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_statements))

print("Running SQL script...")
# Use absolute path for mysql in XAMPP
os.system(r"C:\xampp\mysql\bin\mysql.exe -u root villy_car_db < seed_agendas_random.sql")
print("Done seeding agendas for June and July 2026!")
