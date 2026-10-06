const ProveedorModel = require('../models/proveedorModel');

function sanitizarTexto(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '').trim();
}

const proveedorController = {
    // GET /api/proveedores
    async getProveedores(req, res) {
        try {
            const proveedores = await ProveedorModel.obtenerTodos();
            res.json(proveedores);
        } catch (error) {
            console.error('Error al obtener proveedores:', error);
            res.status(500).json({ error: 'Error al obtener proveedores', mensaje: 'Error al obtener proveedores' });
        }
    },

    // GET /api/proveedores/:id
    async getProveedorById(req, res) {
        try {
            const { id } = req.params;
            const proveedorId = parseInt(id, 10);
            if (isNaN(proveedorId)) {
                return res.status(400).json({ error: 'ID de proveedor inválido', mensaje: 'ID de proveedor inválido' });
            }

            const proveedor = await ProveedorModel.obtenerPorId(proveedorId);
            if (!proveedor) {
                return res.status(404).json({ error: 'Proveedor no encontrado', mensaje: 'Proveedor no encontrado' });
            }
            res.json(proveedor);
        } catch (error) {
            console.error('Error al obtener proveedor:', error);
            res.status(500).json({ error: 'Error al obtener el proveedor', mensaje: 'Error al obtener el proveedor' });
        }
    },

    // POST /api/proveedores
    async createProveedor(req, res) {
        try {
            const {
                ruc,
                nombre_empresa,
                tipo_alianza,
                porcentaje_comision,
                contacto_nombre,
                contacto_email,
                contacto_telefono,
                contacto,
                estado
            } = req.body;

            if (!nombre_empresa || !tipo_alianza) {
                return res.status(400).json({
                    error: 'Nombre de empresa y tipo de alianza son obligatorios',
                    mensaje: 'Nombre de empresa y tipo de alianza son obligatorios'
                });
            }

            const comision = porcentaje_comision !== undefined ? parseFloat(porcentaje_comision) : 0;
            if (isNaN(comision) || comision < 0 || comision > 100) {
                return res.status(400).json({
                    error: 'El porcentaje de comisión debe estar entre 0 y 100',
                    mensaje: 'El porcentaje de comisión debe estar entre 0 y 100'
                });
            }

            const proveedorData = {
                ruc: ruc ? sanitizarTexto(ruc) : null,
                nombre_empresa: sanitizarTexto(nombre_empresa),
                tipo_alianza: sanitizarTexto(tipo_alianza),
                porcentaje_comision: comision,
                contacto_nombre: contacto_nombre ? sanitizarTexto(contacto_nombre) : (contacto ? sanitizarTexto(contacto) : null),
                contacto_email: contacto_email ? sanitizarTexto(contacto_email) : null,
                contacto_telefono: contacto_telefono ? sanitizarTexto(contacto_telefono) : null,
                estado: estado || 'Activo'
            };

            const insertId = await ProveedorModel.crear(proveedorData);
            res.status(201).json({
                mensaje: 'Proveedor / Aliado registrado exitosamente',
                id_proveedor: insertId
            });
        } catch (error) {
            console.error('Error al crear proveedor:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'El RUC ingresado ya está registrado', mensaje: 'El RUC ingresado ya está registrado' });
            }
            res.status(500).json({ error: 'Error al registrar el proveedor', mensaje: 'Error al registrar el proveedor' });
        }
    },

    // PUT /api/proveedores/:id
    async updateProveedor(req, res) {
        try {
            const { id } = req.params;
            const proveedorId = parseInt(id, 10);
            if (isNaN(proveedorId)) {
                return res.status(400).json({ error: 'ID de proveedor inválido', mensaje: 'ID de proveedor inválido' });
            }

            const {
                ruc,
                nombre_empresa,
                tipo_alianza,
                porcentaje_comision,
                contacto_nombre,
                contacto_email,
                contacto_telefono,
                contacto,
                estado
            } = req.body;

            const comision = porcentaje_comision !== undefined ? parseFloat(porcentaje_comision) : undefined;
            if (comision !== undefined && (isNaN(comision) || comision < 0 || comision > 100)) {
                return res.status(400).json({
                    error: 'El porcentaje de comisión debe estar entre 0 y 100',
                    mensaje: 'El porcentaje de comisión debe estar entre 0 y 100'
                });
            }

            const proveedorData = {
                ruc: ruc !== undefined ? (ruc ? sanitizarTexto(ruc) : null) : undefined,
                nombre_empresa: nombre_empresa ? sanitizarTexto(nombre_empresa) : undefined,
                tipo_alianza: tipo_alianza ? sanitizarTexto(tipo_alianza) : undefined,
                porcentaje_comision: comision,
                contacto_nombre: contacto_nombre !== undefined ? (contacto_nombre ? sanitizarTexto(contacto_nombre) : null) : (contacto !== undefined ? sanitizarTexto(contacto) : undefined),
                contacto_email: contacto_email !== undefined ? (contacto_email ? sanitizarTexto(contacto_email) : null) : undefined,
                contacto_telefono: contacto_telefono !== undefined ? (contacto_telefono ? sanitizarTexto(contacto_telefono) : null) : undefined,
                estado: estado || 'Activo'
            };

            const actualizado = await ProveedorModel.actualizar(proveedorId, proveedorData);
            if (!actualizado) {
                return res.status(404).json({ error: 'Proveedor no encontrado o sin cambios', mensaje: 'Proveedor no encontrado o sin cambios' });
            }
            res.json({ mensaje: 'Proveedor / Aliado actualizado exitosamente' });
        } catch (error) {
            console.error('Error al actualizar proveedor:', error);
            res.status(500).json({ error: 'Error al actualizar el proveedor', mensaje: 'Error al actualizar el proveedor' });
        }
    },

    // PATCH /api/proveedores/:id/estado
    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const proveedorId = parseInt(id, 10);
            const { estado } = req.body;

            if (isNaN(proveedorId) || !['Activo', 'Inactivo'].includes(estado)) {
                return res.status(400).json({ error: 'Estado inválido', mensaje: 'Estado inválido' });
            }

            const actualizado = await ProveedorModel.cambiarEstado(proveedorId, estado);
            if (!actualizado) {
                return res.status(404).json({ error: 'Proveedor no encontrado', mensaje: 'Proveedor no encontrado' });
            }
            res.json({ mensaje: `Estado de proveedor actualizado a ${estado}` });
        } catch (error) {
            console.error('Error al cambiar estado de proveedor:', error);
            res.status(500).json({ error: 'Error al cambiar estado de proveedor', mensaje: 'Error al cambiar estado de proveedor' });
        }
    },

    // DELETE /api/proveedores/:id
    async deleteProveedor(req, res) {
        try {
            const { id } = req.params;
            const proveedorId = parseInt(id, 10);
            if (isNaN(proveedorId)) {
                return res.status(400).json({ error: 'ID inválido', mensaje: 'ID inválido' });
            }

            const eliminado = await ProveedorModel.eliminar(proveedorId);
            if (eliminado) {
                return res.json({ mensaje: 'Proveedor eliminado correctamente' });
            }

            res.status(404).json({ error: 'Proveedor no encontrado', mensaje: 'Proveedor no encontrado' });
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            res.status(500).json({ error: 'Error al eliminar el proveedor', mensaje: 'Error al eliminar el proveedor' });
        }
    }
};

module.exports = proveedorController;
