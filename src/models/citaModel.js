const pool = require('../config/db');

const CitaModel = {
    // Obtener todas las citas con datos de cliente, asesor y servicio
    async obtenerTodas() {
        const [rows] = await pool.query(`
            SELECT 
                cit.id_cita,
                cit.id_solicitud,
                cit.id_cliente,
                cit.id_asesor,
                cit.fecha_hora,
                cit.modalidad,
                cit.lugar_o_enlace,
                cit.estado,
                COALESCE(cit.indicaciones_previas, '-') AS indicaciones_previas,
                COALESCE(cit.observaciones_atencion, '-') AS observaciones_atencion,
                COALESCE(cit.resultados_acuerdos, '-') AS resultados_acuerdos,
                cit.fecha_registro,
                COALESCE(c.nombre_completo, '-') AS nombre_cliente,
                COALESCE(c.dni, '-') AS dni_cliente,
                COALESCE(c.correo_electronico, '-') AS correo_cliente,
                COALESCE(c.telefono, '-') AS telefono_cliente,
                COALESCE(u.nombre_completo, '-') AS nombre_asesor,
                COALESCE(u.correo_electronico, '-') AS correo_asesor,
                sol.id_servicio,
                COALESCE(s.titulo, '-') AS titulo_servicio
            FROM citas cit
            LEFT JOIN clientes c ON cit.id_cliente = c.id_cliente
            LEFT JOIN usuarios u ON cit.id_asesor = u.id_usuario
            LEFT JOIN solicitudes sol ON cit.id_solicitud = sol.id_solicitud
            LEFT JOIN servicios s ON sol.id_servicio = s.id_servicio
            ORDER BY cit.fecha_hora DESC
        `);
        return rows;
    },

    // Obtener citas asignadas a un asesor
    async obtenerPorAsesor(id_asesor) {
        const [rows] = await pool.query(`
            SELECT 
                cit.id_cita,
                cit.id_solicitud,
                cit.id_cliente,
                cit.id_asesor,
                cit.fecha_hora,
                cit.modalidad,
                cit.lugar_o_enlace,
                cit.estado,
                COALESCE(cit.indicaciones_previas, '-') AS indicaciones_previas,
                COALESCE(cit.observaciones_atencion, '-') AS observaciones_atencion,
                COALESCE(cit.resultados_acuerdos, '-') AS resultados_acuerdos,
                cit.fecha_registro,
                COALESCE(c.nombre_completo, '-') AS nombre_cliente,
                COALESCE(c.dni, '-') AS dni_cliente,
                COALESCE(c.correo_electronico, '-') AS correo_cliente,
                COALESCE(c.telefono, '-') AS telefono_cliente,
                COALESCE(u.nombre_completo, '-') AS nombre_asesor,
                COALESCE(u.correo_electronico, '-') AS correo_asesor,
                sol.id_servicio,
                COALESCE(s.titulo, '-') AS titulo_servicio
            FROM citas cit
            LEFT JOIN clientes c ON cit.id_cliente = c.id_cliente
            LEFT JOIN usuarios u ON cit.id_asesor = u.id_usuario
            LEFT JOIN solicitudes sol ON cit.id_solicitud = sol.id_solicitud
            LEFT JOIN servicios s ON sol.id_servicio = s.id_servicio
            WHERE cit.id_asesor = ?
            ORDER BY cit.fecha_hora DESC
        `, [id_asesor]);
        return rows;
    },

    // Obtener citas pertenecientes a un cliente (por id_usuario o id_cliente)
    async obtenerPorCliente(id_usuario) {
        const [rows] = await pool.query(`
            SELECT 
                cit.id_cita,
                cit.id_solicitud,
                cit.id_cliente,
                cit.id_asesor,
                cit.fecha_hora,
                cit.modalidad,
                cit.lugar_o_enlace,
                cit.estado,
                COALESCE(cit.indicaciones_previas, '-') AS indicaciones_previas,
                COALESCE(cit.observaciones_atencion, '-') AS observaciones_atencion,
                COALESCE(cit.resultados_acuerdos, '-') AS resultados_acuerdos,
                cit.fecha_registro,
                COALESCE(c.nombre_completo, '-') AS nombre_cliente,
                COALESCE(c.dni, '-') AS dni_cliente,
                COALESCE(c.correo_electronico, '-') AS correo_cliente,
                COALESCE(c.telefono, '-') AS telefono_cliente,
                COALESCE(u.nombre_completo, '-') AS nombre_asesor,
                COALESCE(u.correo_electronico, '-') AS correo_asesor,
                sol.id_servicio,
                COALESCE(s.titulo, '-') AS titulo_servicio
            FROM citas cit
            LEFT JOIN clientes c ON cit.id_cliente = c.id_cliente
            LEFT JOIN usuarios u ON cit.id_asesor = u.id_usuario
            LEFT JOIN solicitudes sol ON cit.id_solicitud = sol.id_solicitud
            LEFT JOIN servicios s ON sol.id_servicio = s.id_servicio
            WHERE c.id_usuario = ? OR cit.id_cliente IN (SELECT id_cliente FROM clientes WHERE id_usuario = ?)
            ORDER BY cit.fecha_hora DESC
        `, [id_usuario, id_usuario]);
        return rows;
    },

    // Obtener cita por ID
    async obtenerPorId(id_cita) {
        const [rows] = await pool.query(`
            SELECT 
                cit.id_cita,
                cit.id_solicitud,
                cit.id_cliente,
                cit.id_asesor,
                cit.fecha_hora,
                cit.modalidad,
                cit.lugar_o_enlace,
                cit.estado,
                COALESCE(cit.indicaciones_previas, '-') AS indicaciones_previas,
                COALESCE(cit.observaciones_atencion, '-') AS observaciones_atencion,
                COALESCE(cit.resultados_acuerdos, '-') AS resultados_acuerdos,
                cit.fecha_registro,
                COALESCE(c.nombre_completo, '-') AS nombre_cliente,
                COALESCE(c.dni, '-') AS dni_cliente,
                COALESCE(c.correo_electronico, '-') AS correo_cliente,
                COALESCE(c.telefono, '-') AS telefono_cliente,
                COALESCE(u.nombre_completo, '-') AS nombre_asesor,
                COALESCE(u.correo_electronico, '-') AS correo_asesor,
                sol.id_servicio,
                COALESCE(s.titulo, '-') AS titulo_servicio
            FROM citas cit
            LEFT JOIN clientes c ON cit.id_cliente = c.id_cliente
            LEFT JOIN usuarios u ON cit.id_asesor = u.id_usuario
            LEFT JOIN solicitudes sol ON cit.id_solicitud = sol.id_solicitud
            LEFT JOIN servicios s ON sol.id_servicio = s.id_servicio
            WHERE cit.id_cita = ?
        `, [id_cita]);
        return rows[0] || null;
    },

    // Generar siguiente código de cita CIT-001, CIT-002, etc.
    async generarSiguienteCodigo() {
        const [rows] = await pool.query(`
            SELECT id_cita 
            FROM citas 
            WHERE id_cita LIKE 'CIT-%'
            ORDER BY id_cita DESC 
            LIMIT 1
        `);

        if (rows.length === 0) {
            return 'CIT-001';
        }

        const match = rows[0].id_cita.match(/CIT-(\d+)/);
        if (match) {
            const nextNum = parseInt(match[1], 10) + 1;
            return `CIT-${nextNum.toString().padStart(3, '0')}`;
        }
        return `CIT-${Date.now().toString().slice(-4)}`;
    },

    // Crear cita
    async crear(citaData) {
        let {
            id_cita,
            id_solicitud,
            id_cliente,
            id_asesor,
            fecha_hora,
            modalidad = 'Virtual',
            lugar_o_enlace = 'https://meet.google.com/finnova-asesoria',
            estado = 'Programada',
            indicaciones_previas = null
        } = citaData;

        if (!id_cita) {
            id_cita = await this.generarSiguienteCodigo();
        }

        await pool.query(
            `INSERT INTO citas 
             (id_cita, id_solicitud, id_cliente, id_asesor, fecha_hora, modalidad, lugar_o_enlace, estado, indicaciones_previas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id_cita, id_solicitud, id_cliente, id_asesor, fecha_hora, modalidad, lugar_o_enlace, estado, indicaciones_previas]
        );

        // Si la solicitud estaba en 'Nueva' o 'Pendiente', actualizar su estado a 'En Proceso'
        if (id_solicitud) {
            await pool.query(
                `UPDATE solicitudes 
                 SET estado_atencion = 'En Proceso',
                     id_asesor_asignado = COALESCE(id_asesor_asignado, ?)
                 WHERE id_solicitud = ?`,
                [id_asesor, id_solicitud]
            );
        }

        return id_cita;
    },

    // Actualizar cita
    async actualizar(id_cita, citaData) {
        const {
            id_solicitud,
            id_cliente,
            id_asesor,
            fecha_hora,
            modalidad,
            lugar_o_enlace,
            estado,
            indicaciones_previas,
            observaciones_atencion,
            resultados_acuerdos
        } = citaData;

        const [result] = await pool.query(
            `UPDATE citas 
             SET id_solicitud = COALESCE(?, id_solicitud),
                 id_cliente = COALESCE(?, id_cliente),
                 id_asesor = COALESCE(?, id_asesor),
                 fecha_hora = COALESCE(?, fecha_hora),
                 modalidad = COALESCE(?, modalidad),
                 lugar_o_enlace = COALESCE(?, lugar_o_enlace),
                 estado = COALESCE(?, estado),
                 indicaciones_previas = COALESCE(?, indicaciones_previas),
                 observaciones_atencion = COALESCE(?, observaciones_atencion),
                 resultados_acuerdos = COALESCE(?, resultados_acuerdos)
             WHERE id_cita = ?`,
            [id_solicitud, id_cliente, id_asesor, fecha_hora, modalidad, lugar_o_enlace, estado, indicaciones_previas, observaciones_atencion, resultados_acuerdos, id_cita]
        );
        return result.affectedRows > 0;
    },

    // Cambiar estado de cita
    async cambiarEstado(id_cita, estado) {
        const [result] = await pool.query(
            'UPDATE citas SET estado = ? WHERE id_cita = ?',
            [estado, id_cita]
        );
        return result.affectedRows > 0;
    },

    // Registrar atención de cita (y sincronizar con solicitud vinculada)
    async registrarAtencion(id_cita, { observaciones_atencion, resultados_acuerdos }) {
        const [result] = await pool.query(
            `UPDATE citas 
             SET observaciones_atencion = ?,
                 resultados_acuerdos = ?,
                 estado = 'Realizada'
             WHERE id_cita = ?`,
            [observaciones_atencion, resultados_acuerdos, id_cita]
        );

        if (result.affectedRows > 0) {
            // Sincronizar con la solicitud vinculada
            const [citaRows] = await pool.query('SELECT id_solicitud FROM citas WHERE id_cita = ?', [id_cita]);
            if (citaRows.length > 0 && citaRows[0].id_solicitud) {
                const reqId = citaRows[0].id_solicitud;
                await pool.query(
                    `UPDATE solicitudes 
                     SET observaciones_asesoria = ?,
                         resultado_asesoria = ?,
                         estado_atencion = CASE WHEN estado_atencion != 'Finalizada' THEN 'Atendida' ELSE estado_atencion END
                     WHERE id_solicitud = ?`,
                    [observaciones_atencion, resultados_acuerdos, reqId]
                );
            }
        }

        return result.affectedRows > 0;
    },

    // Eliminar cita
    async eliminar(id_cita) {
        const [result] = await pool.query(
            'DELETE FROM citas WHERE id_cita = ?',
            [id_cita]
        );
        return result.affectedRows > 0;
    }
};

module.exports = CitaModel;
