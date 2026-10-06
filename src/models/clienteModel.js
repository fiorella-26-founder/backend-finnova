const pool = require('../config/db');

const ClienteModel = {
    // Obtener todos los clientes
    async obtenerTodos() {
        const [rows] = await pool.query(`
            SELECT 
                c.id_cliente,
                c.id_usuario,
                c.dni,
                c.nombre_completo,
                c.correo_electronico,
                COALESCE(c.telefono, '-') AS telefono,
                COALESCE(c.direccion, '-') AS direccion,
                c.id_asesor_preferente,
                c.estado,
                c.fecha_registro,
                COALESCE(u.nombre_completo, '-') AS nombre_asesor,
                COALESCE(u.correo_electronico, '-') AS correo_asesor
            FROM clientes c
            LEFT JOIN usuarios u ON c.id_asesor_preferente = u.id_usuario
            ORDER BY c.id_cliente DESC
        `);
        return rows;
    },

    // Obtener un cliente por su ID
    async obtenerPorId(id_cliente) {
        const [rows] = await pool.query(`
            SELECT 
                c.id_cliente,
                c.id_usuario,
                c.dni,
                c.nombre_completo,
                c.correo_electronico,
                COALESCE(c.telefono, '-') AS telefono,
                COALESCE(c.direccion, '-') AS direccion,
                c.id_asesor_preferente,
                c.estado,
                c.fecha_registro,
                COALESCE(u.nombre_completo, '-') AS nombre_asesor,
                COALESCE(u.correo_electronico, '-') AS correo_asesor
            FROM clientes c
            LEFT JOIN usuarios u ON c.id_asesor_preferente = u.id_usuario
            WHERE c.id_cliente = ?
        `, [id_cliente]);
        return rows[0] || null;
    },

    // Buscar cliente por DNI
    async obtenerPorDni(dni) {
        const [rows] = await pool.query(
            'SELECT * FROM clientes WHERE dni = ?',
            [dni]
        );
        return rows[0] || null;
    },

    // Crear un nuevo cliente
    async crear(clienteData) {
        const {
            id_usuario = null,
            dni,
            nombre_completo,
            correo_electronico,
            telefono = null,
            direccion = null,
            id_asesor_preferente = null,
            estado = 'Activo'
        } = clienteData;

        const [result] = await pool.query(
            `INSERT INTO clientes (id_usuario, dni, nombre_completo, correo_electronico, telefono, direccion, id_asesor_preferente, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id_usuario, dni, nombre_completo, correo_electronico, telefono, direccion, id_asesor_preferente, estado]
        );
        return result.insertId;
    },

    // Actualizar un cliente existente
    async actualizar(id_cliente, clienteData) {
        const {
            id_usuario,
            dni,
            nombre_completo,
            correo_electronico,
            telefono,
            direccion,
            id_asesor_preferente,
            estado
        } = clienteData;

        const [result] = await pool.query(
            `UPDATE clientes 
             SET id_usuario = COALESCE(?, id_usuario),
                 dni = COALESCE(?, dni),
                 nombre_completo = COALESCE(?, nombre_completo),
                 correo_electronico = COALESCE(?, correo_electronico),
                 telefono = COALESCE(?, telefono),
                 direccion = COALESCE(?, direccion),
                 id_asesor_preferente = ?,
                 estado = COALESCE(?, estado)
             WHERE id_cliente = ?`,
            [id_usuario, dni, nombre_completo, correo_electronico, telefono, direccion, id_asesor_preferente, estado, id_cliente]
        );
        return result.affectedRows > 0;
    },

    // Asignar asesor a un cliente
    async asignarAsesor(id_cliente, id_asesor_preferente) {
        const [result] = await pool.query(
            'UPDATE clientes SET id_asesor_preferente = ? WHERE id_cliente = ?',
            [id_asesor_preferente, id_cliente]
        );
        return result.affectedRows > 0;
    },

    // Cambiar estado a inactivo (soft delete) o activo
    async cambiarEstado(id_cliente, estado) {
        const [result] = await pool.query(
            'UPDATE clientes SET estado = ? WHERE id_cliente = ?',
            [estado, id_cliente]
        );
        return result.affectedRows > 0;
    },

    // Eliminar cliente físicamente y en cascada sus dependencias
    async eliminar(id_cliente) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Obtener todas las solicitudes del cliente para borrar citas vinculadas
            const [solicitudes] = await connection.query(
                'SELECT id_solicitud FROM solicitudes WHERE id_cliente = ?',
                [id_cliente]
            );
            const idsSolicitudes = solicitudes.map(s => s.id_solicitud);

            // 2. Eliminar citas vinculadas al cliente o a sus solicitudes
            if (idsSolicitudes.length > 0) {
                await connection.query(
                    'DELETE FROM citas WHERE id_cliente = ? OR id_solicitud IN (?)',
                    [id_cliente, idsSolicitudes]
                );
            } else {
                await connection.query(
                    'DELETE FROM citas WHERE id_cliente = ?',
                    [id_cliente]
                );
            }

            // 3. Eliminar solicitudes del cliente
            await connection.query(
                'DELETE FROM solicitudes WHERE id_cliente = ?',
                [id_cliente]
            );

            // 4. Eliminar el registro del cliente
            const [result] = await connection.query(
                'DELETE FROM clientes WHERE id_cliente = ?',
                [id_cliente]
            );

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

module.exports = ClienteModel;
