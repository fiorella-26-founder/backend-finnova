require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Importar conexión BD
require('./src/config/db');

// Rutas
const authRoutes = require('./src/routes/authRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const clienteRoutes = require('./src/routes/clienteRoutes');
const servicioRoutes = require('./src/routes/servicioRoutes');
const proveedorRoutes = require('./src/routes/proveedorRoutes');
const solicitudRoutes = require('./src/routes/solicitudRoutes');
const citaRoutes = require('./src/routes/citaRoutes');
const campaniaRoutes = require('./src/routes/campaniaRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');

const app = express();
app.set('trust proxy', 1);

// ==================================================================
// 1. CAPA DE SEGURIDAD HTTP: HELMET & CABECERAS
// ==================================================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.disable('x-powered-by');

// ==================================================================
// 2. CAPA DE CONTROL DE ACCESO DE ORIGEN: CORS CONFIGURADO
// ==================================================================
const allowedOrigins = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'http://localhost:3000',
    'https://finnova-nine.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como Postman o cURL), localhost y cualquier subdominio de Vercel
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Acceso no permitido por la política de seguridad CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
    credentials: true
}));

// ==================================================================
// 3. CAPA DE PROTECCIÓN CONTRA ATAQUES: RATE LIMITING
// ==================================================================
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Límite de solicitudes alcanzado. Por favor, intente nuevamente más tarde.', mensaje: 'Límite de solicitudes alcanzado. Por favor, intente nuevamente más tarde.' }
});
app.use('/api/', generalLimiter);

// Limitador estricto para inicio de sesión (Protección contra Ataques de Fuerza Bruta)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos de autenticación desde esta IP. Intente de nuevo en 15 minutos por seguridad.', mensaje: 'Demasiados intentos de autenticación desde esta IP. Intente de nuevo en 15 minutos por seguridad.' }
});

// Parsers (Límite de 25mb para imágenes Base64)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), message: 'API Finnova Backend segura y activa' });
});

// Endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/campanias', campaniaRoutes);
app.use('/api/reportes', reporteRoutes);

// Manejador 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada en la API de Finnova', mensaje: 'Ruta no encontrada en la API de Finnova' });
});

// ==================================================================
// 4. MANEJADOR CENTRALIZADO DE ERRORES (INFORMATION HIDING)
// ==================================================================
app.use((err, req, res, next) => {
    console.error('Error no controlado en el servidor:', err);
    res.status(err.status || 500).json({
        error: err.message && err.status ? err.message : 'Error interno del servidor. Por seguridad no se revelan detalles técnicos.',
        mensaje: err.message && err.status ? err.message : 'Error interno del servidor. Por seguridad no se revelan detalles técnicos.'
    });
});

// Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor backend Finnova corriendo de forma segura en http://localhost:${PORT}`);
});