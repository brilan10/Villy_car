@echo off
"C:\xampp\mysql\bin\mysql.exe" -u root < "C:\Users\yomiy\Documents\Proyectos\Villy Car\src\backend\base de datos\schema.sql"
"C:\xampp\mysql\bin\mysql.exe" -u root villy_car_db < "C:\Users\yomiy\Documents\Proyectos\Villy Car\src\backend\base de datos\seed_massive.sql"
echo Done
