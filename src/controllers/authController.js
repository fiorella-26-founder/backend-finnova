const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuarioModel');
const cryptoUtil = require('../utils/cryptoUtil');
const auditLogger = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'finnova_secret_jwt_token_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const authController = {
    // POST /api/auth/login
    async login(req, res) {
        const ip_origen = req.ip || req.socket.remoteAddress || '127.0.0.1';
        try {
            const { correo_electronico, email, contrasena, password } = req.body;
            const userEmail = correo_electronico || email;
            const userPassword = contrasena || password;

            if (!userEmail || !userPassword) {
                const errorMsg = 'El correo electrónico y la contraseña son obligatorios';
                return res.status(400).json({ error: errorMsg, mensaje: errorMsg });
            }

            const rawPassword = cryptoUtil.desencriptarContrasena(userPassword);
            const usuario = await UsuarioModel.buscarPorEmail(userEmail.trim().toLowerCase());

            if (!usuario) {
                await auditLogger.registrarEvento({
                    tipo_evento: 'LOGIN_FALLIDO',
                    correo_intentado: userEmail,
                    ip_origen,
                    detalles: 'Intento de inicio de sesión con correo no registrado'
                });
                const errorMsg = 'Credenciales inválidas: correo no registrado';
                return res.status(401).json({ error: errorMsg, mensaje: errorMsg });
            }

            if (usuario.estado !== 'Activo') {
                await auditLogger.registrarEvento({
                    tipo_evento: 'ACCESO_DENEGADO',
                    id_usuario: usuario.id_usuario,
                    correo_intentado: userEmail,
                    ip_origen,
                    detalles: `Usuario inactivo (${usuario.estado})`
                });
                const errorMsg = 'Su cuenta se encuentra inactiva o bloqueada por seguridad. Contacte con el administrador.';
                return res.status(403).json({ error: errorMsg, mensaje: errorMsg });
            }

            if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
                const minutosRestantes = Math.ceil((new Date(usuario.bloqueado_hasta) - new Date()) / 60000);
                const errorMsg = `Cuenta bloqueada temporalmente por múltiples intentos fallidos. Intente nuevamente en ${minutosRestantes} minutos.`;
                return res.status(403).json({ error: errorMsg, mensaje: errorMsg });
            }

            const esContrasenaValida = bcrypt.compareSync(rawPassword, usuario.contrasena_hash);

            if (!esContrasenaValida) {
                const resultadoBloqueo = await UsuarioModel.registrarIntentoFallido(usuario.id_usuario, usuario.intentos_fallidos || 0);

                if (resultadoBloqueo.bloqueado) {
                    await auditLogger.registrarEvento({
                        tipo_evento: 'BLOQUEO_CUENTA',
                        id_usuario: usuario.id_usuario,
                        correo_intentado: userEmail,
                        ip_origen,
                        detalles: 'Cuenta bloqueada por 15 minutos tras 5 intentos fallidos consecutivos'
                    });
                    const errorMsg = 'Ha excedido el número máximo de 5 intentos. Su cuenta ha sido bloqueada temporalmente por 15 minutos.';
                    return res.status(403).json({ error: errorMsg, mensaje: errorMsg });
                }

                await auditLogger.registrarEvento({
                    tipo_evento: 'LOGIN_FALLIDO',
                    id_usuario: usuario.id_usuario,
                    correo_intentado: userEmail,
                    ip_origen,
                    detalles: `Contraseña incorrecta. Intento ${resultadoBloqueo.intentos} de 5.`
                });

                const errorMsg = `Credenciales inválidas: contraseña incorrecta. Intentos restantes: ${5 - resultadoBloqueo.intentos}`;
                return res.status(401).json({ error: errorMsg, mensaje: errorMsg });
            }

            await UsuarioModel.restablecerIntentosFallidos(usuario.id_usuario);

            const payload = {
                id_usuario: usuario.id_usuario,
                dni: usuario.dni,
                nombre_completo: usuario.nombre_completo,
                correo_electronico: usuario.correo_electronico,
                telefono: usuario.telefono,
                rol: usuario.nombre_rol,
                id_rol: usuario.id_rol
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            await auditLogger.registrarEvento({
                tipo_evento: 'LOGIN_EXITOSO',
                id_usuario: usuario.id_usuario,
                correo_intentado: userEmail,
                ip_origen,
                detalles: `Inicio de sesión exitoso con rol ${usuario.nombre_rol}`
            });

            res.json({
                mensaje: 'Inicio de sesión exitoso',
                token,
                usuario: {
                    id_usuario: usuario.id_usuario,
                    dni: usuario.dni,
                    nombre_completo: usuario.nombre_completo,
                    correo_electronico: usuario.correo_electronico,
                    telefono: usuario.telefono,
                    rol: usuario.nombre_rol,
                    id_rol: usuario.id_rol,
                    estado: usuario.estado
                }
            });
        } catch (error) {
            console.error('Error en login:', error);
            const errorMsg = 'Error interno del servidor durante la autenticación';
            res.status(500).json({ error: errorMsg, mensaje: errorMsg });
        }
    },

    // POST /api/auth/register
    async register(req, res) {
        const ip_origen = req.ip || req.socket.remoteAddress || '127.0.0.1';
        try {
            const { dni, nombre_completo, correo_electronico, telefono, contrasena, id_rol = 3 } = req.body;

            if (!dni || !nombre_completo || !correo_electronico || !contrasena) {
                const errorMsg = 'DNI, Nombre Completo, Correo y Contraseña son campos obligatorios';
                return res.status(400).json({ error: errorMsg, mensaje: errorMsg });
            }

            if (!/^\d{8,15}$/.test(dni.trim())) {
                const errorMsg = 'El formato de DNI es inválido (debe contener entre 8 y 15 dígitos numéricos)';
                return res.status(400).json({ error: errorMsg, mensaje: errorMsg });
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo_electronico.trim())) {
                const errorMsg = 'El formato de correo electrónico es inválido';
                return res.status(400).json({ error: errorMsg, mensaje: errorMsg });
            }

            const rawPassword = cryptoUtil.desencriptarContrasena(contrasena);

            if (rawPassword.length < 6) {
                const errorMsg = 'La contraseña debe tener un mínimo de 6 caracteres';
                return res.status(400).json({ error: errorMsg, mensaje: errorMsg });
            }

            const existe = await UsuarioModel.buscarPorEmail(correo_electronico);
            if (existe) {
                const errorMsg = 'El correo electrónico ya se encuentra registrado';
                return res.status(400).json({ error: errorMsg, mensaje: errorMsg });
            }

            const id_usuario = await UsuarioModel.crear({
                dni: dni.trim(),
                nombre_completo: nombre_completo.trim(),
                correo_electronico: correo_electronico.trim().toLowerCase(),
                telefono: telefono ? telefono.trim() : null,
                contrasena: rawPassword,
                id_rol,
                estado: 'Activo'
            });

            await auditLogger.registrarEvento({
                tipo_evento: 'REGISTRO_USUARIO',
                id_usuario,
                correo_intentado: correo_electronico,
                ip_origen,
                detalles: `Nuevo usuario registrado con ID ${id_usuario}`
            });

            res.status(201).json({
                mensaje: 'Usuario registrado exitosamente',
                id_usuario
            });
        } catch (error) {
            console.error('Error en registro:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                const errorMsg = 'El DNI o correo ingresado ya existe en el sistema';
                return res.status(400).json({ error: errorMsg, mensaje: errorMsg });
            }
            const errorMsg = 'Error interno al registrar el usuario';
            res.status(500).json({ error: errorMsg, mensaje: errorMsg });
        }
    },

    // PATCH /api/auth/cambiar-password (Protegido)
    async cambiarPassword(req, res) {
        const ip_origen = req.ip || req.socket.remoteAddress || '127.0.0.1';
        try {
            const id_usuario = req.usuario.id_usuario;
            const { contrasena_actual, nueva_contrasena, currentPassword, newPassword } = req.body;

            const actual = contrasena_actual || currentPassword;
            const nueva = nueva_contrasena || newPassword;

            if (!actual || !nueva) {
                return res.status(400).json({ 
                    error: 'La contraseña actual y la nueva contraseña son requeridas', 
                    mensaje: 'La contraseña actual y la nueva contraseña son requeridas' 
                });
            }

            const rawActual = cryptoUtil.desencriptarContrasena(actual);
            const rawNueva = cryptoUtil.desencriptarContrasena(nueva);

            if (rawNueva.length < 6) {
                return res.status(400).json({ 
                    error: 'La nueva contraseña debe tener al menos 6 caracteres', 
                    mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' 
                });
            }

            const [rows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id_usuario]);
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado', mensaje: 'Usuario no encontrado' });
            }

            const usuario = rows[0];
            const coincide = bcrypt.compareSync(rawActual, usuario.contrasena_hash);
            if (!coincide) {
                return res.status(400).json({ 
                    error: 'La contraseña actual no coincide', 
                    mensaje: 'La contraseña actual que ingresaste es incorrecta.' 
                });
            }

            const salt = bcrypt.genSaltSync(10);
            const nueva_hash = bcrypt.hashSync(rawNueva, salt);

            await pool.query('UPDATE usuarios SET contrasena_hash = ? WHERE id_usuario = ?', [nueva_hash, id_usuario]);

            await auditLogger.registrarEvento({
                tipo_evento: 'CAMBIO_PASSWORD',
                id_usuario,
                correo_intentado: usuario.correo_electronico,
                ip_origen,
                detalles: 'Contraseña de usuario actualizada exitosamente'
            });

            res.json({ mensaje: 'Contraseña actualizada exitosamente' });
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            res.status(500).json({ error: 'Error al cambiar la contraseña', mensaje: 'Error al cambiar la contraseña' });
        }
    },

    // GET /api/auth/perfil (Protegido por token)
    async perfil(req, res) {
        try {
            const id = req.usuario.id_usuario;
            const usuario = await UsuarioModel.buscarPorId(id);
            if (!usuario) {
                const errorMsg = 'Usuario no encontrado';
                return res.status(404).json({ error: errorMsg, mensaje: errorMsg });
            }
            res.json({
                usuario: {
                    id_usuario: usuario.id_usuario,
                    dni: usuario.dni,
                    nombre_completo: usuario.nombre_completo,
                    correo_electronico: usuario.correo_electronico,
                    telefono: usuario.telefono,
                    rol: usuario.nombre_rol,
                    id_rol: usuario.id_rol,
                    estado: usuario.estado
                }
            });
        } catch (error) {
            console.error('Error al obtener perfil:', error);
            const errorMsg = 'Error al consultar el perfil de usuario';
            res.status(500).json({ error: errorMsg, mensaje: errorMsg });
        }
    },

    // GET /api/auth/usuarios (Para administración de usuarios)
    async getUsuarios(req, res) {
        try {
            const usuarios = await UsuarioModel.obtenerTodos();
            res.json(usuarios);
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            const errorMsg = 'Error al obtener la lista de usuarios';
            res.status(500).json({ error: errorMsg, mensaje: errorMsg });
        }
    },

    // POST /api/auth/logout
    async logout(req, res) {
        const ip_origen = req.ip || req.socket.remoteAddress || '127.0.0.1';
        try {
            const id_usuario = req.usuario ? req.usuario.id_usuario : null;
            await auditLogger.registrarEvento({
                tipo_evento: 'LOGOUT',
                id_usuario,
                ip_origen,
                detalles: 'Cierre de sesión registrado'
            });
            res.json({ mensaje: 'Sesión cerrada exitosamente en el servidor' });
        } catch (error) {
            console.error('Error en logout:', error);
            const errorMsg = 'Error al cerrar sesión';
            res.status(500).json({ error: errorMsg, mensaje: errorMsg });
        }
    }
};

module.exports = authController;
