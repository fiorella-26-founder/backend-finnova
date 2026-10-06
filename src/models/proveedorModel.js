const pool = require('../config/db');

const ProveedorModel = {
    // Obtener todos los proveedores
    async obtenerTodos() {
        const [rows] = await pool.query(`
            SELECT 
                id_proveedor,
                COALESCE(ruc, '-') AS ruc,
                nombre_empresa,
                tipo_alianza,
                porcentaje_comision,
                COALESCE(contacto_nombre, '-') AS contacto_nombre,
                COALESCE(contacto_email, '-') AS contacto_email,
                COALESCE(contacto_telefono, '-') AS contacto_telefono,
                estado,
                fecha_registro
            FROM proveedores
            ORDER BY id_proveedor ASC
        `);
        return rows;
    },

    // Obtener proveedor por ID
    async obtenerPorId(id_proveedor) {
        const [rows] = await pool.query(`
            SELECT 
                id_proveedor,
                COALESCE(ruc, '-') AS ruc,
                nombre_empresa,
                tipo_alianza,
                porcentaje_comision,
                COALESCE(contacto_nombre, '-') AS contacto_nombre,
                COALESCE(contacto_email, '-') AS contacto_email,
                COALESCE(contacto_telefono, '-') AS contacto_telefono,
                estado,
                fecha_registro
            FROM proveedores
            WHERE id_proveedor = ?
        `, [id_proveedor]);
        return rows[0] || null;
    },

    // Crear proveedor
    async crear(proveedorData) {
        const {
            ruc = null,
            nombre_empresa,
            tipo_alianza,
            porcentaje_comision = 0.00,
            contacto_nombre = null,
            contacto_email = null,
            contacto_telefono = null,
            estado = 'Activo'
        } = proveedorData;

        const [result] = await pool.query(
            `INSERT INTO proveedores 
             (ruc, nombre_empresa, tipo_alianza, porcentaje_comision, contacto_nombre, contacto_email, contacto_telefono, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [ruc, nombre_empresa, tipo_alianza, porcentaje_comision, contacto_nombre, contacto_email, contacto_telefono, estado]
        );
        return result.insertId;
    },

    // Actualizar proveedor
    async actualizar(id_proveedor, proveedorData) {
        const {
            ruc,
            nombre_empresa,
            tipo_alianza,
            porcentaje_comision,
            contacto_nombre,
            contacto_email,
            contacto_telefono,
            estado
        } = proveedorData;

        const [result] = await pool.query(
            `UPDATE proveedores 
             SET ruc = ?, nombre_empresa = ?, tipo_alianza = ?, porcentaje_comision = ?, 
                 contacto_nombre = ?, contacto_email = ?, contacto_telefono = ?, estado = ?
             WHERE id_proveedor = ?`,
            [ruc, nombre_empresa, tipo_alianza, porcentaje_comision, contacto_nombre, contacto_email, contacto_telefono, estado, id_proveedor]
        );
        return result.affectedRows > 0;
    },

    // Cambiar estado (Activo / Inactivo)
    async cambiarEstado(id_proveedor, estado) {
        const [result] = await pool.query(
            'UPDATE proveedores SET estado = ? WHERE id_proveedor = ?',
            [estado, id_proveedor]
        );
        return result.affectedRows > 0;
    },

    // Eliminar proveedor físicamente y desvincular dependencias
    async eliminar(id_proveedor) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            // Desvincular de campanias y servicios
            await connection.query('UPDATE campanias SET id_proveedor = NULL WHERE id_proveedor = ?', [id_proveedor]);
            await connection.query('UPDATE servicios SET id_proveedor = NULL WHERE id_proveedor = ?', [id_proveedor]);

            const [result] = await connection.query('DELETE FROM proveedores WHERE id_proveedor = ?', [id_proveedor]);
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

module.exports = ProveedorModel;
