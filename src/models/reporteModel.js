const pool = require('../config/db');

const ReporteModel = {
    // 1. Obtener métricas y KPIs globales del sistema
    async obtenerMetricasGlobales(filtros = {}) {
        const { fecha_inicio, fecha_fin } = filtros;
        let whereSol = 'WHERE 1=1';
        let paramsSol = [];

        if (fecha_inicio) {
            whereSol += ' AND sol.fecha_registro >= ?';
            paramsSol.push(`${fecha_inicio} 00:00:00`);
        }
        if (fecha_fin) {
            whereSol += ' AND sol.fecha_registro <= ?';
            paramsSol.push(`${fecha_fin} 23:59:59`);
        }

        // Métricas de Solicitudes y Comisiones
        const [solStats] = await pool.query(`
            SELECT 
                COUNT(*) AS total_solicitudes,
                SUM(CASE WHEN sol.estado_atencion = 'Finalizada' THEN 1 ELSE 0 END) AS solicitudes_finalizadas,
                SUM(CASE WHEN sol.estado_atencion = 'Atendida' THEN 1 ELSE 0 END) AS solicitudes_atendidas,
                SUM(CASE WHEN sol.estado_atencion = 'En Proceso' THEN 1 ELSE 0 END) AS solicitudes_en_proceso,
                SUM(CASE WHEN sol.estado_atencion LIKE '%Pendiente%' OR sol.estado_atencion = 'Nueva' THEN 1 ELSE 0 END) AS solicitudes_pendientes,
                SUM(CASE WHEN sol.estado_pago = 'Pagado' THEN 1 ELSE 0 END) AS pagos_validados,
                COALESCE(SUM(CASE WHEN sol.estado_pago = 'Pagado' THEN sol.monto_pagado ELSE 0 END), 0) AS total_recaudado,
                COALESCE(SUM(CASE WHEN sol.estado_atencion IN ('Finalizada', 'Atendida') AND sol.estado_pago = 'Pagado' THEN sol.monto_comision_broker ELSE sol.monto_comision_broker END), 0) AS comisiones_ganadas_broker
            FROM solicitudes sol
            ${whereSol}
        `, paramsSol);

        // Métricas de Servicios
        const [servStats] = await pool.query(`
            SELECT 
                COUNT(*) AS total_servicios,
                SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) AS servicios_activos,
                COUNT(DISTINCT categoria) AS total_categorias
            FROM servicios
        `);

        // Métricas de Campañas
        const [campStats] = await pool.query(`
            SELECT 
                COUNT(*) AS total_campanias,
                SUM(CASE WHEN estado = 'Activa' THEN 1 ELSE 0 END) AS campanias_activas,
                SUM(CASE WHEN estado = 'Inactiva' OR estado = 'Borrador' THEN 1 ELSE 0 END) AS campanias_inactivas
            FROM campanias
        `);

        // Métricas de Clientes
        const [cliStats] = await pool.query(`
            SELECT 
                COUNT(*) AS total_clientes,
                SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) AS clientes_activos
            FROM clientes
        `);

        // Métricas de Proveedores Aliados
        const [provStats] = await pool.query(`
            SELECT 
                COUNT(*) AS total_proveedores,
                COALESCE(AVG(porcentaje_comision), 0) AS promedio_comision_aliados
            FROM proveedores
            WHERE estado = 'Activo'
        `);

        // Métricas de Citas
        const [citaStats] = await pool.query(`
            SELECT 
                COUNT(*) AS total_citas,
                SUM(CASE WHEN estado = 'Realizada' THEN 1 ELSE 0 END) AS citas_realizadas,
                SUM(CASE WHEN estado = 'Programada' THEN 1 ELSE 0 END) AS citas_programadas
            FROM citas
        `);

        return {
            solicitudes: solStats[0] || {},
            servicios: servStats[0] || {},
            campanias: campStats[0] || {},
            clientes: cliStats[0] || {},
            proveedores: provStats[0] || {},
            citas: citaStats[0] || {}
        };
    },

    // 2. Reporte de Comisiones por Solicitudes
    async obtenerReporteComisiones(filtros = {}) {
        const { fecha_inicio, fecha_fin, estado_atencion } = filtros;
        let where = 'WHERE 1=1';
        let params = [];

        if (fecha_inicio) {
            where += ' AND sol.fecha_registro >= ?';
            params.push(`${fecha_inicio} 00:00:00`);
        }
        if (fecha_fin) {
            where += ' AND sol.fecha_registro <= ?';
            params.push(`${fecha_fin} 23:59:59`);
        }
        if (estado_atencion && estado_atencion !== 'Todos') {
            where += ' AND sol.estado_atencion = ?';
            params.push(estado_atencion);
        }

        const [rows] = await pool.query(`
            SELECT 
                sol.id_solicitud,
                sol.fecha_registro,
                sol.fecha_cierre,
                sol.monto_servicio,
                sol.monto_pagado,
                sol.estado_pago,
                sol.estado_atencion,
                sol.porcentaje_comision_aliado,
                sol.monto_comision_broker,
                COALESCE(c.nombre_completo, '-') AS nombre_cliente,
                COALESCE(c.dni, '-') AS dni_cliente,
                COALESCE(s.titulo, '-') AS titulo_servicio,
                COALESCE(s.categoria, '-') AS categoria_servicio,
                COALESCE(p.nombre_empresa, '-') AS nombre_proveedor,
                COALESCE(u.nombre_completo, '-') AS nombre_asesor
            FROM solicitudes sol
            LEFT JOIN clientes c ON sol.id_cliente = c.id_cliente
            LEFT JOIN servicios s ON sol.id_servicio = s.id_servicio
            LEFT JOIN proveedores p ON s.id_proveedor = p.id_proveedor
            LEFT JOIN usuarios u ON sol.id_asesor_asignado = u.id_usuario
            ${where}
            ORDER BY sol.fecha_registro DESC
        `, params);

        return rows;
    },

    // 3. Reporte de Ganancias Acumuladas por Periodo (Semana o Mes)
    async obtenerGananciasPorPeriodo(agrupacion = 'mes', filtros = {}) {
        const { fecha_inicio, fecha_fin } = filtros;
        let where = 'WHERE 1=1';
        let params = [];

        if (fecha_inicio) {
            where += ' AND sol.fecha_registro >= ?';
            params.push(`${fecha_inicio} 00:00:00`);
        }
        if (fecha_fin) {
            where += ' AND sol.fecha_registro <= ?';
            params.push(`${fecha_fin} 23:59:59`);
        }

        let formatoPeriodo = agrupacion === 'semana'
            ? "CONCAT('Semana ', YEARWEEK(sol.fecha_registro, 1))"
            : "DATE_FORMAT(sol.fecha_registro, '%Y-%m')";

        const [rows] = await pool.query(`
            SELECT 
                ${formatoPeriodo} AS periodo,
                COUNT(*) AS total_solicitudes,
                SUM(CASE WHEN sol.estado_atencion IN ('Finalizada', 'Atendida') THEN 1 ELSE 0 END) AS solicitudes_exitosas,
                COALESCE(SUM(sol.monto_servicio), 0) AS monto_total_solicitado,
                COALESCE(SUM(CASE WHEN sol.estado_pago = 'Pagado' THEN sol.monto_pagado ELSE 0 END), 0) AS total_recaudado,
                COALESCE(SUM(sol.monto_comision_broker), 0) AS comisiones_broker
            FROM solicitudes sol
            ${where}
            GROUP BY periodo
            ORDER BY periodo ASC
        `, params);

        return rows;
    },

    // 4. Reporte de Rendimiento por Servicio Financiero
    async obtenerRendimientoServicios(filtros = {}) {
        const { fecha_inicio, fecha_fin } = filtros;
        let where = 'WHERE 1=1';
        let params = [];

        if (fecha_inicio) {
            where += ' AND sol.fecha_registro >= ?';
            params.push(`${fecha_inicio} 00:00:00`);
        }
        if (fecha_fin) {
            where += ' AND sol.fecha_registro <= ?';
            params.push(`${fecha_fin} 23:59:59`);
        }

        const [rows] = await pool.query(`
            SELECT 
                s.id_servicio,
                s.titulo,
                s.categoria,
                s.precio_tarifa,
                s.estado AS estado_servicio,
                COALESCE(p.nombre_empresa, '-') AS nombre_proveedor,
                COUNT(sol.id_solicitud) AS total_solicitudes,
                SUM(CASE WHEN sol.estado_atencion IN ('Finalizada', 'Atendida') THEN 1 ELSE 0 END) AS solicitudes_exitosas,
                COALESCE(SUM(CASE WHEN sol.estado_pago = 'Pagado' THEN sol.monto_pagado ELSE 0 END), 0) AS total_recaudado,
                COALESCE(SUM(sol.monto_comision_broker), 0) AS total_comisiones_broker
            FROM servicios s
            LEFT JOIN proveedores p ON s.id_proveedor = p.id_proveedor
            LEFT JOIN solicitudes sol ON s.id_servicio = sol.id_servicio
            ${where}
            GROUP BY s.id_servicio, s.titulo, s.categoria, s.precio_tarifa, s.estado, p.nombre_empresa
            ORDER BY total_solicitudes DESC
        `, params);

        return rows;
    },

    // 5. Reporte de Desempeño por Asesor
    async obtenerDesempenoAsesores(filtros = {}) {
        const { fecha_inicio, fecha_fin } = filtros;
        let where = 'WHERE u.id_rol = 2';
        let params = [];

        let andSol = '';
        if (fecha_inicio) {
            andSol += ' AND sol.fecha_registro >= ?';
            params.push(`${fecha_inicio} 00:00:00`);
        }
        if (fecha_fin) {
            andSol += ' AND sol.fecha_registro <= ?';
            params.push(`${fecha_fin} 23:59:59`);
        }

        const [rows] = await pool.query(`
            SELECT 
                u.id_usuario,
                u.nombre_completo AS nombre_asesor,
                u.correo_electronico,
                u.estado AS estado_asesor,
                COUNT(DISTINCT sol.id_solicitud) AS total_solicitudes,
                SUM(CASE WHEN sol.estado_atencion = 'Finalizada' THEN 1 ELSE 0 END) AS solicitudes_finalizadas,
                SUM(CASE WHEN sol.estado_atencion = 'Atendida' THEN 1 ELSE 0 END) AS solicitudes_atendidas,
                COALESCE(SUM(CASE WHEN sol.estado_pago = 'Pagado' THEN sol.monto_pagado ELSE 0 END), 0) AS total_recaudado,
                COALESCE(SUM(sol.monto_comision_broker), 0) AS total_comisiones_generadas,
                COUNT(DISTINCT cit.id_cita) AS total_citas_asignadas,
                SUM(CASE WHEN cit.estado = 'Realizada' THEN 1 ELSE 0 END) AS citas_realizadas
            FROM usuarios u
            LEFT JOIN solicitudes sol ON u.id_usuario = sol.id_asesor_asignado ${andSol}
            LEFT JOIN citas cit ON u.id_usuario = cit.id_asesor
            ${where}
            GROUP BY u.id_usuario, u.nombre_completo, u.correo_electronico, u.estado
            ORDER BY solicitudes_finalizadas DESC, total_comisiones_generadas DESC
        `, params);

        return rows;
    },

    // 6. Reporte de Campañas de Marketing
    async obtenerReporteCampanias() {
        const [rows] = await pool.query(`
            SELECT 
                cmp.id_campana,
                cmp.titulo,
                cmp.publico_objetivo,
                cmp.categoria,
                cmp.estado,
                cmp.fecha_programada,
                cmp.fecha_creacion,
                COALESCE(s.titulo, '-') AS servicio_promovido,
                COALESCE(p.nombre_empresa, '-') AS aliado_proveedor,
                COALESCE(u.nombre_completo, '-') AS usuario_creador
            FROM campanias cmp
            LEFT JOIN servicios s ON cmp.id_servicio = s.id_servicio
            LEFT JOIN proveedores p ON cmp.id_proveedor = p.id_proveedor
            LEFT JOIN usuarios u ON cmp.id_usuario_creador = u.id_usuario
            ORDER BY cmp.fecha_creacion DESC
        `);

        return rows;
    }
};

module.exports = ReporteModel;
