const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'finnova_secret_jwt_token_key_2026';

const authMiddleware = {
    // Middleware para verificar la validez del token JWT
    verificarToken(req, res, next) {
        try {
            const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
            if (!authHeader) {
                return res.status(401).json({ error: 'Acceso denegado: Token de autenticación no proporcionado' });
            }

            const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader;

            const decoded = jwt.verify(token, JWT_SECRET);
            req.usuario = decoded;
            next();
        } catch (error) {
            console.error('Error al verificar token:', error.message);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'El token de sesión ha expirado, por favor inicia sesión nuevamente' });
            }
            return res.status(403).json({ error: 'Token inválido o no autorizado' });
        }
    },

    // Middleware para verificar roles permitidos (ej. 'Administrador', 'Asesor', 1, 2, etc.)
    verificarRol(...rolesPermitidos) {
        return (req, res, next) => {
            if (!req.usuario) {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }

            const rol = req.usuario.rol ? String(req.usuario.rol).toLowerCase() : '';
            const idRol = req.usuario.id_rol !== undefined ? Number(req.usuario.id_rol) : null;

            const tienePermiso = rolesPermitidos.some(r => {
                if (typeof r === 'string') {
                    const rLower = r.toLowerCase();
                    if (rol === rLower) return true;
                    if (!isNaN(Number(r)) && idRol !== null && Number(r) === idRol) return true;
                } else if (typeof r === 'number') {
                    if (idRol !== null && r === idRol) return true;
                }
                return false;
            });

            if (!tienePermiso) {
                return res.status(403).json({
                    error: `Acceso restringido: Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`
                });
            }

            next();
        };
    }
};

module.exports = authMiddleware;
