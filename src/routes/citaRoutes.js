const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');

// Rutas para /api/citas
router.get('/', citaController.getCitas);
router.get('/:id', citaController.getCitaById);
router.post('/', citaController.createCita);
router.put('/:id', citaController.updateCita);
router.patch('/:id/estado', citaController.cambiarEstado);
router.patch('/:id/atencion', citaController.registrarAtencion);
router.delete('/:id', citaController.deleteCita);

module.exports = router;
