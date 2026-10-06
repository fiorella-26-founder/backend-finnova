const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');

// Rutas para /api/servicios
router.get('/publicos', servicioController.getServiciosPublicos);
router.get('/', servicioController.getServicios);
router.get('/:id', servicioController.getServicioById);
router.post('/', servicioController.createServicio);
router.put('/:id', servicioController.updateServicio);
router.patch('/:id/estado', servicioController.cambiarEstado);
router.delete('/:id', servicioController.deleteServicio);

module.exports = router;

