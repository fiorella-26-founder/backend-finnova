const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_finnova',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com'))) ? { rejectUnauthorized: false } : undefined
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('¡Conexión exitosa a la base de datos!');

        // Migración automática no destructiva para asegurar capacidad suficiente en columnas de estados
        try {
            await connection.query('ALTER TABLE solicitudes MODIFY COLUMN estado_atencion VARCHAR(60) DEFAULT "Nueva"');
            await connection.query('ALTER TABLE solicitudes MODIFY COLUMN estado_pago VARCHAR(60) DEFAULT "Pendiente"');
            await connection.query('ALTER TABLE solicitudes MODIFY COLUMN id_solicitud VARCHAR(50)');
            await connection.query(`
                UPDATE clientes c
                JOIN usuarios u ON (c.correo_electronico = u.correo_electronico OR c.dni = u.dni)
                SET c.id_usuario = u.id_usuario
                WHERE (c.id_usuario IS NULL OR c.id_usuario = 0)
            `);
        } catch (migErr) {
            console.warn('ℹ️ [DB] Nota sobre migración de columnas:', migErr.message);
        }

        connection.release();
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error.message);
    }
}

testConnection();

module.exports = pool;
