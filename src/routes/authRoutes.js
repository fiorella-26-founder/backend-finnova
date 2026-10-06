const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);

// Rutas protegidas por token
router.get('/perfil', authMiddleware.verificarToken, authController.perfil);
router.patch('/cambiar-password', authMiddleware.verificarToken, authController.cambiarPassword);
router.get('/usuarios', authMiddleware.verificarToken, authMiddleware.verificarRol('Administrador'), authController.getUsuarios);

module.exports = router;
