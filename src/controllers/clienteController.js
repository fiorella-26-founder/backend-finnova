const ClienteModel = require('../models/clienteModel');
const UsuarioModel = require('../models/usuarioModel');
const EmailService = require('../utils/emailService');
const cryptoUtil = require('../utils/cryptoUtil');

function sanitizarTexto(texto) {
    if (typeof texto !== 'string') return texto;
    return texto.trim();
}

const clienteController = {
    // GET /api/clientes
    async getClientes(req, res) {
        try {
            const clientes = await ClienteModel.obtenerTodos();
            res.json(clientes);
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            res.status(500).json({ error: 'Error interno del servidor', mensaje: 'Error al obtener clientes' });
        }
    },

    // GET /api/clientes/:id
    async getClienteById(req, res) {
        try {
            const { id } = req.params;
            const clienteId = parseInt(id, 10);
            if (isNaN(clienteId)) {
                return res.status(400).json({ error: 'ID inválido', mensaje: 'ID inválido' });
            }

            const cliente = await ClienteModel.obtenerPorId(clienteId);
            if (!cliente) {
                return res.status(404).json({ error: 'Cliente no encontrado', mensaje: 'Cliente no encontrado' });
            }
            res.json(cliente);
        } catch (error) {
            console.error('Error al obtener cliente:', error);
            res.status(500).json({ error: 'Error interno del servidor', mensaje: 'Error al obtener cliente' });
        }
    },

    // POST /api/clientes
    async createCliente(req, res) {
        try {
            const { dni, nombre_completo, correo_electronico, telefono, direccion, id_asesor_preferente, estado } = req.body;

            if (!dni || !nombre_completo || !correo_electronico) {
                return res.status(400).json({ error: 'DNI, Nombre Completo y Correo Electrónico son obligatorios', mensaje: 'DNI, Nombre Completo y Correo Electrónico son obligatorios' });
            }

            if (!/^\d{8,15}$/.test(String(dni).trim())) {
                return res.status(400).json({ error: 'El DNI debe contener entre 8 y 15 dígitos numéricos', mensaje: 'El DNI debe contener entre 8 y 15 dígitos numéricos' });
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo_electronico).trim())) {
                return res.status(400).json({ error: 'El formato del correo electrónico es inválido', mensaje: 'El formato del correo electrónico es inválido' });
            }

            const cleanEmail = String(correo_electronico).trim().toLowerCase();
            const cleanDni = sanitizarTexto(dni);
            const cleanName = sanitizarTexto(nombre_completo);
            const cleanPhone = telefono ? sanitizarTexto(telefono) : null;

            const clienteData = {
                dni: cleanDni,
                nombre_completo: cleanName,
                correo_electronico: cleanEmail,
                telefono: cleanPhone,
                direccion: direccion ? sanitizarTexto(direccion) : null,
                id_asesor_preferente: id_asesor_preferente ? parseInt(id_asesor_preferente, 10) : null,
                estado: estado || 'Activo'
            };

            const insertId = await ClienteModel.crear(clienteData);

            // Auto-crear usuario con rol Cliente (id_rol: 3) y enviar credenciales si no existe
            let usuario = await UsuarioModel.buscarPorEmail(cleanEmail);
            if (!usuario) {
                const tempPassword = cryptoUtil.generarPasswordAleatoria(8);
                const id_usuario = await UsuarioModel.crear({
                    dni: cleanDni,
                    nombre_completo: cleanName,
                    correo_electronico: cleanEmail,
                    telefono: cleanPhone,
                    contrasena: tempPassword,
                    id_rol: 3,
                    estado: 'Activo'
                });

                await ClienteModel.actualizar(insertId, { id_usuario });

                await EmailService.enviarCredencialesCliente({
                    nombre: cleanName,
                    email: cleanEmail,
                    password: tempPassword,
                    dni: cleanDni
                });
            }

            res.status(201).json({
                mensaje: 'Cliente creado exitosamente',
                id_cliente: insertId
            });
        } catch (error) {
            console.error('Error al crear cliente:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'El DNI ingresado ya está registrado en el sistema', mensaje: 'El DNI ingresado ya está registrado en el sistema' });
            }
            res.status(500).json({ error: 'Error al registrar el cliente', mensaje: 'Error al registrar el cliente' });
        }
    },

    // PUT /api/clientes/:id
    async updateCliente(req, res) {
        try {
            const { id } = req.params;
            const clienteId = parseInt(id, 10);
            if (isNaN(clienteId)) {
                return res.status(400).json({ error: 'ID inválido', mensaje: 'ID inválido' });
            }

            const { dni, nombre_completo, correo_electronico, telefono, direccion, id_asesor_preferente, estado } = req.body;

            const clienteData = {
                dni: dni ? sanitizarTexto(dni) : undefined,
                nombre_completo: nombre_completo ? sanitizarTexto(nombre_completo) : undefined,
                correo_electronico: correo_electronico ? String(correo_electronico).trim().toLowerCase() : undefined,
                telefono: telefono !== undefined ? (telefono ? sanitizarTexto(telefono) : null) : undefined,
                direccion: direccion !== undefined ? (direccion ? sanitizarTexto(direccion) : null) : undefined,
                id_asesor_preferente: id_asesor_preferente !== undefined ? (id_asesor_preferente ? parseInt(id_asesor_preferente, 10) : null) : undefined,
                estado: estado || 'Activo'
            };

            const actualizado = await ClienteModel.actualizar(clienteId, clienteData);
            if (!actualizado) {
                return res.status(404).json({ error: 'Cliente no encontrado o sin cambios', mensaje: 'Cliente no encontrado o sin cambios' });
            }
            res.json({ mensaje: 'Cliente actualizado correctamente' });
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            res.status(500).json({ error: 'Error al actualizar el cliente', mensaje: 'Error al actualizar el cliente' });
        }
    },

    // PATCH /api/clientes/:id/asesor
    async asignarAsesor(req, res) {
        try {
            const { id } = req.params;
            const clienteId = parseInt(id, 10);
            const { id_asesor } = req.body;

            if (isNaN(clienteId)) {
                return res.status(400).json({ error: 'ID de cliente inválido', mensaje: 'ID de cliente inválido' });
            }

            const advisorId = id_asesor ? parseInt(id_asesor, 10) : null;
            const actualizado = await ClienteModel.asignarAsesor(clienteId, advisorId);
            if (!actualizado) {
                return res.status(404).json({ error: 'Cliente no encontrado', mensaje: 'Cliente no encontrado' });
            }

            res.json({ mensaje: 'Asesor asignado correctamente al cliente' });
        } catch (error) {
            console.error('Error al asignar asesor a cliente:', error);
            res.status(500).json({ error: 'Error al asignar asesor', mensaje: 'Error al asignar asesor' });
        }
    },

    // PATCH /api/clientes/:id/estado
    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const clienteId = parseInt(id, 10);
            const { estado } = req.body;

            if (isNaN(clienteId) || !['Activo', 'Inactivo'].includes(estado)) {
                return res.status(400).json({ error: 'Estado inválido', mensaje: 'Estado inválido' });
            }

            const actualizado = await ClienteModel.cambiarEstado(clienteId, estado);
            if (!actualizado) {
                return res.status(404).json({ error: 'Cliente no encontrado', mensaje: 'Cliente no encontrado' });
            }
            res.json({ mensaje: `Estado del cliente actualizado a ${estado}` });
        } catch (error) {
            console.error('Error al cambiar estado de cliente:', error);
            res.status(500).json({ error: 'Error al cambiar estado del cliente', mensaje: 'Error al cambiar estado del cliente' });
        }
    },

    // DELETE /api/clientes/:id
    async deleteCliente(req, res) {
        try {
            const { id } = req.params;
            const clienteId = parseInt(id, 10);
            if (isNaN(clienteId)) {
                return res.status(400).json({ error: 'ID inválido', mensaje: 'ID inválido' });
            }

            const eliminado = await ClienteModel.eliminar(clienteId);
            if (eliminado) {
                return res.json({ mensaje: 'Cliente eliminado correctamente' });
            }

            res.status(404).json({ error: 'Cliente no encontrado', mensaje: 'Cliente no encontrado' });
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            res.status(500).json({ error: 'Error al eliminar el cliente', mensaje: 'Error al eliminar el cliente' });
        }
    }
};

module.exports = clienteController;
