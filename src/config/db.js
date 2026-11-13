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
            const bcrypt = require('bcryptjs');
            await connection.query('ALTER TABLE solicitudes MODIFY COLUMN estado_atencion VARCHAR(60) DEFAULT "Nueva"');
            await connection.query('ALTER TABLE solicitudes MODIFY COLUMN estado_pago VARCHAR(60) DEFAULT "Pendiente"');
            await connection.query('ALTER TABLE solicitudes MODIFY COLUMN id_solicitud VARCHAR(50)');
            await connection.query(`
                UPDATE clientes c
                JOIN usuarios u ON (c.correo_electronico = u.correo_electronico OR c.dni = u.dni)
                SET c.id_usuario = u.id_usuario
                WHERE (c.id_usuario IS NULL OR c.id_usuario = 0)
            `);
            await connection.query(`
                UPDATE clientes c
                JOIN solicitudes s ON c.id_cliente = s.id_cliente
                SET c.id_asesor_preferente = s.id_asesor_asignado
                WHERE (c.id_asesor_preferente IS NULL OR c.id_asesor_preferente = 0)
                  AND s.id_asesor_asignado IS NOT NULL AND s.id_asesor_asignado > 0
            `);
            // Desbloquear usuarios bloqueados por intentos fallidos de prueba
            await connection.query('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE bloqueado_hasta IS NOT NULL OR intentos_fallidos > 0');

            // Asegurar rol y usuario Soporte TI (Semana 14)
            await connection.query(`
                INSERT IGNORE INTO roles (id_rol, nombre_rol, descripcion)
                VALUES (4, 'Soporte TI', 'Mesa de Operaciones TI, Gestión de Incidentes L1/L2 y SLAs')
            `);
            const hashSoporte = bcrypt.hashSync('soporte123', 10);
            await connection.query(`
                INSERT INTO usuarios (dni, nombre_completo, correo_electronico, telefono, contrasena_hash, id_rol, estado)
                VALUES ('72183920', 'Ing. Carlos Mendoza', 'soporte.ti@finnova.pe', '981234567', '${hashSoporte}', 4, 'Activo')
                ON DUPLICATE KEY UPDATE id_rol = 4, estado = 'Activo'
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
