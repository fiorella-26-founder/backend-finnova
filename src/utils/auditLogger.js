const pool = require('../config/db');

const auditLogger = {
    /**
     * Registrar evento de seguridad en la base de datos
     * @param {Object} data
     * @param {string} data.tipo_evento - 'LOGIN_EXITOSO', 'LOGIN_FALLIDO', 'CUENTA_BLOQUEADA', 'ACCESO_DENEGADO', 'LOGOUT', etc.
     * @param {number|null} data.id_usuario - ID de usuario si está autenticado
     * @param {string|null} data.correo_intentado - Correo usado en el intento
     * @param {string} data.ip_origen - IP del cliente
     * @param {string|null} data.detalles - Descripción detallada o metadata
     */
    async registrarEvento({ tipo_evento, id_usuario = null, correo_intentado = null, ip_origen = '127.0.0.1', detalles = null }) {
        try {
            await pool.query(`
                INSERT INTO logs_auditoria_seguridad (tipo_evento, id_usuario, correo_intentado, ip_origen, detalles)
                VALUES (?, ?, ?, ?, ?)
            `, [tipo_evento, id_usuario, correo_intentado, ip_origen, detalles]);
        } catch (error) {
            // Si la tabla aún no ha sido creada o falla, registramos en consola sin tumbar la petición del usuario
            console.warn(`[AUDIT_LOG_FALLBACK] ${new Date().toISOString()} | ${tipo_evento} | IP: ${ip_origen} | User/Email: ${correo_intentado || id_usuario} | ${detalles || ''}`);
        }
    }
};

module.exports = auditLogger;
