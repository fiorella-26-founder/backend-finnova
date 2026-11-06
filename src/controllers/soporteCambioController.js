const SoporteCambioModel = require('../models/soporteCambioModel');

const sanitizarTexto = (valor, maxLen = 500) => {
    if (valor === undefined || valor === null) return null;
    return String(valor).trim().replace(/[<>]/g, '').substring(0, maxLen);
};

exports.obtenerTodos = async (req, res) => {
    try {
        const tickets = await SoporteCambioModel.obtenerTodos();
        res.json(tickets);
    } catch (error) {
        console.error('Error al obtener tickets de soporte y control de cambios:', error);
        res.status(500).json({ error: 'Error al obtener la bandeja de soporte y control de cambios' });
    }
};

exports.obtenerMetricas = async (req, res) => {
    try {
        const tickets = await SoporteCambioModel.obtenerTodos();
        const dimensionesOficiales = ['Infraestructura', 'Aplicaciones y BD', 'Documentación', 'Calendario'];

        const porDimension = dimensionesOficiales.map(dim => {
            const itemsDim = tickets.filter(t => t.dimension_tecnica === dim && t.aplica_cambio === 'Si Aplica (RFC)');
            const abiertos = itemsDim.filter(t => t.estado === 'Abierto').length;
            const enProceso = itemsDim.filter(t => t.estado === 'En Proceso').length;
            const completados = itemsDim.filter(t => t.estado === 'Completado').length;
            return {
                dimension: dim,
                total: itemsDim.length,
                abiertos,
                en_proceso: enProceso,
                completados
            };
        });

        const totalRfc = tickets.filter(t => t.aplica_cambio === 'Si Aplica (RFC)');
        res.json({
            total_bandeja: tickets.length,
            total_rfc: totalRfc.length,
            total_mesa_ayuda: tickets.filter(t => t.aplica_cambio !== 'Si Aplica (RFC)').length,
            rfc_abiertos: totalRfc.filter(t => t.estado === 'Abierto').length,
            rfc_en_proceso: totalRfc.filter(t => t.estado === 'En Proceso').length,
            rfc_completados: totalRfc.filter(t => t.estado === 'Completado').length,
            por_dimension: porDimension
        });
    } catch (error) {
        console.error('Error al calcular métricas de control de cambios:', error);
        res.status(500).json({ error: 'Error al calcular métricas por dimensión técnica' });
    }
};

exports.crearTicket = async (req, res) => {
    try {
        const {
            id_ticket,
            codigo_jira,
            titulo,
            descripcion,
            tipo_solicitud,
            solicitante_nombre,
            solicitante_rol,
            prioridad,
            aplica_cambio,
            dimension_tecnica,
            tipo_cambio_itil,
            estado,
            componente_afectado,
            ventana_calendarizacion,
            doc_pase_referencia,
            plan_rollback,
            resolucion_tecnica
        } = req.body;

        if (!titulo || !descripcion) {
            return res.status(400).json({ error: 'El título y la descripción técnica de la solicitud son obligatorios.' });
        }

        const nuevoId = await SoporteCambioModel.crear({
            id_ticket: sanitizarTexto(id_ticket, 30),
            codigo_jira: sanitizarTexto(codigo_jira, 30),
            titulo: sanitizarTexto(titulo, 200),
            descripcion: sanitizarTexto(descripcion, 1500),
            tipo_solicitud: sanitizarTexto(tipo_solicitud, 60),
            solicitante_nombre: sanitizarTexto(solicitante_nombre, 120),
            solicitante_rol: sanitizarTexto(solicitante_rol, 40),
            prioridad: sanitizarTexto(prioridad, 20),
            aplica_cambio: sanitizarTexto(aplica_cambio, 40),
            dimension_tecnica: sanitizarTexto(dimension_tecnica, 50),
            tipo_cambio_itil: sanitizarTexto(tipo_cambio_itil, 40),
            estado: sanitizarTexto(estado, 40),
            componente_afectado: sanitizarTexto(componente_afectado, 100),
            ventana_calendarizacion: sanitizarTexto(ventana_calendarizacion, 120),
            doc_pase_referencia: sanitizarTexto(doc_pase_referencia, 150),
            plan_rollback: sanitizarTexto(plan_rollback, 1000),
            resolucion_tecnica: sanitizarTexto(resolucion_tecnica, 1000)
        });

        res.status(201).json({
            mensaje: 'Solicitud registrada exitosamente en la Bandeja de Soporte y Control de Cambios',
            id_ticket: nuevoId
        });
    } catch (error) {
        console.error('Error al crear ticket en bandeja:', error);
        res.status(500).json({ error: 'Error al registrar la solicitud en la bandeja' });
    }
};

exports.calificarTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const filas = await SoporteCambioModel.calificarYActualizar(id, req.body);
        if (filas === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado en la bandeja' });
        }
        res.json({ mensaje: 'Calificación de Control de Cambios y Dimensión Técnica actualizada correctamente' });
    } catch (error) {
        console.error('Error al calificar ticket:', error);
        res.status(500).json({ error: 'Error al actualizar la calificación del ticket' });
    }
};

exports.eliminarTicket = async (req, res) => {
    try {
        const { id } = req.params;
        await SoporteCambioModel.eliminar(id);
        res.json({ mensaje: 'Ticket eliminado de la bandeja' });
    } catch (error) {
        console.error('Error al eliminar ticket:', error);
        res.status(500).json({ error: 'Error al eliminar el ticket' });
    }
};
