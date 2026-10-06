const express = require('express');
const router = express.Router();
const campaniaController = require('../controllers/campaniaController');

// Rutas para /api/campanias
router.get('/', campaniaController.getCampanias);
router.get('/:id', campaniaController.getCampaniaById);
router.post('/', campaniaController.createCampania);
router.put('/:id', campaniaController.updateCampania);
router.patch('/:id/estado', campaniaController.cambiarEstado);
router.delete('/:id', campaniaController.deleteCampania);

module.exports = router;
