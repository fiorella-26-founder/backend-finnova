const CampaniaModel = require('../models/campaniaModel');

function sanitizarTexto(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '').trim();
}

const campaniaController = {
    // GET /api/campanias
    async getCampanias(req, res) {
        try {
            const campanias = await CampaniaModel.obtenerTodas();
            res.json(campanias);
        } catch (error) {
            console.error('Error al obtener campañas:', error);
            res.status(500).json({ error: 'Error al obtener campañas', mensaje: 'Error al obtener campañas' });
        }
    },

    // GET /api/campanias/:id
    async getCampaniaById(req, res) {
        try {
            const { id } = req.params;
            const campaniaId = parseInt(id, 10);
            if (isNaN(campaniaId)) {
                return res.status(400).json({ error: 'ID de campaña inválido', mensaje: 'ID de campaña inválido' });
            }

            const campania = await CampaniaModel.obtenerPorId(campaniaId);
            if (!campania) {
                return res.status(404).json({ error: 'Campaña no encontrada', mensaje: 'Campaña no encontrada' });
            }
            res.json(campania);
        } catch (error) {
            console.error('Error al obtener campaña:', error);
            res.status(500).json({ error: 'Error al consultar la campaña', mensaje: 'Error al consultar la campaña' });
        }
    },

    // POST /api/campanias
    async createCampania(req, res) {
        try {
            const {
                titulo,
                title,
                mensaje_promocional,
                message,
                publico_objetivo,
                categoria,
                url_imagen,
                imageUrl,
                estado = 'Activa',
                status,
                id_servicio,
                targetServiceId,
                id_proveedor,
                targetProveedorId,
                fecha_programada,
                id_usuario_creador
            } = req.body;

            const targetTitle = titulo || title;
            const targetMessage = mensaje_promocional || message;
            const targetImage = url_imagen || imageUrl || null;
            const targetStatus = estado || status || 'Activa';
            const targetServId = id_servicio !== undefined ? id_servicio : (targetServiceId || null);
            const targetProvId = id_proveedor !== undefined ? id_proveedor : (targetProveedorId || null);

            if (!targetTitle || !targetMessage) {
                return res.status(400).json({
                    error: 'Título y mensaje de la campaña son obligatorios',
                    mensaje: 'Título y mensaje obligatorios'
                });
            }

            const campaniaData = {
                titulo: sanitizarTexto(targetTitle),
                mensaje_promocional: sanitizarTexto(targetMessage),
                publico_objetivo: publico_objetivo ? sanitizarTexto(publico_objetivo) : 'General',
                categoria: categoria ? sanitizarTexto(categoria) : 'Promoción',
                url_imagen: targetImage, // Puede ser Base64 o URL
                estado: targetStatus,
                id_servicio: targetServId ? parseInt(targetServId, 10) : null,
                id_proveedor: targetProvId ? parseInt(targetProvId, 10) : null,
                fecha_programada: fecha_programada || null,
                id_usuario_creador: id_usuario_creador ? parseInt(id_usuario_creador, 10) : null
            };

            const insertId = await CampaniaModel.crear(campaniaData);
            res.status(201).json({
                mensaje: 'Campaña registrada exitosamente',
                id_campana: insertId
            });
        } catch (error) {
            console.error('Error al crear campaña:', error);
            res.status(500).json({ error: 'Error al registrar la campaña', mensaje: 'Error al registrar la campaña' });
        }
    },

    // PUT /api/campanias/:id
    async updateCampania(req, res) {
        try {
            const { id } = req.params;
            const campaniaId = parseInt(id, 10);
            if (isNaN(campaniaId)) {
                return res.status(400).json({ error: 'ID inválido', mensaje: 'ID inválido' });
            }

            const {
                titulo,
                title,
                mensaje_promocional,
                message,
                publico_objetivo,
                categoria,
                url_imagen,
                imageUrl,
                estado,
                status,
                id_servicio,
                targetServiceId,
                id_proveedor,
                targetProveedorId,
                fecha_programada
            } = req.body;

            const campaniaData = {
                titulo: titulo || title ? sanitizarTexto(titulo || title) : undefined,
                mensaje_promocional: mensaje_promocional || message ? sanitizarTexto(mensaje_promocional || message) : undefined,
                publico_objetivo: publico_objetivo ? sanitizarTexto(publico_objetivo) : undefined,
                categoria: categoria ? sanitizarTexto(categoria) : undefined,
                url_imagen: url_imagen !== undefined ? url_imagen : (imageUrl !== undefined ? imageUrl : undefined),
                estado: estado || status || undefined,
                id_servicio: id_servicio !== undefined ? (id_servicio ? parseInt(id_servicio, 10) : null) : (targetServiceId !== undefined ? (targetServiceId ? parseInt(targetServiceId, 10) : null) : undefined),
                id_proveedor: id_proveedor !== undefined ? (id_proveedor ? parseInt(id_proveedor, 10) : null) : (targetProveedorId !== undefined ? (targetProveedorId ? parseInt(targetProveedorId, 10) : null) : undefined),
                fecha_programada: fecha_programada || undefined
            };

            const actualizado = await CampaniaModel.actualizar(campaniaId, campaniaData);
            if (!actualizado) {
                return res.status(404).json({ error: 'Campaña no encontrada o sin cambios', mensaje: 'Campaña no encontrada o sin cambios' });
            }
            res.json({ mensaje: 'Campaña actualizada correctamente' });
        } catch (error) {
            console.error('Error al actualizar campaña:', error);
            res.status(500).json({ error: 'Error al actualizar la campaña', mensaje: 'Error al actualizar la campaña' });
        }
    },

    // PATCH /api/campanias/:id/estado
    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const campaniaId = parseInt(id, 10);
            const { estado, status } = req.body;
            const targetStatus = estado || status;

            if (isNaN(campaniaId) || !['Activa', 'Inactiva', 'Borrador'].includes(targetStatus)) {
                return res.status(400).json({ error: 'Estado de campaña inválido', mensaje: 'Estado inválido' });
            }

            const actualizado = await CampaniaModel.cambiarEstado(campaniaId, targetStatus);
            if (!actualizado) {
                return res.status(404).json({ error: 'Campaña no encontrada', mensaje: 'Campaña no encontrada' });
            }
            res.json({ mensaje: `Estado de campaña actualizado a "${targetStatus}"` });
        } catch (error) {
            console.error('Error al cambiar estado de campaña:', error);
            res.status(500).json({ error: 'Error al actualizar estado de campaña', mensaje: 'Error al actualizar estado de campaña' });
        }
    },

    // DELETE /api/campanias/:id
    async deleteCampania(req, res) {
        try {
            const { id } = req.params;
            const campaniaId = parseInt(id, 10);
            if (isNaN(campaniaId)) {
                return res.status(400).json({ error: 'ID inválido', mensaje: 'ID inválido' });
            }

            const eliminado = await CampaniaModel.eliminar(campaniaId);
            if (!eliminado) {
                return res.status(404).json({ error: 'Campaña no encontrada', mensaje: 'Campaña no encontrada' });
            }
            res.json({ mensaje: 'Campaña eliminada correctamente' });
        } catch (error) {
            console.error('Error al eliminar campaña:', error);
            res.status(500).json({ error: 'Error al eliminar campaña', mensaje: 'Error al eliminar campaña' });
        }
    }
};

module.exports = campaniaController;
