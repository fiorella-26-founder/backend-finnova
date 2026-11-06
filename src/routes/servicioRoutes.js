const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const { cacheMiddleware } = require('../middlewares/cacheMiddleware');

// Rutas para /api/servicios optimizadas con Caché en Memoria 
router.get('/publicos', cacheMiddleware(300), servicioController.getServiciosPublicos);
router.get('/', cacheMiddleware(300), servicioController.getServicios);
router.get('/:id', cacheMiddleware(300), servicioController.getServicioById);


router.post('/', servicioController.createServicio);
router.put('/:id', servicioController.updateServicio);
router.patch('/:id/estado', servicioController.cambiarEstado);
router.delete('/:id', servicioController.deleteServicio);

module.exports = router;


