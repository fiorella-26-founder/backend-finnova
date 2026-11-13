# DOCUMENTACIÓN DE PASE A PRODUCCIÓN — BACKEND API & BASE DE DATOS FINNOVA
**Sistema:** Finnova Backend REST API (Node.js 20 + Express 5) & TiDB Cloud (MySQL 8 Serverless)  
**Repositorio:** `https://github.com/fiorella-26-founder/backend-finnova.git`  
**Plataforma de Despliegue:** Render Cloud Web Service + AWS TiDB Cloud  
**URL Productiva API:** `https://backend-finnova.onrender.com/api`  
**Responsable de Release / Change Manager:** Fiorella Gamarra  

---

## 1. OBJETIVO DEL DOCUMENTO (RUNBOOK DE PASE BACKEND & BD)

Documentar el protocolo técnico oficial para ejecutar **Pases a Producción** en el servidor **Backend API (`backend-finnova`)** y el clúster relacional **TiDB Cloud**, garantizando cero pérdida de datos, compatibilidad hacia atrás (*backward compatibility*) en las migraciones SQL y trazabilidad completa con los tickets RFC de **Jira** en sus **4 dimensiones técnicas** (`Infraestructura`, `Aplicaciones y BD`, `Documentación`, `Calendario`).

---

## 2. PLANTILLA ESTÁNDAR DE ACTA DE PASE A PRODUCCIÓN (BACKEND & BD)

| Campo de Control | Detalle Técnico Requerido |
| :--- | :--- |
| **Código de Acta / Release** | `PASE-BE-2026-XX` |
| **Ticket(s) Jira RFC Asociados** | `FCC-XXX` (Ej. `FCC-101`, `FCC-104`, `FCC-105`, `FCC-110`) |
| **Dimensión Técnica Principal** | `[ ] Infraestructura` \| `[X] Aplicaciones y BD` \| `[ ] Documentación` \| `[ ] Calendario` |
| **Tipo de Cambio (ITIL 4)** | `[ ] Estándar (CHS)` \| `[X] Normal (CHN)` \| `[ ] Emergencia (CHE)` |
| **Archivos / Tablas Afectadas** | `server.js`, `src/config/db.js`, `src/controllers/*`, tabla `tickets_soporte_cambios` |
| **Ventana de Calendarización** | Domingo 01:00 AM – 03:00 AM (UTC-5) (Ventana Oficial de Mantenimiento) |
| **Aprobador CAB / eCAB** | Fiorella Gamarra (Tech Lead / DBA) |

---

## 3. PROCEDIMIENTO TÉCNICO DE PASE A PRODUCCIÓN (PASO A PASO)

### 3.1. Pre-Requisitos y Verificación de Variables de Entorno en Render
Antes de iniciar el pase, verificar en el panel *Render Dashboard $\rightarrow$ Environment* que las variables críticas estén configuradas y cifradas:
- `PORT=3000`
- `DB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com`
- `DB_PORT=4000`
- `DB_SSL=true`
- `DB_NAME=db_finnova`
- `JWT_SECRET=<clave_secreta_produccion_rotada>`
- `JWT_EXPIRES_IN=24h`

### 3.2. Ejecución de Pipeline CI y Controles de Calidad (`.github/workflows/ci.yml`)
Todo commit o Pull Request hacia `main` ejecuta automáticamente en **GitHub Actions**:
```bash
# 1. Verificación de sintaxis del servidor y configuración de base de datos
node --check server.js
node --check src/config/db.js

# 2. Ejecución de suite de pruebas y verificación de módulos
npm test

# 3. Auditoría de vulnerabilidades críticas en paquetes npm
npm audit --audit-level=critical || true
```

### 3.3. Migración No Destructiva de Base de Datos en TiDB Cloud (`src/config/db.js`)
Para evitar *downtime* durante el despliegue, las alteraciones de esquema y la creación de la bandeja de **Mesa de Ayuda y Control de Cambios (`tickets_soporte_cambios`)** se ejecutan mediante sentencias idempotentes (`CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... MODIFY COLUMN`) al iniciar el pool de conexiones:
```sql
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
    doc_pase_referencia VARCHAR(120) DEFAULT 'docs/PASE_A_PRODUCCION.md',
    plan_rollback TEXT DEFAULT NULL,
    resolucion_tecnica TEXT DEFAULT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.4. Verificación Post-Pase (*Smoke Check & Health Check*)
Una vez finalizado el despliegue en Render, ejecutar las pruebas de verificación:
1. **Health Check de Disponibilidad:**
   ```bash
   curl -i https://backend-finnova.onrender.com/api/health
   # Respuesta esperada: HTTP/2 200 {"status":"OK","message":"API Finnova Backend segura y activa"}
   ```
2. **Verificación de Bandeja de Soporte y Métricas de Cambios:**
   ```bash
   curl -i https://backend-finnova.onrender.com/api/soporte-cambios/metricas
   ```
3. **Verificación de Cron Job de Calendarización (`scripts/keepAlive.js`):** Confirmar que el ping programado cada 10 minutos responde en `< 300 ms`.

### 3.5. Plan de Rollback Técnico (RTO: 3 a 5 minutos)
Si el *Health Check* devuelve error `500` o fallo de conexión a TiDB Cloud:
1. **Rollback de Aplicación en Render:** En *Render Dashboard $\rightarrow$ Events*, seleccionar el commit anterior y pulsar **"Rollback to this deploy"**.
2. **Rollback de Base de Datos en TiDB Cloud:** Ejecutar script inverso o restaurar snapshot automático previo a la ventana de mantenimiento.

---

## 4. REGISTRO HISTÓRICO DE ACTAS DE PASE EJECUTADAS (BACKEND & BD)

| Acta de Pase | Ticket Jira | Dimensión Técnica | Descripción del Pase a Producción | Fecha / Ventana | Estado |
| :---: | :---: | :---: | :--- | :---: | :---: |
| **`PASE-BE-2026-01`** | **`FCC-101`** | **Infraestructura** | Hotfix de `trust proxy` en Render y calibración de `express-rate-limit` (`authLimiter`). | 18/10/2026 (Emergencia) | **Completado** |
| **`PASE-BE-2026-02`** | **`FCC-104`** | **Aplicaciones y BD** | Migración de columna `id_asesor_preferente` en tabla `clientes` y caché LRU (`cacheMiddleware.js`). | 25/10/2026 (01:30 h) | **Completado** |
| **`PASE-BE-2026-03`** | **`FCC-110`** | **Calendario** | Activación de tarea programada `scripts/keepAlive.js` (intervalo 10 min) para eliminar Cold Start en horario hábil. | 30/10/2026 (10:00 h) | **Completado** |
| **`PASE-BE-2026-04`** | **`FCC-107`** | **Documentación** | Publicación de Runbook `docs/PASE_A_PRODUCCION.md` y especificación de endpoints `/api/soporte-cambios`. | 06/11/2026 (11:00 h) | **Completado** |
| **`PASE-BE-2026-05`** | **`FCC-105`** | **Aplicaciones y BD** | Creación de tabla `tickets_soporte_cambios` y endpoints REST para Mesa de Ayuda y Control de Cambios. | 06/11/2026 (16:30 h) | **Completado** |
| **`PASE-BE-2026-06`** | **`FCC-113`** | **Aplicaciones y BD** | Integración de catálogo de incidentes ITIL 4 (`INC-2026-001` a `INC-2026-005`), soporte para rol Soporte TI y ordenamiento preferente. | 13/11/2026 (13:15 h) | **Completado** |
