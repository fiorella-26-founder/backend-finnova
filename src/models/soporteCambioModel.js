const pool = require('../config/db');

const INITIAL_TICKETS_SEED = [
    // =========================================================================
    // INCIDENTES CRÍTICOS Y OPERATIVOS FINNOVA (SEMANA 14 - ITIL 4 & SLA)
    // =========================================================================
    {
        id_ticket: 'INC-2026-001',
        codigo_jira: 'INC-TI-101',
        titulo: '[P1-CRÍTICO] Saturación de conexiones SSL TiDB Cloud durante validación concurrente de pagos Yape',
        descripcion: 'Agotamiento del pool de conexiones SSL/TLS hacia TiDB Cloud AWS ante ráfaga de 50 transacciones concurrentes de validación de comprobantes Yape, arrojando excepciones ER_CON_COUNT_ERROR y denegación de servicio a clientes.',
        tipo_solicitud: 'Incidente Técnico',
        solicitante_nombre: 'Ing. Carlos Mendoza (Soporte TI)',
        solicitante_rol: 'Soporte TI',
        prioridad: 'Crítica',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Infraestructura',
        tipo_cambio_itil: 'Normal (CHN)',
        estado: 'Completado',
        componente_afectado: 'TiDB Cloud Serverless / Pool de Conexiones',
        ventana_calendarizacion: 'Pase ejecutado en Ventana FSC Dom 01:00 AM',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md#PASE-BE-2026-02',
        plan_rollback: 'Restaurar pool previo connectionLimit: 5 y reiniciar contenedor Render.',
        resolucion_tecnica: 'Workaround estabilizó servicio en 25 min (MTTA: 8m, MTTR: 1.2h). Escala a RFC FCC-102.'
    },
    {
        id_ticket: 'INC-2026-002',
        codigo_jira: 'INC-TI-102',
        titulo: '[P1-CRÍTICO] Bloqueo masivo HTTP 429 en login de asesores y pasarela por proxy inverso Render',
        descripcion: 'El balanceador de carga de Render enmascaraba las IPs de origen de todos los asesores y clientes bajo una única IP interna compartida, disparando el middleware express-rate-limit y bloqueando el acceso general al sistema.',
        tipo_solicitud: 'Incidente Técnico',
        solicitante_nombre: 'Juan Pérez (Asesor)',
        solicitante_rol: 'Asesor',
        prioridad: 'Crítica',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Infraestructura',
        tipo_cambio_itil: 'Emergencia (CHE)',
        estado: 'Completado',
        componente_afectado: 'Backend Express / Rate Limiting',
        ventana_calendarizacion: 'Hotfix Inmediato eCAB (18/10/2026)',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md#PASE-BE-2026-01',
        plan_rollback: 'Rollback to previous deploy en consola Render (RTO < 3 min).',
        resolucion_tecnica: 'Resuelto con Pase de Emergencia FCC-101. MTTA: 10m, MTTR: 45m.'
    },
    {
        id_ticket: 'INC-2026-003',
        codigo_jira: 'INC-TI-103',
        titulo: '[P2-ALTO] Timeout HTTP 504 en carga de catálogo por Cold Start prolongado (>55s) en Render Free Tier',
        descripcion: 'Tras 15 minutos de inactividad, el contenedor de Render se suspende. Al ingresar un cliente a la landing page o solicitar servicio, el tiempo de arranque frío excedía los 50 segundos, generando aborto de petición en el frontend Angular.',
        tipo_solicitud: 'Incidente Técnico',
        solicitante_nombre: 'María López (Cliente)',
        solicitante_rol: 'Cliente',
        prioridad: 'Alta',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Calendario',
        tipo_cambio_itil: 'Estándar (CHS)',
        estado: 'Completado',
        componente_afectado: 'Cronograma Automatizado / scripts/keepAlive.js',
        ventana_calendarizacion: 'Pase Estándar FCC-110 (Lunes a Sábado 08:00 - 22:00 h)',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md#PASE-BE-2026-03',
        plan_rollback: 'Detener proceso cron keepAlive.js en caso de saturar cuota mensual.',
        resolucion_tecnica: 'Se implementó Cron Job keepAlive.js ping cada 10 min. Cold start erradicado (latencia actual: 180ms). MTTA: 18m, MTTR: 3.5h.'
    },
    {
        id_ticket: 'INC-2026-004',
        codigo_jira: 'INC-TI-104',
        titulo: '[P3-MEDIO] Error 413 Payload Too Large al adjuntar voucher Yape en alta resolución (>3MB) desde móvil',
        descripcion: 'Clientes reportan imposibilidad de finalizar su solicitud de crédito cuando la fotografía del voucher tomada con cámara de 48MP genera un string Base64 superior a 3.5MB, superando el límite express.json({ limit: "2mb" }).',
        tipo_solicitud: 'Incidente Técnico',
        solicitante_nombre: 'Juan Pérez (Asesor)',
        solicitante_rol: 'Asesor',
        prioridad: 'Media',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Aplicaciones y BD',
        tipo_cambio_itil: 'Normal (CHN)',
        estado: 'En Proceso',
        componente_afectado: 'Frontend Angular (Vercel) / Compresión de Vouchers',
        ventana_calendarizacion: 'Ventana FSC Próximo Domingo 01:00 AM',
        doc_pase_referencia: 'proyecto-finnova/docs/PASE_A_PRODUCCION.md',
        plan_rollback: 'Revertir a input standard y alertar límite de 2MB.',
        resolucion_tecnica: 'En desarrollo en rama feature/voucher-compressor. MTTA: 35m, En curso dentro de SLA (14h / 24h).'
    },
    {
        id_ticket: 'INC-2026-005',
        codigo_jira: 'INC-TI-105',
        titulo: '[P4-BAJO] Desalineación de badge de estado en modal de citas virtuales en resolución 1366x768',
        descripcion: 'En pantallas de laptops con resolución 1366x768 píxeles, la etiqueta de estado de la cita se solapa 4px sobre el botón de enlace de Google Meet.',
        tipo_solicitud: 'Incidente Técnico',
        solicitante_nombre: 'María López (Cliente)',
        solicitante_rol: 'Cliente',
        prioridad: 'Baja',
        aplica_cambio: 'No Aplica (Soporte Directo)',
        dimension_tecnica: 'N/A - Mesa de Ayuda',
        tipo_cambio_itil: 'No Aplica',
        estado: 'Abierto',
        componente_afectado: 'Frontend Angular / Módulo de Citas',
        ventana_calendarizacion: 'Pase menor en Sprint regular',
        doc_pase_referencia: 'docs/PASE_A_PRODUCCION.md',
        plan_rollback: 'N/A - Cambio cosmético.',
        resolucion_tecnica: 'Catalogado en backlog cosmético. MTTA: 1.5h, SLA de 72h holgadamente cumplido.'
    },
    // =========================================================================
    // DIMENSIÓN 1: INFRAESTRUCTURA (3 Cambios: 1 Completado, 1 En Proceso, 1 Abierto)
    // =========================================================================
    {
        id_ticket: 'RFC-2026-001',
        codigo_jira: 'FCC-101',
        titulo: '[CHE01] Configuración de trust proxy en Render y calibración de Rate Limiting',
        descripcion: 'Ajuste crítico en server.js (app.set("trust proxy", 1)) para identificar la IP real detrás del balanceador de Render Cloud y evitar bloqueos masivos HTTP 429 en el endpoint /api/auth/login.',
        tipo_solicitud: 'Incidente Técnico',
        solicitante_nombre: 'Fiorella Gamarra',
        solicitante_rol: 'Administrador',
        prioridad: 'Crítica',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Infraestructura',
        tipo_cambio_itil: 'Emergencia (CHE)',
        estado: 'Completado',
        componente_afectado: 'Backend Express (Render Cloud)',
        ventana_calendarizacion: 'Ejecución Inmediata Hotfix (18/10/2026)',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md#PASE-BE-2026-01',
        plan_rollback: 'Revertir configuración de express-rate-limit y ejecutar Rollback to previous deploy en consola Render (RTO < 3 min).',
        resolucion_tecnica: 'Desplegado exitosamente en producción. Cero errores HTTP 429 en pruebas de concurrencia.'
    },
    {
        id_ticket: 'RFC-2026-002',
        codigo_jira: 'FCC-102',
        titulo: '[CHN01] Optimización de Pool de Conexiones SSL/TLS hacia TiDB Cloud AWS',
        descripcion: 'Ajuste de parámetros connectionLimit: 10, waitForConnections: true y cifrado TLS forzado (rejectUnauthorized: false) en src/config/db.js para estabilizar latencia entre Render y AWS.',
        tipo_solicitud: 'Requerimiento de Cambio',
        solicitante_nombre: 'Fiorella Gamarra',
        solicitante_rol: 'Administrador',
        prioridad: 'Alta',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Infraestructura',
        tipo_cambio_itil: 'Normal (CHN)',
        estado: 'En Proceso',
        componente_afectado: 'TiDB Cloud Serverless / Render',
        ventana_calendarizacion: 'Ventana Domingos 01:00 AM - 03:00 AM (UTC-5)',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md',
        plan_rollback: 'Restaurar variables de entorno DB_SSL y pool por defecto en consola de Render.',
        resolucion_tecnica: 'En pruebas de estrés k6 validando estabilidad de 10 conexiones simultáneas.'
    },
    {
        id_ticket: 'RFC-2026-003',
        codigo_jira: 'FCC-103',
        titulo: '[CHS01] Rotación trimestral de JWT_SECRET y endurecimiento de cabeceras Helmet',
        descripcion: 'Renovación programada de la llave criptográfica de firma de tokens JWT en variables de entorno de Render y actualización de políticas Cross-Origin en Helmet.',
        tipo_solicitud: 'Requerimiento de Cambio',
        solicitante_nombre: 'Carlos Mendoza (Seguridad TI)',
        solicitante_rol: 'Administrador',
        prioridad: 'Media',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Infraestructura',
        tipo_cambio_itil: 'Estándar (CHS)',
        estado: 'Abierto',
        componente_afectado: 'Backend Express (Render Cloud)',
        ventana_calendarizacion: 'Domingo 15/11/2026 01:30 AM (UTC-5)',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md',
        plan_rollback: 'Restaurar valor anterior de JWT_SECRET en panel Environment de Render en 1 minuto.',
        resolucion_tecnica: 'Pendiente de inicio de ventana programada.'
    },

    // =========================================================================
    // DIMENSIÓN 2: APLICACIONES Y BD (3 Cambios: 1 Completado, 1 En Proceso, 1 Abierto)
    // =========================================================================
    {
        id_ticket: 'RFC-2026-004',
        codigo_jira: 'FCC-104',
        titulo: '[CHN02] Migración de columna id_asesor_preferente y auto-aprovisionamiento Cliente',
        descripcion: 'Alteración de esquema en tabla clientes (id_asesor_preferente) y lógica en solicitudController.js para crear automáticamente el usuario Cliente y enviar credenciales por Nodemailer al validar pago Yape.',
        tipo_solicitud: 'Requerimiento de Cambio',
        solicitante_nombre: 'Fiorella Gamarra',
        solicitante_rol: 'Administrador',
        prioridad: 'Alta',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Aplicaciones y BD',
        tipo_cambio_itil: 'Normal (CHN)',
        estado: 'Completado',
        componente_afectado: 'Base de Datos TiDB + Backend Express + Angular',
        ventana_calendarizacion: 'Ejecutado en Ventana 25/10/2026 01:30 AM',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md#PASE-BE-2026-02',
        plan_rollback: 'Ejecutar script inverso ALTER TABLE clientes DROP COLUMN id_asesor_preferente y git revert del commit.',
        resolucion_tecnica: 'Migración aplicada sin pérdida de datos y validada en producción.'
    },
    {
        id_ticket: 'RFC-2026-005',
        codigo_jira: 'FCC-105',
        titulo: '[CHN03] Despliegue de Módulo de Mesa de Ayuda y Bandeja de Control de Cambios',
        descripcion: 'Creación de tabla tickets_soporte_cambios en TiDB Cloud, endpoints REST /api/soporte-cambios y componente Angular /dashboard/support-changes para calificar solicitudes y escalarlas a RFC por dimensión.',
        tipo_solicitud: 'Requerimiento de Cambio',
        solicitante_nombre: 'Fiorella Gamarra',
        solicitante_rol: 'Administrador',
        prioridad: 'Alta',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Aplicaciones y BD',
        tipo_cambio_itil: 'Normal (CHN)',
        estado: 'En Proceso',
        componente_afectado: 'Frontend Angular (Vercel) + Backend (Render) + TiDB',
        ventana_calendarizacion: 'Ventana Actual 06/11/2026',
        doc_pase_referencia: 'proyecto-finnova/docs/PASE_A_PRODUCCION.md#PASE-FE-2026-04',
        plan_rollback: 'Instant Rollback en Vercel y DROP TABLE tickets_soporte_cambios si se requiere reversión.',
        resolucion_tecnica: 'En validación funcional e integración con tablero de métricas por dimensión.'
    },
    {
        id_ticket: 'RFC-2026-006',
        codigo_jira: 'FCC-106',
        titulo: '[CHN04] Creación de índice compuesto idx_estado_fecha en tabla solicitudes',
        descripcion: 'Optimización DDL en TiDB Cloud agregando índice sobre (estado_atencion, estado_pago, fecha_registro) para acelerar las consultas de reportes de comisiones de brokers.',
        tipo_solicitud: 'Requerimiento de Cambio',
        solicitante_nombre: 'Juan Pérez (Asesor Senior)',
        solicitante_rol: 'Asesor',
        prioridad: 'Media',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Aplicaciones y BD',
        tipo_cambio_itil: 'Normal (CHN)',
        estado: 'Abierto',
        componente_afectado: 'Base de Datos (TiDB Cloud)',
        ventana_calendarizacion: 'Domingo 08/11/2026 02:00 AM (UTC-5)',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md',
        plan_rollback: 'DROP INDEX idx_estado_fecha ON solicitudes;',
        resolucion_tecnica: 'Aprobado técnicamente, esperando ventana dominical.'
    },

    // =========================================================================
    // DIMENSIÓN 3: DOCUMENTACIÓN (3 Cambios: 1 Completado, 1 En Proceso, 1 Abierto)
    // =========================================================================
    {
        id_ticket: 'RFC-2026-007',
        codigo_jira: 'FCC-107',
        titulo: '[CHS02] Publicación de Runbook y Acta de Pase a Producción en repositorios Front y Back',
        descripcion: 'Estandarización y versionamiento del archivo docs/PASE_A_PRODUCCION.md tanto en proyecto-finnova como en backend-finnova con pre-requisitos, comandos CI/CD, smoke tests y plan de rollback.',
        tipo_solicitud: 'Requerimiento de Cambio',
        solicitante_nombre: 'Fiorella Gamarra',
        solicitante_rol: 'Administrador',
        prioridad: 'Alta',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Documentación',
        tipo_cambio_itil: 'Estándar (CHS)',
        estado: 'Completado',
        componente_afectado: 'Repositorios GitHub (Front y Back)',
        ventana_calendarizacion: '06/11/2026 11:00 AM (Ventana Estándar)',
        doc_pase_referencia: 'proyecto-finnova/docs/PASE_A_PRODUCCION.md',
        plan_rollback: 'Revertir commit de documentación vía git revert en rama main.',
        resolucion_tecnica: 'Documentación publicada y vinculada a las actas PASE-FE y PASE-BE.'
    },
    {
        id_ticket: 'RFC-2026-008',
        codigo_jira: 'FCC-108',
        titulo: '[CHS03] Actualización de especificación de endpoints REST y Colección Postman v1.2',
        descripcion: 'Documentación de contratos JSON de entrada/salida para los nuevos endpoints /api/soporte-cambios y /api/solicitudes/:id/validar-pago incluyendo códigos de estado HTTP.',
        tipo_solicitud: 'Requerimiento de Cambio',
        solicitante_nombre: 'Fiorella Gamarra',
        solicitante_rol: 'Administrador',
        prioridad: 'Media',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Documentación',
        tipo_cambio_itil: 'Estándar (CHS)',
        estado: 'En Proceso',
        componente_afectado: 'Swagger / Documentación Técnica API',
        ventana_calendarizacion: 'Jueves 06/11/2026 04:00 PM',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md',
        plan_rollback: 'Restaurar versión v1.1 de la especificación de endpoints en el repositorio.',
        resolucion_tecnica: '85% completado; validando ejemplos de respuesta de métricas por dimensión.'
    },
    {
        id_ticket: 'RFC-2026-009',
        codigo_jira: 'FCC-109',
        titulo: '[CHS04] Actualización del Diccionario de Datos Relacional y Diagrama Entidad-Relación',
        descripcion: 'Incorporación formal de las tablas tickets_soporte_cambios y logs_auditoria_seguridad en el diccionario de datos técnico del proyecto Finnova.',
        tipo_solicitud: 'Requerimiento de Cambio',
        solicitante_nombre: 'Ana Torres (Analista QA)',
        solicitante_rol: 'Asesor',
        prioridad: 'Baja',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Documentación',
        tipo_cambio_itil: 'Estándar (CHS)',
        estado: 'Abierto',
        componente_afectado: 'Diccionario de Datos BD Finnova',
        ventana_calendarizacion: 'Martes 10/11/2026 10:00 AM',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md',
        plan_rollback: 'No afecta disponibilidad operativa; reversión documental en Git.',
        resolucion_tecnica: 'Abierto para revisión del DBA.'
    },

    // =========================================================================
    // DIMENSIÓN 4: CALENDARIO (3 Cambios: 1 Completado, 1 En Proceso, 1 Abierto)
    // =========================================================================
    {
        id_ticket: 'RFC-2026-010',
        codigo_jira: 'FCC-110',
        titulo: '[CHS05] Programación de Cron Job keepAlive.js (cada 10 min) en horario hábil',
        descripcion: 'Cambio de calendarización automatizada mediante scripts/keepAlive.js que ejecuta pings cada 10 minutos a /api/health entre las 08:00 y 22:00 h para evitar el Cold Start de Render sin consumir horas fuera de turno.',
        tipo_solicitud: 'Requerimiento de Cambio',
        solicitante_nombre: 'Fiorella Gamarra',
        solicitante_rol: 'Administrador',
        prioridad: 'Alta',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Calendario',
        tipo_cambio_itil: 'Estándar (CHS)',
        estado: 'Completado',
        componente_afectado: 'Cronograma Automatizado / scripts/keepAlive.js',
        ventana_calendarizacion: 'Ejecución continua Lunes a Sábado (08:00 - 22:00 h)',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md#PASE-BE-2026-03',
        plan_rollback: 'Detener proceso programado keepAlive.js o ajustar INTERVAL_MS.',
        resolucion_tecnica: 'Activo y verificado. Tiempo de respuesta inicial reducido de 50s a 180ms.'
    },
    {
        id_ticket: 'RFC-2026-011',
        codigo_jira: 'FCC-111',
        titulo: '[CHN05] Reprogramación de Ventana de Mantenimiento Oficial y Respaldo TiDB Cloud',
        descripcion: 'Cambio en el Calendario Oficial de Cambios (FSC): traslado de la ventana de mantenimiento y snapshot completo de base de datos al horario de menor tráfico (Domingos 01:00 AM a 03:00 AM UTC-5).',
        tipo_solicitud: 'Requerimiento de Cambio',
        solicitante_nombre: 'Fiorella Gamarra',
        solicitante_rol: 'Administrador',
        prioridad: 'Media',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Calendario',
        tipo_cambio_itil: 'Normal (CHN)',
        estado: 'En Proceso',
        componente_afectado: 'Calendario FSC / Ventana de Mantenimiento',
        ventana_calendarizacion: 'Domingos 01:00 AM - 03:00 AM (UTC-5)',
        doc_pase_referencia: 'backend-finnova/docs/PASE_A_PRODUCCION.md',
        plan_rollback: 'Retornar al horario previo de mantenimiento (Sábados 11:30 PM).',
        resolucion_tecnica: 'Notificado a asesores y configurado en cronograma de operaciones.'
    },
    {
        id_ticket: 'RFC-2026-012',
        codigo_jira: 'FCC-112',
        titulo: '[CHN06] Programación de Periodo de Congelamiento (Code Freeze) por Cierre Contable',
        descripcion: 'Bloqueo programado en calendario de despliegues no críticos desde el 28 al 30 de cada mes para garantizar estabilidad durante la liquidación de comisiones de brokers y conciliación Yape.',
        tipo_solicitud: 'Requerimiento de Cambio',
        solicitante_nombre: 'Fiorella Gamarra',
        solicitante_rol: 'Administrador',
        prioridad: 'Alta',
        aplica_cambio: 'Si Aplica (RFC)',
        dimension_tecnica: 'Calendario',
        tipo_cambio_itil: 'Normal (CHN)',
        estado: 'Abierto',
        componente_afectado: 'Calendario de Releases GitHub / Vercel / Render',
        ventana_calendarizacion: 'Días 28 al 30 de cada mes (00:00 - 23:59 h)',
        doc_pase_referencia: 'proyecto-finnova/docs/PASE_A_PRODUCCION.md',
        plan_rollback: 'Habilitar excepción temporal firmada únicamente por comité eCAB para hotfixes críticos.',
        resolucion_tecnica: 'Programado en el Forward Schedule of Changes (FSC) de Noviembre.'
    },

    // =========================================================================
    // SOLICITUDES OPERATIVAS DE MESA DE AYUDA (SEMANA 10 - FLUJO DE SOLICITUDES)
    // =========================================================================
    {
        id_ticket: 'SRQ-2026-013',
        codigo_jira: 'SRQ-ACC-014',
        titulo: 'Desbloqueo de cuenta de usuario por límite de intentos fallidos (intentos_fallidos >= 5)',
        descripcion: 'El asesor reporta bloqueo preventivo de su cuenta tras 5 intentos fallidos de inicio de sesión. Solicita restablecimiento de acceso según procedimiento PROC-SOL-02.',
        tipo_solicitud: 'Acceso / Credenciales',
        solicitante_nombre: 'Juan Pérez (Asesor)',
        solicitante_rol: 'Asesor',
        prioridad: 'Alta',
        aplica_cambio: 'No Aplica (Soporte Directo)',
        dimension_tecnica: 'N/A - Mesa de Ayuda',
        tipo_cambio_itil: 'No Aplica',
        estado: 'Completado',
        componente_afectado: 'Módulo de Usuarios y Auditoría',
        ventana_calendarizacion: 'Atención Inmediata SLA < 15 min',
        doc_pase_referencia: 'PROC-SOL-02 (Gestión de Solicitudes)',
        plan_rollback: 'N/A - Operación estándar de Mesa de Ayuda.',
        resolucion_tecnica: 'Verificado en logs_auditoria_seguridad. Se limpió intentos_fallidos = 0 y bloqueado_hasta = NULL.'
    },
    {
        id_ticket: 'SRQ-2026-014',
        codigo_jira: 'SRQ-SOP-015',
        titulo: 'Solicitud de evaluación para habilitar notificaciones por WhatsApp al agendar cita',
        descripcion: 'Los clientes solicitan que, además del correo electrónico por Nodemailer, se envíe un recordatorio automático 2 horas antes de la cita virtual de asesoría.',
        tipo_solicitud: 'Soporte / Mesa de Ayuda',
        solicitante_nombre: 'María López (Cliente)',
        solicitante_rol: 'Cliente',
        prioridad: 'Media',
        aplica_cambio: 'Pendiente Evaluación',
        dimension_tecnica: 'Por Clasificar',
        tipo_cambio_itil: 'No Aplica',
        estado: 'Abierto',
        componente_afectado: 'Módulo de Citas / Notificaciones',
        ventana_calendarizacion: 'Por definir en Comité CAB',
        doc_pase_referencia: 'Pendiente de Calificación en Bandeja',
        plan_rollback: 'Por definir al escalar a Control de Cambios.',
        resolucion_tecnica: 'Registrado desde el Formulario de Soporte en espera de calificación del Administrador.'
    }
];

class SoporteCambioModel {
    static async asegurarTablaYSemilla() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tickets_soporte_cambios (
                id_ticket VARCHAR(30) PRIMARY KEY,
                codigo_jira VARCHAR(30) DEFAULT NULL,
                titulo VARCHAR(200) NOT NULL,
                descripcion TEXT NOT NULL,
                tipo_solicitud VARCHAR(60) NOT NULL DEFAULT 'Soporte / Mesa de Ayuda',
                solicitante_nombre VARCHAR(120) NOT NULL,
                solicitante_rol VARCHAR(40) NOT NULL DEFAULT 'Cliente',
                prioridad VARCHAR(20) NOT NULL DEFAULT 'Media',
                aplica_cambio VARCHAR(40) NOT NULL DEFAULT 'Pendiente Evaluación',
                dimension_tecnica VARCHAR(50) NOT NULL DEFAULT 'Por Clasificar',
                tipo_cambio_itil VARCHAR(40) NOT NULL DEFAULT 'No Aplica',
                estado VARCHAR(40) NOT NULL DEFAULT 'Abierto',
                componente_afectado VARCHAR(100) DEFAULT 'Plataforma Finnova',
                ventana_calendarizacion VARCHAR(120) DEFAULT 'Ventana Estándar (Mar/Jue 10:00 AM)',
                doc_pase_referencia VARCHAR(150) DEFAULT 'docs/PASE_A_PRODUCCION.md',
                plan_rollback TEXT DEFAULT NULL,
                resolucion_tecnica TEXT DEFAULT NULL,
                fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        const [rows] = await pool.query('SELECT COUNT(*) AS total FROM tickets_soporte_cambios');
        if (rows[0].total === 0) {
            for (const item of INITIAL_TICKETS_SEED) {
                await pool.query(
                    `INSERT IGNORE INTO tickets_soporte_cambios (
                        id_ticket, codigo_jira, titulo, descripcion, tipo_solicitud,
                        solicitante_nombre, solicitante_rol, prioridad, aplica_cambio,
                        dimension_tecnica, tipo_cambio_itil, estado, componente_afectado,
                        ventana_calendarizacion, doc_pase_referencia, plan_rollback, resolucion_tecnica
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        item.id_ticket, item.codigo_jira, item.titulo, item.descripcion, item.tipo_solicitud,
                        item.solicitante_nombre, item.solicitante_rol, item.prioridad, item.aplica_cambio,
                        item.dimension_tecnica, item.tipo_cambio_itil, item.estado, item.componente_afectado,
                        item.ventana_calendarizacion, item.doc_pase_referencia, item.plan_rollback, item.resolucion_tecnica
                    ]
                );
            }
        }
    }

    static async obtenerTodos() {
        await this.asegurarTablaYSemilla();
        const [rows] = await pool.query(`
            SELECT * FROM tickets_soporte_cambios
            ORDER BY 
                CASE 
                    WHEN id_ticket LIKE 'INC-%' THEN 1
                    WHEN id_ticket LIKE 'RFC-%' THEN 2
                    ELSE 3
                END ASC,
                id_ticket ASC
        `);
        return rows;
    }

    static async crear(datos) {
        await this.asegurarTablaYSemilla();
        const prefijo = datos.tipo_solicitud === 'Incidente Técnico' ? 'INC' : (datos.aplica_cambio === 'Si Aplica (RFC)' ? 'RFC' : 'SRQ');
        const id_ticket = datos.id_ticket || `${prefijo}-2026-${Math.floor(100 + Math.random() * 900)}`;
        const codigo_jira = datos.codigo_jira || (prefijo === 'INC' ? `INC-TI-${Math.floor(100 + Math.random() * 900)}` : (prefijo === 'RFC' ? `FCC-${Math.floor(113 + Math.random() * 80)}` : `SRQ-SOP-${Math.floor(16 + Math.random() * 80)}`));

        await pool.query(
            `INSERT INTO tickets_soporte_cambios (
                id_ticket, codigo_jira, titulo, descripcion, tipo_solicitud,
                solicitante_nombre, solicitante_rol, prioridad, aplica_cambio,
                dimension_tecnica, tipo_cambio_itil, estado, componente_afectado,
                ventana_calendarizacion, doc_pase_referencia, plan_rollback, resolucion_tecnica
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_ticket,
                codigo_jira,
                datos.titulo,
                datos.descripcion,
                datos.tipo_solicitud || 'Soporte / Mesa de Ayuda',
                datos.solicitante_nombre || 'Usuario Finnova',
                datos.solicitante_rol || 'Cliente',
                datos.prioridad || 'Media',
                datos.aplica_cambio || 'Pendiente Evaluación',
                datos.dimension_tecnica || 'Por Clasificar',
                datos.tipo_cambio_itil || 'No Aplica',
                datos.estado || 'Abierto',
                datos.componente_afectado || 'Plataforma Finnova',
                datos.ventana_calendarizacion || 'Por definir en Comité CAB',
                datos.doc_pase_referencia || 'docs/PASE_A_PRODUCCION.md',
                datos.plan_rollback || 'Revertir despliegue en Render/Vercel en caso de anomalía post-pase.',
                datos.resolucion_tecnica || 'En bandeja de evaluación técnica.'
            ]
        );
        return id_ticket;
    }

    static async calificarYActualizar(id_ticket, datos) {
        await this.asegurarTablaYSemilla();
        const [result] = await pool.query(
            `UPDATE tickets_soporte_cambios SET
                codigo_jira = COALESCE(?, codigo_jira),
                aplica_cambio = COALESCE(?, aplica_cambio),
                dimension_tecnica = COALESCE(?, dimension_tecnica),
                tipo_cambio_itil = COALESCE(?, tipo_cambio_itil),
                estado = COALESCE(?, estado),
                prioridad = COALESCE(?, prioridad),
                componente_afectado = COALESCE(?, componente_afectado),
                ventana_calendarizacion = COALESCE(?, ventana_calendarizacion),
                doc_pase_referencia = COALESCE(?, doc_pase_referencia),
                plan_rollback = COALESCE(?, plan_rollback),
                resolucion_tecnica = COALESCE(?, resolucion_tecnica)
            WHERE id_ticket = ?`,
            [
                datos.codigo_jira ?? null,
                datos.aplica_cambio ?? null,
                datos.dimension_tecnica ?? null,
                datos.tipo_cambio_itil ?? null,
                datos.estado ?? null,
                datos.prioridad ?? null,
                datos.componente_afectado ?? null,
                datos.ventana_calendarizacion ?? null,
                datos.doc_pase_referencia ?? null,
                datos.plan_rollback ?? null,
                datos.resolucion_tecnica ?? null,
                id_ticket
            ]
        );
        return result.affectedRows;
    }

    static async eliminar(id_ticket) {
        await this.asegurarTablaYSemilla();
        const [result] = await pool.query('DELETE FROM tickets_soporte_cambios WHERE id_ticket = ?', [id_ticket]);
        return result.affectedRows;
    }
}

module.exports = SoporteCambioModel;
