import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function main() {
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'villy_car_db'
        });

        console.log('Connected to database villy_car_db.');

        const passwordHash = await bcrypt.hash('admin', 10);
        
        try {
            await connection.execute(`INSERT IGNORE INTO empresas (id, nombre) VALUES (1, 'Villy Car')`);
        } catch(e) {
            console.log('Empresa insert failed or already exists. Ignoring.', e.message);
        }
        
        const ruts = ['123', 'admin'];
        for (const rut of ruts) {
            try {
                const [rows] = await connection.execute(`SELECT id FROM trabajadores WHERE rut = ?`, [rut]);
                if (rows.length > 0) {
                    await connection.execute(`UPDATE trabajadores SET password_hash = ?, rol = 'admin', activo = 1 WHERE rut = ?`, [passwordHash, rut]);
                    console.log(`Updated user with RUT ${rut} -> password is now "admin"`);
                } else {
                    await connection.execute(`INSERT INTO trabajadores (empresa_id, nombre, rut, rol, password_hash, activo) VALUES (1, 'Administrador', ?, 'admin', ?, 1)`, [rut, passwordHash]);
                    console.log(`Inserted new admin user with RUT ${rut} -> password is "admin"`);
                }
            } catch(e) {
                console.error(`Error for RUT ${rut}:`, e.message);
            }
        }

        await connection.end();
        console.log('Todo listo! Ahora puedes ingresar con rut "123" y clave "admin".');
    } catch (e) {
        console.error('Error conectando a la base de datos:', e.message);
    }
}

main();
