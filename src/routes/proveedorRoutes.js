const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

// Rutas para /api/proveedores
router.get('/', proveedorController.getProveedores);
router.get('/:id', proveedorController.getProveedorById);
router.post('/', proveedorController.createProveedor);
router.put('/:id', proveedorController.updateProveedor);
router.patch('/:id/estado', proveedorController.cambiarEstado);
router.delete('/:id', proveedorController.deleteProveedor);

module.exports = router;
