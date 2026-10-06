const ServicioModel = require('../models/servicioModel');

function sanitizarTexto(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '').trim();
}

const servicioController = {
    // GET /api/servicios/publicos (Catálogo público optimizado para Landing)
    async getServiciosPublicos(req, res) {
        try {
            const servicios = await ServicioModel.obtenerActivosPublicos();
            res.json(servicios);
        } catch (error) {
            console.error('Error al obtener servicios públicos:', error);
            res.status(500).json({ error: 'Error al obtener servicios públicos', mensaje: 'Error al obtener servicios públicos' });
        }
    },

    // GET /api/servicios
    async getServicios(req, res) {
        try {
            const servicios = await ServicioModel.obtenerTodos();
            res.json(servicios);
        } catch (error) {
            console.error('Error al obtener servicios:', error);
            res.status(500).json({ error: 'Error interno del servidor al obtener servicios', mensaje: 'Error al obtener servicios' });
        }
    },

    // GET /api/servicios/:id
    async getServicioById(req, res) {
        try {
            const { id } = req.params;
            const servicioId = parseInt(id, 10);
            if (isNaN(servicioId)) {
                return res.status(400).json({ error: 'ID de servicio inválido', mensaje: 'ID de servicio inválido' });
            }

            const servicio = await ServicioModel.obtenerPorId(servicioId);
            if (!servicio) {
                return res.status(404).json({ error: 'Servicio no encontrado', mensaje: 'Servicio no encontrado' });
            }
            res.json(servicio);
        } catch (error) {
            console.error('Error al obtener servicio:', error);
            res.status(500).json({ error: 'Error al obtener el servicio', mensaje: 'Error al obtener el servicio' });
        }
    },

    // POST /api/servicios
    async createServicio(req, res) {
        try {
            const { titulo, descripcion, categoria, precio_tarifa, url_imagen, id_proveedor, estado } = req.body;
            if (!titulo || !categoria || precio_tarifa === undefined) {
                return res.status(400).json({ error: 'Título, categoría y precio tarifa son obligatorios', mensaje: 'Título, categoría y precio tarifa son obligatorios' });
            }

            const precio = parseFloat(precio_tarifa);
            if (isNaN(precio) || precio < 0) {
                return res.status(400).json({ error: 'El precio debe ser un número válido y no negativo', mensaje: 'El precio debe ser un número válido y no negativo' });
            }

            const servicioData = {
                titulo: sanitizarTexto(titulo),
                descripcion: descripcion ? sanitizarTexto(descripcion) : '',
                categoria: sanitizarTexto(categoria),
                precio_tarifa: precio,
                url_imagen: url_imagen || null,
                id_proveedor: id_proveedor ? parseInt(id_proveedor, 10) : null,
                estado: estado || 'Activo'
            };

            const insertId = await ServicioModel.crear(servicioData);
            res.status(201).json({
                mensaje: 'Servicio creado exitosamente',
                id_servicio: insertId
            });
        } catch (error) {
            console.error('Error al crear servicio:', error);
            res.status(500).json({ error: 'Error al registrar el servicio', mensaje: 'Error al registrar el servicio' });
        }
    },

    // PUT /api/servicios/:id
    async updateServicio(req, res) {
        try {
            const { id } = req.params;
            const servicioId = parseInt(id, 10);
            if (isNaN(servicioId)) {
                return res.status(400).json({ error: 'ID de servicio inválido', mensaje: 'ID de servicio inválido' });
            }

            const { titulo, descripcion, categoria, precio_tarifa, url_imagen, id_proveedor, estado } = req.body;
            
            const precio = parseFloat(precio_tarifa);
            if (precio_tarifa !== undefined && (isNaN(precio) || precio < 0)) {
                return res.status(400).json({ error: 'El precio debe ser un número válido y no negativo', mensaje: 'El precio debe ser un número válido y no negativo' });
            }

            const servicioData = {
                titulo: titulo ? sanitizarTexto(titulo) : undefined,
                descripcion: descripcion !== undefined ? sanitizarTexto(descripcion) : undefined,
                categoria: categoria ? sanitizarTexto(categoria) : undefined,
                precio_tarifa: precio !== undefined ? precio : undefined,
                url_imagen: url_imagen !== undefined ? url_imagen : undefined,
                id_proveedor: id_proveedor !== undefined ? (id_proveedor ? parseInt(id_proveedor, 10) : null) : undefined,
                estado: estado || 'Activo'
            };

            const actualizado = await ServicioModel.actualizar(servicioId, servicioData);
            if (!actualizado) {
                return res.status(404).json({ error: 'Servicio no encontrado o sin cambios', mensaje: 'Servicio no encontrado o sin cambios' });
            }
            res.json({ mensaje: 'Servicio actualizado exitosamente' });
        } catch (error) {
            console.error('Error al actualizar servicio:', error);
            res.status(500).json({ error: 'Error al actualizar el servicio', mensaje: 'Error al actualizar el servicio' });
        }
    },

    // PATCH /api/servicios/:id/estado
    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const servicioId = parseInt(id, 10);
            const { estado } = req.body;

            if (isNaN(servicioId) || !['Activo', 'Inactivo'].includes(estado)) {
                return res.status(400).json({ error: 'Parámetros inválidos para cambio de estado', mensaje: 'Estado inválido' });
            }

            const actualizado = await ServicioModel.cambiarEstado(servicioId, estado);
            if (!actualizado) {
                return res.status(404).json({ error: 'Servicio no encontrado', mensaje: 'Servicio no encontrado' });
            }
            res.json({ mensaje: `Estado de servicio actualizado a ${estado}` });
        } catch (error) {
            console.error('Error al cambiar estado de servicio:', error);
            res.status(500).json({ error: 'Error al cambiar estado de servicio', mensaje: 'Error al cambiar estado de servicio' });
        }
    },

    // DELETE /api/servicios/:id
    async deleteServicio(req, res) {
        try {
            const { id } = req.params;
            const servicioId = parseInt(id, 10);
            if (isNaN(servicioId)) {
                return res.status(400).json({ error: 'ID inválido', mensaje: 'ID inválido' });
            }

            const eliminado = await ServicioModel.eliminar(servicioId);
            if (eliminado) {
                return res.json({ mensaje: 'Servicio financiero eliminado correctamente' });
            }

            res.status(404).json({ error: 'Servicio no encontrado', mensaje: 'Servicio no encontrado' });
        } catch (error) {
            console.error('Error al eliminar servicio:', error);
            res.status(500).json({ error: 'Error al eliminar el servicio de la base de datos', mensaje: 'Error al eliminar el servicio' });
        }
    }
};

module.exports = servicioController;
