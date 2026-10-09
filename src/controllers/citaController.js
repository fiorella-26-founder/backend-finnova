const pool = require('../config/db');
const CitaModel = require('../models/citaModel');
const SolicitudModel = require('../models/solicitudModel');

function sanitizarTexto(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '').trim();
}

const citaController = {
    // GET /api/citas
    async getCitas(req, res) {
        try {
            const user = req.usuario;
            if (user && user.rol === 'Asesor') {
                const citas = await CitaModel.obtenerPorAsesor(user.id_usuario);
                return res.json(citas);
            }
            if (user && user.rol === 'Cliente') {
                const citas = await CitaModel.obtenerPorCliente(user.id_usuario);
                return res.json(citas);
            }
            const citas = await CitaModel.obtenerTodas();
            res.json(citas);
        } catch (error) {
            console.error('Error al obtener citas:', error);
            res.status(500).json({ error: 'Error al obtener citas', mensaje: 'Error al obtener citas' });
        }
    },

    // GET /api/citas/:id
    async getCitaById(req, res) {
        try {
            const { id } = req.params;
            const cita = await CitaModel.obtenerPorId(sanitizarTexto(id));
            if (!cita) {
                return res.status(404).json({ error: 'Cita no encontrada', mensaje: 'Cita no encontrada' });
            }
            res.json(cita);
        } catch (error) {
            console.error('Error al obtener cita:', error);
            res.status(500).json({ error: 'Error al obtener la cita', mensaje: 'Error al obtener la cita' });
        }
    },

    // POST /api/citas
    async createCita(req, res) {
        try {
            let {
                id_cita,
                id_solicitud,
                requestId,
                id_cliente,
                clientId,
                id_asesor,
                advisorId,
                clientName,
                advisorName,
                fecha_hora,
                dateTime,
                modalidad,
                modality,
                lugar_o_enlace,
                locationOrLink,
                estado = 'Programada',
                indicaciones_previas,
                notes
            } = req.body;

            const targetRequestId = id_solicitud || requestId;
            let targetClientId = id_cliente || clientId;
            let targetAdvisorId = id_asesor || advisorId;
            const targetDateTime = fecha_hora || dateTime;
            const targetModality = modalidad || modality || 'Virtual';
            const targetLocation = lugar_o_enlace || locationOrLink || 'https://meet.google.com/finnova-asesoria';
            const targetNotes = indicaciones_previas || notes || null;

            if (!targetDateTime) {
                return res.status(400).json({ error: 'Fecha y hora de la cita son obligatorias', mensaje: 'Fecha y hora obligatorias' });
            }

            // Resolver cliente por nombre si no viene ID
            if (!targetClientId && clientName) {
                const [clientRows] = await pool.query(
                    'SELECT id_cliente FROM clientes WHERE nombre_completo LIKE ? LIMIT 1',
                    [`%${clientName.trim()}%`]
                );
                if (clientRows.length > 0) {
                    targetClientId = clientRows[0].id_cliente;
                }
            }

            // Resolver asesor por nombre si no viene ID
            if (!targetAdvisorId && advisorName) {
                const cleanAdvName = advisorName.replace(/\(.*\)/, '').trim();
                const [advisorRows] = await pool.query(
                    'SELECT id_usuario FROM usuarios WHERE nombre_completo LIKE ? LIMIT 1',
                    [`%${cleanAdvName}%`]
                );
                if (advisorRows.length > 0) {
                    targetAdvisorId = advisorRows[0].id_usuario;
                }
            }

            // Si se vincula a una solicitud y faltan cliente o asesor, autocompletar
            if (targetRequestId && (!targetClientId || !targetAdvisorId)) {
                const sol = await SolicitudModel.obtenerPorId(targetRequestId);
                if (sol) {
                    if (!targetClientId) targetClientId = sol.id_cliente;
                    if (!targetAdvisorId) targetAdvisorId = sol.id_asesor_asignado || 2;
                }
            }

            // Fallback general para asegurar integridad referencial
            if (!targetClientId) {
                const [cRows] = await pool.query('SELECT id_cliente FROM clientes LIMIT 1');
                if (cRows.length > 0) targetClientId = cRows[0].id_cliente;
            }
            if (!targetAdvisorId) {
                const [uRows] = await pool.query('SELECT id_usuario FROM usuarios WHERE id_rol IN (SELECT id_rol FROM roles WHERE nombre IN ("Asesor", "Administrador")) LIMIT 1');
                if (uRows.length > 0) targetAdvisorId = uRows[0].id_usuario;
                else targetAdvisorId = 2;
            }

            if (!targetClientId || !targetAdvisorId) {
                return res.status(400).json({
                    error: 'Cliente y asesor asignado son obligatorios para programar la cita',
                    mensaje: 'Cliente y asesor obligatorios'
                });
            }

            const citaData = {
                id_cita: id_cita ? sanitizarTexto(id_cita) : null,
                id_solicitud: targetRequestId ? sanitizarTexto(targetRequestId) : null,
                id_cliente: parseInt(targetClientId, 10),
                id_asesor: parseInt(targetAdvisorId, 10),
                fecha_hora: targetDateTime,
                modalidad: sanitizarTexto(targetModality),
                lugar_o_enlace: sanitizarTexto(targetLocation),
                estado: estado || 'Programada',
                indicaciones_previas: targetNotes ? sanitizarTexto(targetNotes) : null
            };

            const createdId = await CitaModel.crear(citaData);
            res.status(201).json({
                mensaje: 'Cita programada exitosamente',
                id_cita: createdId
            });
        } catch (error) {
            console.error('Error al crear cita:', error);
            res.status(500).json({ error: 'Error al programar la cita', mensaje: 'Error al programar la cita' });
        }
    },

    // PUT /api/citas/:id
    async updateCita(req, res) {
        try {
            const { id } = req.params;
            const citaId = sanitizarTexto(id);
            const {
                id_solicitud,
                id_cliente,
                id_asesor,
                fecha_hora,
                dateTime,
                modalidad,
                modality,
                lugar_o_enlace,
                locationOrLink,
                estado,
                indicaciones_previas,
                notes,
                observaciones_atencion,
                attentionNotes,
                resultados_acuerdos,
                advisoryOutcome
            } = req.body;

            const citaData = {
                id_solicitud: id_solicitud ? sanitizarTexto(id_solicitud) : undefined,
                id_cliente: id_cliente ? parseInt(id_cliente, 10) : undefined,
                id_asesor: id_asesor ? parseInt(id_asesor, 10) : undefined,
                fecha_hora: fecha_hora || dateTime || undefined,
                modalidad: modalidad || modality ? sanitizarTexto(modalidad || modality) : undefined,
                lugar_o_enlace: lugar_o_enlace || locationOrLink ? sanitizarTexto(lugar_o_enlace || locationOrLink) : undefined,
                estado: estado || undefined,
                indicaciones_previas: indicaciones_previas !== undefined ? (indicaciones_previas ? sanitizarTexto(indicaciones_previas) : null) : (notes !== undefined ? sanitizarTexto(notes) : undefined),
                observaciones_atencion: observaciones_atencion !== undefined ? (observaciones_atencion ? sanitizarTexto(observaciones_atencion) : null) : (attentionNotes !== undefined ? sanitizarTexto(attentionNotes) : undefined),
                resultados_acuerdos: resultados_acuerdos !== undefined ? (resultados_acuerdos ? sanitizarTexto(resultados_acuerdos) : null) : (advisoryOutcome !== undefined ? sanitizarTexto(advisoryOutcome) : undefined)
            };

            const actualizado = await CitaModel.actualizar(citaId, citaData);
            if (!actualizado) {
                return res.status(404).json({ error: 'Cita no encontrada o sin cambios', mensaje: 'Cita no encontrada o sin cambios' });
            }
            res.json({ mensaje: 'Cita actualizada correctamente' });
        } catch (error) {
            console.error('Error al actualizar cita:', error);
            res.status(500).json({ error: 'Error al actualizar la cita', mensaje: 'Error al actualizar la cita' });
        }
    },

    // PATCH /api/citas/:id/estado
    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado, status } = req.body;
            const targetStatus = estado || status;

            if (!targetStatus || !['Programada', 'Realizada', 'Cancelada'].includes(targetStatus)) {
                return res.status(400).json({ error: 'Estado de cita inválido', mensaje: 'Estado inválido' });
            }

            const actualizado = await CitaModel.cambiarEstado(sanitizarTexto(id), targetStatus);
            if (!actualizado) {
                return res.status(404).json({ error: 'Cita no encontrada', mensaje: 'Cita no encontrada' });
            }
            res.json({ mensaje: `Estado de la cita actualizado a "${targetStatus}"` });
        } catch (error) {
            console.error('Error al cambiar estado de cita:', error);
            res.status(500).json({ error: 'Error al actualizar estado de cita', mensaje: 'Error al actualizar estado de cita' });
        }
    },

    // PATCH /api/citas/:id/atencion
    async registrarAtencion(req, res) {
        try {
            const { id } = req.params;
            const { observaciones_atencion, attentionNotes, resultados_acuerdos, advisoryOutcome } = req.body;

            const obs = observaciones_atencion || attentionNotes || '';
            const resAcuerdos = resultados_acuerdos || advisoryOutcome || '';

            const actualizado = await CitaModel.registrarAtencion(sanitizarTexto(id), {
                observaciones_atencion: sanitizarTexto(obs),
                resultados_acuerdos: sanitizarTexto(resAcuerdos)
            });

            if (!actualizado) {
                return res.status(404).json({ error: 'Cita no encontrada', mensaje: 'Cita no encontrada' });
            }
            res.json({ mensaje: 'Atención de cita registrada correctamente' });
        } catch (error) {
            console.error('Error al registrar atención de cita:', error);
            res.status(500).json({ error: 'Error al registrar atención de cita', mensaje: 'Error al registrar atención de cita' });
        }
    },

    // DELETE /api/citas/:id
    async deleteCita(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await CitaModel.eliminar(sanitizarTexto(id));
            if (!eliminado) {
                return res.status(404).json({ error: 'Cita no encontrada', mensaje: 'Cita no encontrada' });
            }
            res.json({ mensaje: 'Cita eliminada correctamente' });
        } catch (error) {
            console.error('Error al eliminar cita:', error);
            res.status(500).json({ error: 'Error al eliminar cita', mensaje: 'Error al eliminar cita' });
        }
    }
};

module.exports = citaController;
