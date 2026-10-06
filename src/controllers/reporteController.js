const ReporteModel = require('../models/reporteModel');

const reporteController = {
    // GET /api/reportes/dashboard
    async getDashboardMetrics(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            const metricas = await ReporteModel.obtenerMetricasGlobales({ fecha_inicio, fecha_fin });
            res.json(metricas);
        } catch (error) {
            console.error('Error al obtener métricas del dashboard:', error);
            res.status(500).json({ error: 'Error al consultar métricas de reportería', mensaje: 'Error al consultar métricas' });
        }
    },

    // GET /api/reportes/comisiones
    async getReporteComisiones(req, res) {
        try {
            const { fecha_inicio, fecha_fin, estado_atencion } = req.query;
            const reporte = await ReporteModel.obtenerReporteComisiones({ fecha_inicio, fecha_fin, estado_atencion });
            res.json(reporte);
        } catch (error) {
            console.error('Error al obtener reporte de comisiones:', error);
            res.status(500).json({ error: 'Error al consultar reporte de comisiones', mensaje: 'Error al consultar reporte de comisiones' });
        }
    },

    // GET /api/reportes/ganancias
    async getGananciasHistoricas(req, res) {
        try {
            const { agrupacion = 'mes', fecha_inicio, fecha_fin } = req.query;
            const reporte = await ReporteModel.obtenerGananciasPorPeriodo(agrupacion, { fecha_inicio, fecha_fin });
            res.json(reporte);
        } catch (error) {
            console.error('Error al obtener reporte de ganancias:', error);
            res.status(500).json({ error: 'Error al consultar ganancias históricas', mensaje: 'Error al consultar ganancias' });
        }
    },

    // GET /api/reportes/servicios
    async getRendimientoServicios(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            const reporte = await ReporteModel.obtenerRendimientoServicios({ fecha_inicio, fecha_fin });
            res.json(reporte);
        } catch (error) {
            console.error('Error al obtener rendimiento de servicios:', error);
            res.status(500).json({ error: 'Error al consultar rendimiento de servicios', mensaje: 'Error al consultar servicios' });
        }
    },

    // GET /api/reportes/asesores
    async getDesempenoAsesores(req, res) {
        try {
            const { fecha_inicio, fecha_fin } = req.query;
            const reporte = await ReporteModel.obtenerDesempenoAsesores({ fecha_inicio, fecha_fin });
            res.json(reporte);
        } catch (error) {
            console.error('Error al obtener desempeño de asesores:', error);
            res.status(500).json({ error: 'Error al consultar desempeño de asesores', mensaje: 'Error al consultar asesores' });
        }
    },

    // GET /api/reportes/campanias
    async getReporteCampanias(req, res) {
        try {
            const reporte = await ReporteModel.obtenerReporteCampanias();
            res.json(reporte);
        } catch (error) {
            console.error('Error al obtener reporte de campañas:', error);
            res.status(500).json({ error: 'Error al consultar reporte de campañas', mensaje: 'Error al consultar campañas' });
        }
    }
};

module.exports = reporteController;
