const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

// Rutas para /api/reportes
router.get('/dashboard', reporteController.getDashboardMetrics);
router.get('/comisiones', reporteController.getReporteComisiones);
router.get('/ganancias', reporteController.getGananciasHistoricas);
router.get('/servicios', reporteController.getRendimientoServicios);
router.get('/asesores', reporteController.getDesempenoAsesores);
router.get('/campanias', reporteController.getReporteCampanias);

module.exports = router;
