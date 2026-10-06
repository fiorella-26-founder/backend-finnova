const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Endpoints CRUD para Gestión de Usuarios
router.get('/', usuarioController.getUsuarios);
router.get('/:id', usuarioController.getUsuarioById);
router.post('/', usuarioController.createUsuario);
router.put('/:id', usuarioController.updateUsuario);
router.patch('/:id/estado', usuarioController.cambiarEstado);
router.delete('/:id', usuarioController.deleteUsuario);

module.exports = router;