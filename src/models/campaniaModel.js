const pool = require('../config/db');

const CampaniaModel = {
    // Obtener todas las campañas
    async obtenerTodas() {
        const [rows] = await pool.query(`
            SELECT 
                cmp.id_campana,
                cmp.titulo,
                cmp.mensaje_promocional,
                COALESCE(cmp.publico_objetivo, 'General') AS publico_objetivo,
                COALESCE(cmp.categoria, 'Promoción') AS categoria,
                cmp.url_imagen,
                cmp.estado,
                cmp.id_servicio,
                cmp.id_proveedor,
                cmp.fecha_programada,
                cmp.fecha_creacion,
                cmp.id_usuario_creador,
                COALESCE(s.titulo, '-') AS titulo_servicio,
                COALESCE(p.nombre_empresa, '-') AS nombre_proveedor,
                COALESCE(u.nombre_completo, '-') AS nombre_creador
            FROM campanias cmp
            LEFT JOIN servicios s ON cmp.id_servicio = s.id_servicio
            LEFT JOIN proveedores p ON cmp.id_proveedor = p.id_proveedor
            LEFT JOIN usuarios u ON cmp.id_usuario_creador = u.id_usuario
            ORDER BY cmp.id_campana DESC
        `);
        return rows;
    },

    // Obtener campaña por ID
    async obtenerPorId(id_campana) {
        const [rows] = await pool.query(`
            SELECT 
                cmp.id_campana,
                cmp.titulo,
                cmp.mensaje_promocional,
                COALESCE(cmp.publico_objetivo, 'General') AS publico_objetivo,
                COALESCE(cmp.categoria, 'Promoción') AS categoria,
                cmp.url_imagen,
                cmp.estado,
                cmp.id_servicio,
                cmp.id_proveedor,
                cmp.fecha_programada,
                cmp.fecha_creacion,
                cmp.id_usuario_creador,
                COALESCE(s.titulo, '-') AS titulo_servicio,
                COALESCE(p.nombre_empresa, '-') AS nombre_proveedor,
                COALESCE(u.nombre_completo, '-') AS nombre_creador
            FROM campanias cmp
            LEFT JOIN servicios s ON cmp.id_servicio = s.id_servicio
            LEFT JOIN proveedores p ON cmp.id_proveedor = p.id_proveedor
            LEFT JOIN usuarios u ON cmp.id_usuario_creador = u.id_usuario
            WHERE cmp.id_campana = ?
        `, [id_campana]);
        return rows[0] || null;
    },

    // Crear campaña
    async crear(campaniaData) {
        const {
            titulo,
            mensaje_promocional,
            publico_objetivo = 'General',
            categoria = 'Promoción',
            url_imagen = null,
            estado = 'Activa',
            id_servicio = null,
            id_proveedor = null,
            fecha_programada = null,
            id_usuario_creador = null
        } = campaniaData;

        const [result] = await pool.query(
            `INSERT INTO campanias 
             (titulo, mensaje_promocional, publico_objetivo, categoria, url_imagen, estado, id_servicio, id_proveedor, fecha_programada, id_usuario_creador)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [titulo, mensaje_promocional, publico_objetivo, categoria, url_imagen, estado, id_servicio, id_proveedor, fecha_programada, id_usuario_creador]
        );
        return result.insertId;
    },

    // Actualizar campaña
    async actualizar(id_campana, campaniaData) {
        const {
            titulo,
            mensaje_promocional,
            publico_objetivo,
            categoria,
            url_imagen,
            estado,
            id_servicio,
            id_proveedor,
            fecha_programada
        } = campaniaData;

        const [result] = await pool.query(
            `UPDATE campanias 
             SET titulo = COALESCE(?, titulo),
                 mensaje_promocional = COALESCE(?, mensaje_promocional),
                 publico_objetivo = COALESCE(?, publico_objetivo),
                 categoria = COALESCE(?, categoria),
                 url_imagen = COALESCE(?, url_imagen),
                 estado = COALESCE(?, estado),
                 id_servicio = ?,
                 id_proveedor = ?,
                 fecha_programada = COALESCE(?, fecha_programada)
             WHERE id_campana = ?`,
            [titulo, mensaje_promocional, publico_objetivo, categoria, url_imagen, estado, id_servicio, id_proveedor, fecha_programada, id_campana]
        );
        return result.affectedRows > 0;
    },

    // Cambiar estado de la campaña ('Activa' / 'Inactiva')
    async cambiarEstado(id_campana, estado) {
        const [result] = await pool.query(
            'UPDATE campanias SET estado = ? WHERE id_campana = ?',
            [estado, id_campana]
        );
        return result.affectedRows > 0;
    },

    // Eliminar campaña
    async eliminar(id_campana) {
        const [result] = await pool.query(
            'DELETE FROM campanias WHERE id_campana = ?',
            [id_campana]
        );
        return result.affectedRows > 0;
    }
};

module.exports = CampaniaModel;
