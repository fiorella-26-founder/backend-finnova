const SolicitudModel = require('../models/solicitudModel');
const ClienteModel = require('../models/clienteModel');
const UsuarioModel = require('../models/usuarioModel');
const EmailService = require('../utils/emailService');
const cryptoUtil = require('../utils/cryptoUtil');
const pool = require('../config/db');

function sanitizarTexto(texto) {
    if (typeof texto !== 'string') return texto;
    return texto.trim();
}

const solicitudController = {
    // GET /api/solicitudes
    async getSolicitudes(req, res) {
        try {
            const user = req.usuario;
            if (user && user.rol === 'Asesor') {
                const solicitudes = await SolicitudModel.obtenerPorAsesor(user.id_usuario);
                return res.json(solicitudes);
            }
            const solicitudes = await SolicitudModel.obtenerTodas();
            res.json(solicitudes);
        } catch (error) {
            console.error('Error al obtener solicitudes:', error);
            res.status(500).json({ error: 'Error interno al consultar solicitudes', mensaje: 'Error al consultar solicitudes' });
        }
    },

    // GET /api/solicitudes/:id
    async getSolicitudById(req, res) {
        try {
            const { id } = req.params;
            const solicitud = await SolicitudModel.obtenerPorId(sanitizarTexto(id));
            if (!solicitud) {
                return res.status(404).json({ error: 'Solicitud no encontrada', mensaje: 'Solicitud no encontrada' });
            }
            res.json(solicitud);
        } catch (error) {
            console.error('Error al obtener solicitud:', error);
            res.status(500).json({ error: 'Error al consultar solicitud', mensaje: 'Error al consultar solicitud' });
        }
    },

    // POST /api/solicitudes
    async createSolicitud(req, res) {
        try {
            const {
                id_solicitud,
                clientDni,
                clientName,
                clientEmail,
                clientPhone,
                serviceId,
                monto_servicio,
                notes,
                estado_pago = 'Pendiente',
                numero_operacion_yape,
                monto_pagado,
                assignedAdvisorId,
                url_voucher_imagen,
                id_cliente,
                id_servicio,
                notas_consulta,
                id_asesor_asignado
            } = req.body;

            const targetDni = clientDni ? sanitizarTexto(clientDni) : null;
            const targetName = clientName ? sanitizarTexto(clientName) : null;
            const targetEmail = clientEmail ? sanitizarTexto(clientEmail).toLowerCase() : null;
            const targetPhone = clientPhone ? sanitizarTexto(clientPhone) : null;
            const targetServiceId = serviceId || id_servicio;
            const targetNotas = notes || notas_consulta;
            const targetAdvisorId = assignedAdvisorId || id_asesor_asignado;

            let finalClienteId = id_cliente;

            if (!finalClienteId && targetDni && targetName && targetEmail) {
                let clienteExistente = await ClienteModel.obtenerPorDni(targetDni);
                if (!clienteExistente) {
                    finalClienteId = await ClienteModel.crear({
                        dni: targetDni,
                        nombre_completo: targetName,
                        correo_electronico: targetEmail,
                        telefono: targetPhone,
                        id_asesor_preferente: null,
                        estado: 'Activo'
                    });
                } else {
                    finalClienteId = clienteExistente.id_cliente;
                }
            }

            if (!finalClienteId) {
                return res.status(400).json({
                    error: 'Faltan datos obligatorios del cliente (DNI, Nombre, Correo)',
                    mensaje: 'Faltan datos obligatorios del cliente'
                });
            }

            if (!targetServiceId) {
                return res.status(400).json({
                    error: 'Se requiere especificar el servicio solicitado',
                    mensaje: 'Se requiere especificar el servicio solicitado'
                });
            }

            const monto = monto_servicio ? parseFloat(monto_servicio) : 0;

            const solicitudData = {
                id_solicitud: id_solicitud ? sanitizarTexto(id_solicitud) : null,
                id_cliente: parseInt(finalClienteId, 10),
                id_servicio: parseInt(targetServiceId, 10),
                monto_servicio: isNaN(monto) ? 0 : monto,
                notas_consulta: targetNotas ? sanitizarTexto(targetNotas) : null,
                estado_pago: sanitizarTexto(estado_pago) || 'Pendiente',
                numero_operacion_yape: numero_operacion_yape ? sanitizarTexto(numero_operacion_yape) : null,
                monto_pagado: monto_pagado ? parseFloat(monto_pagado) : null,
                id_asesor_asignado: targetAdvisorId ? parseInt(targetAdvisorId, 10) : null,
                url_voucher_imagen: url_voucher_imagen || null
            };

            const createdId = await SolicitudModel.crear(solicitudData);
            res.status(201).json({
                mensaje: 'Solicitud registrada correctamente',
                id_solicitud: createdId
            });
        } catch (error) {
            console.error('Error al crear solicitud:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'El código de la solicitud ya existe', mensaje: 'El código de la solicitud ya existe' });
            }
            res.status(500).json({ error: 'Error al registrar la solicitud', mensaje: 'Error al registrar la solicitud' });
        }
    },

    // PUT /api/solicitudes/:id
    async updateSolicitud(req, res) {
        try {
            const { id } = req.params;
            const solicitudId = sanitizarTexto(id);

            const actualizado = await SolicitudModel.actualizar(solicitudId, req.body);
            if (!actualizado) {
                return res.status(404).json({ error: 'Solicitud no encontrada o sin cambios', mensaje: 'Solicitud no encontrada o sin cambios' });
            }
            res.json({ mensaje: 'Solicitud actualizada correctamente' });
        } catch (error) {
            console.error('Error al actualizar solicitud:', error);
            res.status(500).json({ error: 'Error al actualizar solicitud', mensaje: 'Error al actualizar solicitud' });
        }
    },

    // PATCH /api/solicitudes/:id/asignar-asesor
    async asignarAsesor(req, res) {
        try {
            const { id } = req.params;
            const { id_asesor, advisorId } = req.body;
            const targetAdvisorId = id_asesor || advisorId;

            if (!targetAdvisorId) {
                return res.status(400).json({ error: 'Se requiere ID de asesor', mensaje: 'Se requiere ID de asesor' });
            }

            const actualizado = await SolicitudModel.asignarAsesor(sanitizarTexto(id), parseInt(targetAdvisorId, 10));
            if (!actualizado) {
                return res.status(404).json({ error: 'Solicitud no encontrada', mensaje: 'Solicitud no encontrada' });
            }

            res.json({ mensaje: 'Asesor asignado exitosamente a la solicitud' });
        } catch (error) {
            console.error('Error al asignar asesor a solicitud:', error);
            res.status(500).json({ error: 'Error al asignar asesor', mensaje: 'Error al asignar asesor' });
        }
    },

    // PATCH /api/solicitudes/:id/estado
    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado, status } = req.body;
            const targetStatus = estado || status;

            if (!targetStatus) {
                return res.status(400).json({ error: 'Estado requerido', mensaje: 'Estado requerido' });
            }

            const actualizado = await SolicitudModel.cambiarEstado(sanitizarTexto(id), sanitizarTexto(targetStatus));
            if (!actualizado) {
                return res.status(404).json({ error: 'Solicitud no encontrada', mensaje: 'Solicitud no encontrada' });
            }

            res.json({ mensaje: `Estado de la solicitud actualizado a "${targetStatus}"` });
        } catch (error) {
            console.error('Error al cambiar estado de solicitud:', error);
            res.status(500).json({ error: 'Error al actualizar estado', mensaje: 'Error al actualizar estado' });
        }
    },

    // PATCH /api/solicitudes/:id/sesion-asesoria
    async registrarSesion(req, res) {
        try {
            const { id } = req.params;
            const { observaciones_asesoria, advisoryNotes, resultado_asesoria, advisoryOutcome } = req.body;

            const obs = observaciones_asesoria || advisoryNotes || '';
            const resOutcome = resultado_asesoria || advisoryOutcome || '';

            const actualizado = await SolicitudModel.registrarSesion(sanitizarTexto(id), {
                observaciones_asesoria: sanitizarTexto(obs),
                resultado_asesoria: sanitizarTexto(resOutcome)
            });

            if (!actualizado) {
                return res.status(404).json({ error: 'Solicitud no encontrada', mensaje: 'Solicitud no encontrada' });
            }

            res.json({ mensaje: 'Sesión de asesoría registrada exitosamente' });
        } catch (error) {
            console.error('Error al registrar sesión de asesoría:', error);
            res.status(500).json({ error: 'Error al registrar sesión', mensaje: 'Error al registrar sesión' });
        }
    },

    // PATCH /api/solicitudes/:id/cerrar
    async cerrarSolicitud(req, res) {
        try {
            const { id } = req.params;
            const { conclusion_cierre, closureNotes, estado_atencion, status } = req.body;

            const conclusion = conclusion_cierre || closureNotes || '';
            const finalStatus = estado_atencion || status || 'Finalizada';

            const actualizado = await SolicitudModel.cerrarSolicitud(sanitizarTexto(id), {
                conclusion_cierre: sanitizarTexto(conclusion),
                estado_atencion: sanitizarTexto(finalStatus)
            });

            if (!actualizado) {
                return res.status(404).json({ error: 'Solicitud no encontrada', mensaje: 'Solicitud no encontrada' });
            }

            res.json({ mensaje: 'Solicitud cerrada formalmente' });
        } catch (error) {
            console.error('Error al cerrar solicitud:', error);
            res.status(500).json({ error: 'Error al cerrar solicitud', mensaje: 'Error al cerrar solicitud' });
        }
    },

    // PATCH /api/solicitudes/:id/validar-pago
    async validarPago(req, res) {
        try {
            const { id } = req.params;
            const { estado_pago = 'Pagado', monto_pagado, numero_operacion_yape } = req.body;
            const solicitudId = sanitizarTexto(id);

            const actualizado = await SolicitudModel.validarPago(solicitudId, {
                estado_pago: sanitizarTexto(estado_pago),
                monto_pagado: monto_pagado ? parseFloat(monto_pagado) : null,
                numero_operacion_yape: numero_operacion_yape ? sanitizarTexto(numero_operacion_yape) : null
            });

            if (!actualizado) {
                return res.status(404).json({ error: 'Solicitud no encontrada', mensaje: 'Solicitud no encontrada' });
            }

            // Si el pago fue aprobado ('Pagado'), auto-crear usuario cliente y enviar credenciales
            if (estado_pago === 'Pagado') {
                const sol = await SolicitudModel.obtenerPorId(solicitudId);
                let clientEmail = sol && sol.correo_cliente && sol.correo_cliente !== '-' ? sol.correo_cliente.trim().toLowerCase() : null;
                let clientDni = sol && sol.dni_cliente && sol.dni_cliente !== '-' ? sol.dni_cliente.trim() : '';
                let clientName = sol && sol.nombre_cliente && sol.nombre_cliente !== '-' ? sol.nombre_cliente.trim() : 'Cliente Finnova';
                let clientPhone = sol && sol.telefono_cliente && sol.telefono_cliente !== '-' ? sol.telefono_cliente.trim() : null;
                let clienteId = sol ? sol.id_cliente : null;

                // Si los datos no vinieron directamente en la solicitud, consultar cliente por ID
                if ((!clientEmail || clientEmail === '-') && clienteId) {
                    const cli = await ClienteModel.obtenerPorId(clienteId);
                    if (cli) {
                        clientEmail = cli.correo_electronico ? cli.correo_electronico.trim().toLowerCase() : null;
                        clientDni = cli.dni ? cli.dni.trim() : clientDni;
                        clientName = cli.nombre_completo ? cli.nombre_completo.trim() : clientName;
                        clientPhone = cli.telefono && cli.telefono !== '-' ? cli.telefono.trim() : clientPhone;
                    }
                }

                if (clientEmail) {
                    // 1. Verificar si ya existe usuario con este correo
                    let usuario = await UsuarioModel.buscarPorEmail(clientEmail);
                    if (!usuario) {
                        const tempPassword = cryptoUtil.generarPasswordAleatoria(8);
                        const id_usuario = await UsuarioModel.crear({
                            dni: clientDni || '00000000',
                            nombre_completo: clientName,
                            correo_electronico: clientEmail,
                            telefono: clientPhone,
                            contrasena: tempPassword,
                            id_rol: 3, // Rol Cliente
                            estado: 'Activo'
                        });

                        // 2. Vincular id_usuario en la tabla clientes
                        if (clienteId) {
                            await pool.query('UPDATE clientes SET id_usuario = ? WHERE id_cliente = ?', [id_usuario, clienteId]);
                        }

                        // 3. Enviar correo de bienvenida con credenciales
                        await EmailService.enviarCredencialesCliente({
                            nombre: clientName,
                            email: clientEmail,
                            password: tempPassword,
                            dni: clientDni,
                            id_solicitud: solicitudId
                        });
                    } else if (clienteId) {
                        // Si ya existía el usuario pero no estaba vinculado en la tabla clientes
                        await pool.query('UPDATE clientes SET id_usuario = ? WHERE id_cliente = ? AND id_usuario IS NULL', [usuario.id_usuario, clienteId]);
                    }
                }
            }

            res.json({ mensaje: `Pago de la solicitud actualizado a "${estado_pago}"` });
        } catch (error) {
            console.error('Error al validar pago de solicitud:', error);
            res.status(500).json({ error: 'Error al validar pago', mensaje: 'Error al validar pago' });
        }
    },

    // DELETE /api/solicitudes/:id
    async deleteSolicitud(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await SolicitudModel.eliminar(sanitizarTexto(id));
            if (!eliminado) {
                return res.status(404).json({ error: 'Solicitud no encontrada', mensaje: 'Solicitud no encontrada' });
            }
            res.json({ mensaje: 'Solicitud eliminada correctamente' });
        } catch (error) {
            console.error('Error al eliminar solicitud:', error);
            res.status(500).json({ error: 'Error al eliminar la solicitud', mensaje: 'Error al eliminar la solicitud' });
        }
    }
};

module.exports = solicitudController;
