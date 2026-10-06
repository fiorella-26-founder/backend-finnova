const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const UsuarioModel = {
    // Buscar usuario por correo electrónico (incluyendo nombre de rol y estado de bloqueo)
    async buscarPorEmail(correo_electronico) {
        const [rows] = await pool.query(`
            SELECT u.*, COALESCE(r.nombre_rol, '-') AS nombre_rol
            FROM usuarios u
            LEFT JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.correo_electronico = ?
        `, [correo_electronico]);
        return rows[0] || null;
    },

    // Buscar usuario por ID
    async buscarPorId(id_usuario) {
        const [rows] = await pool.query(`
            SELECT u.id_usuario, u.dni, u.nombre_completo, u.correo_electronico, 
                   COALESCE(u.telefono, '-') AS telefono, u.id_rol, 
                   COALESCE(r.nombre_rol, '-') AS nombre_rol, u.estado, u.fecha_registro
            FROM usuarios u
            LEFT JOIN roles r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = ?
        `, [id_usuario]);
        return rows[0] || null;
    },

    // Obtener lista completa de usuarios
    async obtenerTodos() {
        const [rows] = await pool.query(`
            SELECT u.id_usuario, u.dni, u.nombre_completo, u.correo_electronico, 
                   COALESCE(u.telefono, '-') AS telefono, u.id_rol, 
                   COALESCE(r.nombre_rol, '-') AS nombre_rol, u.estado, u.fecha_registro
            FROM usuarios u
            LEFT JOIN roles r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario DESC
        `);
        return rows;
    },

    // Crear un nuevo usuario con hash de contraseña
    async crear(usuarioData) {
        const {
            dni,
            nombre_completo,
            correo_electronico,
            telefono = null,
            contrasena = 'password123',
            id_rol = 2,
            estado = 'Activo'
        } = usuarioData;

        const salt = bcrypt.genSaltSync(10);
        const contrasena_hash = bcrypt.hashSync(contrasena, salt);

        const [result] = await pool.query(
            `INSERT INTO usuarios (dni, nombre_completo, correo_electronico, telefono, contrasena_hash, id_rol, estado)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [dni, nombre_completo, correo_electronico, telefono, contrasena_hash, id_rol, estado]
        );
        return result.insertId;
    },

    // Actualizar usuario
    async actualizar(id_usuario, usuarioData) {
        const {
            dni,
            nombre_completo,
            correo_electronico,
            telefono,
            id_rol,
            estado,
            contrasena
        } = usuarioData;

        if (contrasena && contrasena.trim()) {
            const salt = bcrypt.genSaltSync(10);
            const contrasena_hash = bcrypt.hashSync(contrasena.trim(), salt);
            const [result] = await pool.query(
                `UPDATE usuarios 
                 SET dni = ?, nombre_completo = ?, correo_electronico = ?, telefono = ?, id_rol = ?, estado = ?, contrasena_hash = ?
                 WHERE id_usuario = ?`,
                [dni, nombre_completo, correo_electronico, telefono, id_rol, estado, contrasena_hash, id_usuario]
            );
            return result.affectedRows > 0;
        } else {
            const [result] = await pool.query(
                `UPDATE usuarios 
                 SET dni = ?, nombre_completo = ?, correo_electronico = ?, telefono = ?, id_rol = ?, estado = ?
                 WHERE id_usuario = ?`,
                [dni, nombre_completo, correo_electronico, telefono, id_rol, estado, id_usuario]
            );
            return result.affectedRows > 0;
        }
    },

    // Cambiar estado de usuario
    async cambiarEstado(id_usuario, estado) {
        const [result] = await pool.query(
            'UPDATE usuarios SET estado = ? WHERE id_usuario = ?',
            [estado, id_usuario]
        );
        return result.affectedRows > 0;
    },

    // Eliminar usuario físicamente desvinculando referencias previas
    async eliminar(id_usuario) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            // Desvincular de clientes
            await connection.query('UPDATE clientes SET id_asesor_preferente = NULL WHERE id_asesor_preferente = ?', [id_usuario]);
            await connection.query('UPDATE clientes SET id_usuario = NULL WHERE id_usuario = ?', [id_usuario]);
            // Desvincular de solicitudes
            await connection.query('UPDATE solicitudes SET id_asesor_asignado = NULL WHERE id_asesor_asignado = ?', [id_usuario]);
            // Desvincular de citas
            await connection.query('UPDATE citas SET id_asesor = NULL WHERE id_asesor = ?', [id_usuario]).catch(() => {});
            // Desvincular de campañas
            await connection.query('UPDATE campanias SET id_usuario_creador = NULL WHERE id_usuario_creador = ?', [id_usuario]);
            // Desvincular de logs
            await connection.query('UPDATE logs_auditoria_seguridad SET id_usuario = NULL WHERE id_usuario = ?', [id_usuario]);

            const [result] = await connection.query('DELETE FROM usuarios WHERE id_usuario = ?', [id_usuario]);
            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // Registrar intento fallido de contraseña y bloquear cuenta si excede el umbral (5 intentos)
    async registrarIntentoFallido(id_usuario, intentosActuales = 0) {
        try {
            const nuevosIntentos = intentosActuales + 1;
            if (nuevosIntentos >= 5) {
                await pool.query(
                    `UPDATE usuarios 
                     SET intentos_fallidos = ?, bloqueado_hasta = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
                     WHERE id_usuario = ?`,
                    [nuevosIntentos, id_usuario]
                );
                return { bloqueado: true, intentos: nuevosIntentos };
            } else {
                await pool.query(
                    'UPDATE usuarios SET intentos_fallidos = ? WHERE id_usuario = ?',
                    [nuevosIntentos, id_usuario]
                );
                return { bloqueado: false, intentos: nuevosIntentos };
            }
        } catch (error) {
            console.warn('Advertencia al registrar intento fallido:', error.message);
            return { bloqueado: false, intentos: intentosActuales + 1 };
        }
    },

    // Restablecer contador de intentos fallidos al iniciar sesión con éxito
    async restablecerIntentosFallidos(id_usuario) {
        try {
            await pool.query(
                'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id_usuario = ?',
                [id_usuario]
            );
        } catch (error) {
            console.warn('Advertencia al restablecer intentos:', error.message);
        }
    }
};

module.exports = UsuarioModel;