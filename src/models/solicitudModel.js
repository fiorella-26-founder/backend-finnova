const pool = require('../config/db');

const SolicitudModel = {
    // Obtener todas las solicitudes con datos cruzados de cliente, servicio, aliado y asesor
    async obtenerTodas() {
        const [rows] = await pool.query(`
            SELECT 
                sol.id_solicitud,
                sol.id_cliente,
                sol.id_servicio,
                sol.monto_servicio,
                COALESCE(sol.notas_consulta, '-') AS notas_consulta,
                sol.estado_pago,
                COALESCE(sol.numero_operacion_yape, '-') AS numero_operacion_yape,
                COALESCE(sol.monto_pagado, 0.00) AS monto_pagado,
                sol.fecha_pago_validado,
                sol.id_asesor_asignado,
                sol.estado_atencion,
                COALESCE(sol.porcentaje_comision_aliado, 0.00) AS porcentaje_comision_aliado,
                COALESCE(sol.monto_comision_broker, 0.00) AS monto_comision_broker,
                COALESCE(sol.conclusion_cierre, '-') AS conclusion_cierre,
                COALESCE(sol.observaciones_asesoria, '-') AS observaciones_asesoria,
                COALESCE(sol.resultado_asesoria, '-') AS resultado_asesoria,
                sol.url_voucher_imagen,
                sol.fecha_registro,
                sol.fecha_cierre,
                COALESCE(c.nombre_completo, '-') AS nombre_cliente, 
                COALESCE(c.dni, '-') AS dni_cliente,
                COALESCE(c.correo_electronico, '-') AS correo_cliente,
                COALESCE(c.telefono, '-') AS telefono_cliente,
                COALESCE(s.titulo, '-') AS titulo_servicio,
                COALESCE(s.precio_tarifa, sol.monto_servicio) AS precio_servicio,
                s.id_proveedor AS id_proveedor_servicio,
                COALESCE(p.nombre_empresa, '-') AS nombre_proveedor,
                COALESCE(p.porcentaje_comision, 0.00) AS comision_proveedor_pct,
                COALESCE(u.nombre_completo, '-') AS nombre_asesor,
                COALESCE(u.correo_electronico, '-') AS correo_asesor
            FROM solicitudes sol
            LEFT JOIN clientes c ON sol.id_cliente = c.id_cliente
            LEFT JOIN servicios s ON sol.id_servicio = s.id_servicio
            LEFT JOIN proveedores p ON s.id_proveedor = p.id_proveedor
            LEFT JOIN usuarios u ON sol.id_asesor_asignado = u.id_usuario
            ORDER BY sol.fecha_registro DESC
        `);
        return rows;
    },

    // Obtener solicitud por ID
    async obtenerPorId(id_solicitud) {
        const [rows] = await pool.query(`
            SELECT 
                sol.id_solicitud,
                sol.id_cliente,
                sol.id_servicio,
                sol.monto_servicio,
                COALESCE(sol.notas_consulta, '-') AS notas_consulta,
                sol.estado_pago,
                COALESCE(sol.numero_operacion_yape, '-') AS numero_operacion_yape,
                COALESCE(sol.monto_pagado, 0.00) AS monto_pagado,
                sol.fecha_pago_validado,
                sol.id_asesor_asignado,
                sol.estado_atencion,
                COALESCE(sol.porcentaje_comision_aliado, 0.00) AS porcentaje_comision_aliado,
                COALESCE(sol.monto_comision_broker, 0.00) AS monto_comision_broker,
                COALESCE(sol.conclusion_cierre, '-') AS conclusion_cierre,
                COALESCE(sol.observaciones_asesoria, '-') AS observaciones_asesoria,
                COALESCE(sol.resultado_asesoria, '-') AS resultado_asesoria,
                sol.url_voucher_imagen,
                sol.fecha_registro,
                sol.fecha_cierre,
                COALESCE(c.nombre_completo, '-') AS nombre_cliente, 
                COALESCE(c.dni, '-') AS dni_cliente,
                COALESCE(c.correo_electronico, '-') AS correo_cliente,
                COALESCE(c.telefono, '-') AS telefono_cliente,
                COALESCE(s.titulo, '-') AS titulo_servicio,
                COALESCE(s.precio_tarifa, sol.monto_servicio) AS precio_servicio,
                s.id_proveedor AS id_proveedor_servicio,
                COALESCE(p.nombre_empresa, '-') AS nombre_proveedor,
                COALESCE(p.porcentaje_comision, 0.00) AS comision_proveedor_pct,
                COALESCE(u.nombre_completo, '-') AS nombre_asesor,
                COALESCE(u.correo_electronico, '-') AS correo_asesor
            FROM solicitudes sol
            LEFT JOIN clientes c ON sol.id_cliente = c.id_cliente
            LEFT JOIN servicios s ON sol.id_servicio = s.id_servicio
            LEFT JOIN proveedores p ON s.id_proveedor = p.id_proveedor
            LEFT JOIN usuarios u ON sol.id_asesor_asignado = u.id_usuario
            WHERE sol.id_solicitud = ?
        `, [id_solicitud]);
        return rows.length > 0 ? rows[0] : null;
    },

    // Obtener solicitudes asignadas a un asesor
    async obtenerPorAsesor(id_asesor) {
        const [rows] = await pool.query(`
            SELECT 
                sol.*,
                COALESCE(c.nombre_completo, '-') AS nombre_cliente,
                COALESCE(c.dni, '-') AS dni_cliente,
                COALESCE(c.correo_electronico, '-') AS correo_cliente,
                COALESCE(c.telefono, '-') AS telefono_cliente,
                COALESCE(s.titulo, '-') AS titulo_servicio,
                COALESCE(s.precio_tarifa, sol.monto_servicio) AS precio_servicio,
                COALESCE(p.nombre_empresa, '-') AS nombre_proveedor
            FROM solicitudes sol
            LEFT JOIN clientes c ON sol.id_cliente = c.id_cliente
            LEFT JOIN servicios s ON sol.id_servicio = s.id_servicio
            LEFT JOIN proveedores p ON s.id_proveedor = p.id_proveedor
            WHERE sol.id_asesor_asignado = ?
            ORDER BY sol.fecha_registro DESC
        `, [id_asesor]);
        return rows;
    },

    // Generar siguiente código correlativo de solicitud (SOL-001, SOL-002, etc.)
    async generarSiguienteCodigo() {
        const [rows] = await pool.query(`
            SELECT id_solicitud 
            FROM solicitudes 
            WHERE id_solicitud LIKE 'SOL-%'
            ORDER BY CAST(SUBSTRING(id_solicitud, 5) AS UNSIGNED) DESC, id_solicitud DESC 
            LIMIT 1
        `);

        if (rows.length === 0) {
            return 'SOL-001';
        }

        const ultimoCodigo = rows[0].id_solicitud;
        const match = ultimoCodigo.match(/^SOL-(\d+)$/i);
        if (match) {
            const nextNum = parseInt(match[1], 10) + 1;
            return `SOL-${nextNum.toString().padStart(3, '0')}`;
        }
        return `SOL-${Date.now().toString().slice(-4)}`;
    },

    // Registrar una nueva solicitud
    async crear(solicitudData) {
        let {
            id_solicitud,
            id_cliente,
            id_servicio,
            monto_servicio,
            notas_consulta = null,
            estado_pago = 'Pendiente',
            numero_operacion_yape = null,
            monto_pagado = null,
            id_asesor_asignado = null,
            estado_atencion = null,
            porcentaje_comision_aliado = 0.00,
            monto_comision_broker = 0.00,
            url_voucher_imagen = null
        } = solicitudData;

        if (!id_solicitud) {
            id_solicitud = await this.generarSiguienteCodigo();
        }

        if (!estado_atencion || estado_atencion === 'Nueva') {
            if (estado_pago === 'Pagado') {
                estado_atencion = id_asesor_asignado ? 'Pendiente' : 'Pendiente de Asignación';
            } else {
                estado_atencion = 'Pendiente de Validación';
            }
        }

        // Si no se proporcionaron comisiones, calcular a partir del servicio y proveedor
        if (porcentaje_comision_aliado === 0 && monto_comision_broker === 0) {
            const [servRows] = await pool.query(`
                SELECT s.precio_tarifa, p.porcentaje_comision 
                FROM servicios s 
                LEFT JOIN proveedores p ON s.id_proveedor = p.id_proveedor
                WHERE s.id_servicio = ?
            `, [id_servicio]);

            if (servRows.length > 0) {
                const s = servRows[0];
                const precio = monto_servicio || s.precio_tarifa || 0;
                const pct = s.porcentaje_comision || 0;
                porcentaje_comision_aliado = pct;
                monto_comision_broker = (precio * pct) / 100;
            }
        }

        await pool.query(
            `INSERT INTO solicitudes 
             (id_solicitud, id_cliente, id_servicio, monto_servicio, notas_consulta, 
              estado_pago, numero_operacion_yape, monto_pagado, id_asesor_asignado, 
              estado_atencion, porcentaje_comision_aliado, monto_comision_broker, url_voucher_imagen)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_solicitud, id_cliente, id_servicio, monto_servicio, notas_consulta,
                estado_pago, numero_operacion_yape, monto_pagado, id_asesor_asignado,
                estado_atencion, porcentaje_comision_aliado, monto_comision_broker, url_voucher_imagen
            ]
        );
        return id_solicitud;
    },

    // Actualizar solicitud
    async actualizar(id_solicitud, solicitudData) {
        const {
            id_cliente,
            id_servicio,
            monto_servicio,
            notas_consulta,
            estado_pago,
            numero_operacion_yape,
            monto_pagado,
            id_asesor_asignado,
            estado_atencion,
            porcentaje_comision_aliado,
            monto_comision_broker,
            conclusion_cierre,
            observaciones_asesoria,
            resultado_asesoria,
            url_voucher_imagen,
            fecha_cierre
        } = solicitudData;

        const [result] = await pool.query(
            `UPDATE solicitudes 
             SET id_cliente = COALESCE(?, id_cliente),
                 id_servicio = COALESCE(?, id_servicio),
                 monto_servicio = COALESCE(?, monto_servicio),
                 notas_consulta = COALESCE(?, notas_consulta),
                 estado_pago = COALESCE(?, estado_pago),
                 numero_operacion_yape = COALESCE(?, numero_operacion_yape),
                 monto_pagado = COALESCE(?, monto_pagado),
                 id_asesor_asignado = ?,
                 estado_atencion = COALESCE(?, estado_atencion),
                 porcentaje_comision_aliado = COALESCE(?, porcentaje_comision_aliado),
                 monto_comision_broker = COALESCE(?, monto_comision_broker),
                 conclusion_cierre = COALESCE(?, conclusion_cierre),
                 observaciones_asesoria = COALESCE(?, observaciones_asesoria),
                 resultado_asesoria = COALESCE(?, resultado_asesoria),
                 url_voucher_imagen = COALESCE(?, url_voucher_imagen),
                 fecha_cierre = COALESCE(?, fecha_cierre)
             WHERE id_solicitud = ?`,
            [
                id_cliente, id_servicio, monto_servicio, notas_consulta,
                estado_pago, numero_operacion_yape, monto_pagado, id_asesor_asignado,
                estado_atencion, porcentaje_comision_aliado, monto_comision_broker,
                conclusion_cierre, observaciones_asesoria, resultado_asesoria,
                url_voucher_imagen, fecha_cierre, id_solicitud
            ]
        );
        return result.affectedRows > 0;
    },

    // Asignar asesor a la solicitud
    async asignarAsesor(id_solicitud, id_asesor) {
        const [result] = await pool.query(
            `UPDATE solicitudes 
             SET id_asesor_asignado = ?,
                 estado_atencion = CASE 
                     WHEN estado_atencion IN ('Nueva', 'Pendiente de Asignación', 'Pendiente de Asignacion', 'Pendiente de Validación', 'Pendiente de Validacion', 'Pendiente de Validación de Pago', 'Pendiente de Validacion de Pago', 'Pendiente de Cobranza') THEN 'Pendiente' 
                     ELSE estado_atencion 
                 END
             WHERE id_solicitud = ?`,
            [id_asesor, id_solicitud]
        );
        return result.affectedRows > 0;
    },

    // Cambiar estado de atención
    async cambiarEstado(id_solicitud, estado_atencion) {
        const [result] = await pool.query(
            'UPDATE solicitudes SET estado_atencion = ? WHERE id_solicitud = ?',
            [estado_atencion, id_solicitud]
        );
        return result.affectedRows > 0;
    },

    // Registrar sesión de asesoría
    async registrarSesion(id_solicitud, { observaciones_asesoria, resultado_asesoria }) {
        const [result] = await pool.query(
            `UPDATE solicitudes 
             SET observaciones_asesoria = ?, 
                 resultado_asesoria = ?, 
                 estado_atencion = 'Atendida'
             WHERE id_solicitud = ?`,
            [observaciones_asesoria, resultado_asesoria, id_solicitud]
        );
        return result.affectedRows > 0;
    },

    // Cerrar solicitud formalmente
    async cerrarSolicitud(id_solicitud, { conclusion_cierre, estado_atencion = 'Finalizada' }) {
        const isNula = estado_atencion === 'Nula / Abandonada';
        const [result] = await pool.query(
            `UPDATE solicitudes 
             SET conclusion_cierre = ?,
                 estado_atencion = ?,
                 monto_comision_broker = CASE WHEN ? = 1 THEN 0.00 ELSE monto_comision_broker END,
                 fecha_cierre = CURRENT_TIMESTAMP
             WHERE id_solicitud = ?`,
            [conclusion_cierre, estado_atencion, isNula ? 1 : 0, id_solicitud]
        );
        return result.affectedRows > 0;
    },

    // Validar pago
    async validarPago(id_solicitud, { estado_pago, monto_pagado, numero_operacion_yape }) {
        const isPagado = estado_pago === 'Pagado';
        const isRechazado = estado_pago === 'Rechazado';

        const [result] = await pool.query(
            `UPDATE solicitudes 
             SET estado_pago = ?,
                 monto_pagado = COALESCE(?, monto_pagado, monto_servicio),
                 numero_operacion_yape = COALESCE(?, numero_operacion_yape),
                 fecha_pago_validado = ${isPagado ? 'CURRENT_TIMESTAMP' : 'NULL'},
                 estado_atencion = CASE 
                     WHEN ${isPagado ? '1=1' : '1=0'} AND (id_asesor_asignado IS NULL OR id_asesor_asignado = 0) THEN 'Pendiente de Asignación'
                     WHEN ${isPagado ? '1=1' : '1=0'} AND id_asesor_asignado IS NOT NULL AND id_asesor_asignado > 0 THEN 'En Proceso'
                     WHEN ${isRechazado ? '1=1' : '1=0'} THEN 'Pago Rechazado'
                     ELSE estado_atencion
                 END
             WHERE id_solicitud = ?`,
            [estado_pago, monto_pagado, numero_operacion_yape, id_solicitud]
        );
        return result.affectedRows > 0;
    },

    // Eliminar solicitud
    async eliminar(id_solicitud) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            // 1. Eliminar citas asociadas a la solicitud
            await connection.query('DELETE FROM citas WHERE id_solicitud = ?', [id_solicitud]);
            // 2. Eliminar la solicitud
            const [result] = await connection.query('DELETE FROM solicitudes WHERE id_solicitud = ?', [id_solicitud]);
            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = SolicitudModel;
