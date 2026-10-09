const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas para /api/solicitudes
router.get('/', authMiddleware.verificarTokenOpcional, solicitudController.getSolicitudes);
router.get('/:id', authMiddleware.verificarTokenOpcional, solicitudController.getSolicitudById);
router.post('/', solicitudController.createSolicitud);
router.put('/:id', solicitudController.updateSolicitud);
router.patch('/:id/asignar-asesor', solicitudController.asignarAsesor);
router.patch('/:id/estado', solicitudController.cambiarEstado);
router.patch('/:id/sesion-asesoria', solicitudController.registrarSesion);
router.patch('/:id/cerrar', solicitudController.cerrarSolicitud);
router.patch('/:id/validar-pago', solicitudController.validarPago);
router.delete('/:id', authMiddleware.verificarToken, authMiddleware.verificarRol('Administrador', 1), solicitudController.deleteSolicitud);

module.exports = router;
