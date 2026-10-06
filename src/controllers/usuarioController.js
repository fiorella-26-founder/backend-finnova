const UsuarioModel = require('../models/usuarioModel');
const cryptoUtil = require('../utils/cryptoUtil');
const auditLogger = require('../utils/auditLogger');

const usuarioController = {
    // GET /api/usuarios - Obtener lista de todos los usuarios
    async getUsuarios(req, res) {
        try {
            const usuarios = await UsuarioModel.obtenerTodos();
            res.json(usuarios);
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            res.status(500).json({ error: 'Error al obtener la lista de usuarios', mensaje: 'Error al obtener la lista de usuarios' });
        }
    },

    // GET /api/usuarios/:id - Obtener un usuario por ID
    async getUsuarioById(req, res) {
        try {
            const { id } = req.params;
            const usuario = await UsuarioModel.buscarPorId(id);
            if (!usuario) {
                return res.status(404).json({ error: 'Usuario no encontrado', mensaje: 'Usuario no encontrado' });
            }
            res.json(usuario);
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            res.status(500).json({ error: 'Error al consultar usuario', mensaje: 'Error al consultar usuario' });
        }
    },

    // POST /api/usuarios - Crear nuevo usuario
    async createUsuario(req, res) {
        const ip_origen = req.ip || req.socket.remoteAddress || '127.0.0.1';
        try {
            const { dni, nombre_completo, correo_electronico, telefono, contrasena, id_rol = 2, estado = 'Activo' } = req.body;

            if (!dni || !nombre_completo || !correo_electronico) {
                return res.status(400).json({ 
                    error: 'DNI, Nombre Completo y Correo Electrónico son obligatorios',
                    mensaje: 'DNI, Nombre Completo y Correo Electrónico son obligatorios' 
                });
            }

            const existe = await UsuarioModel.buscarPorEmail(correo_electronico.trim());
            if (existe) {
                return res.status(400).json({ 
                    error: 'El correo electrónico ya se encuentra registrado en el sistema',
                    mensaje: 'El correo electrónico ya se encuentra registrado en el sistema' 
                });
            }

            // Desencriptar contraseña si viene cifrada desde el frontend o usar por defecto
            let rawPassword = 'password123';
            if (contrasena && contrasena.trim()) {
                rawPassword = cryptoUtil.desencriptarContrasena(contrasena.trim());
            }

            // Mapear id_rol si vino como nombre (ej. 'Administrador' -> 1, 'Asesor' -> 2, 'Cliente' -> 3)
            let rolId = Number(id_rol);
            if (isNaN(rolId)) {
                if (id_rol === 'Administrador') rolId = 1;
                else if (id_rol === 'Asesor') rolId = 2;
                else if (id_rol === 'Cliente') rolId = 3;
                else rolId = 2;
            }

            const id_usuario = await UsuarioModel.crear({
                dni: dni.trim(),
                nombre_completo: nombre_completo.trim(),
                correo_electronico: correo_electronico.trim().toLowerCase(),
                telefono: telefono ? telefono.trim() : null,
                contrasena: rawPassword,
                id_rol: rolId,
                estado
            });

            await auditLogger.registrarEvento({
                tipo_evento: 'USUARIO_CREADO',
                id_usuario,
                correo_intentado: correo_electronico,
                ip_origen,
                detalles: `Usuario creado con rol ID ${rolId}`
            });

            res.status(201).json({
                mensaje: 'Usuario registrado exitosamente',
                id_usuario
            });
        } catch (error) {
            console.error('Error al crear usuario:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    error: 'El DNI o Correo ingresado ya existe en la base de datos',
                    mensaje: 'El DNI o Correo ingresado ya existe en la base de datos' 
                });
            }
            res.status(500).json({ error: 'Error al registrar usuario en la base de datos', mensaje: 'Error al registrar usuario en la base de datos' });
        }
    },

    // PUT /api/usuarios/:id - Actualizar usuario
    async updateUsuario(req, res) {
        try {
            const { id } = req.params;
            const { dni, nombre_completo, correo_electronico, telefono, id_rol, estado, contrasena } = req.body;

            const usuarioExistente = await UsuarioModel.buscarPorId(id);
            if (!usuarioExistente) {
                return res.status(404).json({ error: 'Usuario no encontrado para actualizar', mensaje: 'Usuario no encontrado para actualizar' });
            }

            let rolId = id_rol !== undefined ? Number(id_rol) : usuarioExistente.id_rol;
            if (isNaN(rolId)) {
                if (id_rol === 'Administrador') rolId = 1;
                else if (id_rol === 'Asesor') rolId = 2;
                else if (id_rol === 'Cliente') rolId = 3;
                else rolId = usuarioExistente.id_rol;
            }

            let rawPassword = null;
            if (contrasena && contrasena.trim()) {
                rawPassword = cryptoUtil.desencriptarContrasena(contrasena.trim());
            }

            await UsuarioModel.actualizar(id, {
                dni: dni ? dni.trim() : usuarioExistente.dni,
                nombre_completo: nombre_completo ? nombre_completo.trim() : usuarioExistente.nombre_completo,
                correo_electronico: correo_electronico ? correo_electronico.trim().toLowerCase() : usuarioExistente.correo_electronico,
                telefono: telefono !== undefined ? (telefono ? telefono.trim() : null) : usuarioExistente.telefono,
                id_rol: rolId,
                estado: estado || usuarioExistente.estado,
                contrasena: rawPassword
            });

            res.json({
                mensaje: 'Usuario actualizado exitosamente'
            });
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            res.status(500).json({ error: 'Error al actualizar usuario', mensaje: 'Error al actualizar usuario' });
        }
    },

    // PATCH /api/usuarios/:id/estado - Cambiar estado
    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            if (!estado || !['Activo', 'Inactivo'].includes(estado)) {
                return res.status(400).json({ error: 'Estado inválido. Debe ser Activo o Inactivo', mensaje: 'Estado inválido. Debe ser Activo o Inactivo' });
            }

            await UsuarioModel.cambiarEstado(id, estado);
            res.json({ mensaje: `Estado de usuario actualizado a ${estado}` });
        } catch (error) {
            console.error('Error al cambiar estado de usuario:', error);
            res.status(500).json({ error: 'Error al cambiar estado de usuario', mensaje: 'Error al cambiar estado de usuario' });
        }
    },

    // DELETE /api/usuarios/:id - Eliminar usuario
    async deleteUsuario(req, res) {
        try {
            const { id } = req.params;
            const usuarioId = parseInt(id, 10);
            if (isNaN(usuarioId)) {
                return res.status(400).json({ error: 'ID de usuario inválido', mensaje: 'ID de usuario inválido' });
            }

            const eliminado = await UsuarioModel.eliminar(usuarioId);
            if (eliminado) {
                return res.json({ mensaje: 'Usuario eliminado correctamente' });
            }
            res.status(404).json({ error: 'Usuario no encontrado', mensaje: 'Usuario no encontrado' });
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            res.status(500).json({ error: 'Error al eliminar usuario', mensaje: 'Error al eliminar usuario' });
        }
    }
};

module.exports = usuarioController;