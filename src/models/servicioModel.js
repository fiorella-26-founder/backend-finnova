const pool = require('../config/db');

const ServicioModel = {
    // Obtener solo servicios activos públicos para Landing
    async obtenerActivosPublicos() {
        const [rows] = await pool.query(`
            SELECT 
                s.id_servicio,
                s.titulo,
                s.descripcion,
                s.categoria,
                s.precio_tarifa,
                s.url_imagen,
                s.id_proveedor,
                s.estado,
                COALESCE(p.nombre_empresa, '-') AS nombre_proveedor
            FROM servicios s
            LEFT JOIN proveedores p ON s.id_proveedor = p.id_proveedor
            WHERE s.estado = 'Activo'
            ORDER BY s.id_servicio ASC
        `);
        return rows;
    },

    // Obtener todos los servicios
    async obtenerTodos() {
        const [rows] = await pool.query(`
            SELECT 
                s.id_servicio,
                s.titulo,
                s.descripcion,
                s.categoria,
                s.precio_tarifa,
                s.url_imagen,
                s.id_proveedor,
                s.estado,
                s.fecha_creacion,
                COALESCE(p.nombre_empresa, '-') AS nombre_proveedor
            FROM servicios s
            LEFT JOIN proveedores p ON s.id_proveedor = p.id_proveedor
            ORDER BY s.id_servicio ASC
        `);
        return rows;
    },

    // Obtener servicio por ID
    async obtenerPorId(id_servicio) {
        const [rows] = await pool.query(`
            SELECT 
                s.id_servicio,
                s.titulo,
                s.descripcion,
                s.categoria,
                s.precio_tarifa,
                s.url_imagen,
                s.id_proveedor,
                s.estado,
                s.fecha_creacion,
                COALESCE(p.nombre_empresa, '-') AS nombre_proveedor
            FROM servicios s
            LEFT JOIN proveedores p ON s.id_proveedor = p.id_proveedor
            WHERE s.id_servicio = ?
        `, [id_servicio]);
        return rows[0] || null;
    },

    // Crear un nuevo servicio
    async crear(servicioData) {
        const {
            titulo,
            descripcion,
            categoria,
            precio_tarifa,
            url_imagen = null,
            id_proveedor = null,
            estado = 'Activo'
        } = servicioData;

        const [result] = await pool.query(
            `INSERT INTO servicios (titulo, descripcion, categoria, precio_tarifa, url_imagen, id_proveedor, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [titulo, descripcion, categoria, precio_tarifa, url_imagen, id_proveedor, estado]
        );
        return result.insertId;
    },

    // Actualizar servicio
    async actualizar(id_servicio, servicioData) {
        const {
            titulo,
            descripcion,
            categoria,
            precio_tarifa,
            url_imagen,
            id_proveedor,
            estado
        } = servicioData;

        const [result] = await pool.query(
            `UPDATE servicios 
             SET titulo = ?, descripcion = ?, categoria = ?, precio_tarifa = ?, 
                 url_imagen = ?, id_proveedor = ?, estado = ?
             WHERE id_servicio = ?`,
            [titulo, descripcion, categoria, precio_tarifa, url_imagen, id_proveedor, estado, id_servicio]
        );
        return result.affectedRows > 0;
    },

    // Cambiar estado
    async cambiarEstado(id_servicio, estado) {
        const [result] = await pool.query(
            'UPDATE servicios SET estado = ? WHERE id_servicio = ?',
            [estado, id_servicio]
        );
        return result.affectedRows > 0;
    },

    // Eliminar servicio físicamente y en cascada sus dependencias
    async eliminar(id_servicio) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Desvincular de campañas
            await connection.query('UPDATE campanias SET id_servicio = NULL WHERE id_servicio = ?', [id_servicio]);

            // Obtener solicitudes vinculadas para borrar citas vinculadas
            const [solicitudes] = await connection.query('SELECT id_solicitud FROM solicitudes WHERE id_servicio = ?', [id_servicio]);
            if (solicitudes.length > 0) {
                const idsSol = solicitudes.map(s => s.id_solicitud);
                await connection.query('DELETE FROM citas WHERE id_solicitud IN (?)', [idsSol]);
                await connection.query('DELETE FROM solicitudes WHERE id_servicio = ?', [id_servicio]);
            }

            const [result] = await connection.query('DELETE FROM servicios WHERE id_servicio = ?', [id_servicio]);
            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = ServicioModel;
