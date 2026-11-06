const express = require('express');
const router = express.Router();
const soporteCambioController = require('../controllers/soporteCambioController');

// Endpoints de Bandeja de Mesa de Ayuda (Semana 10) y Control de Cambios por Dimensión (Semana 11)
router.get('/', soporteCambioController.obtenerTodos);
router.get('/metricas', soporteCambioController.obtenerMetricas);
router.post('/', soporteCambioController.crearTicket);
router.patch('/:id/calificar', soporteCambioController.calificarTicket);
router.put('/:id', soporteCambioController.calificarTicket);
router.delete('/:id', soporteCambioController.eliminarTicket);

module.exports = router;
