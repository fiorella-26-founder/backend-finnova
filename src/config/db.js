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
        connection.release();
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error.message);
    }
}

testConnection();

module.exports = pool;
