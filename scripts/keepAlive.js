/**
 * ==============================================================================
 * WORKER KEEP-ALIVE ANTI-COLD START - PROYECTO FINNOVA
 * Curso Integrador II: Sistemas - Solución Técnica #4
 * ==============================================================================
 * Propósito:
 *   Evita la auto-suspensión (hibernación) de la instancia gratuita en Render
 *   enviando un ping HTTP periódico cada 10 minutos al endpoint /api/health.
 * 
 * Ejecución:
 *   node scripts/keepAlive.js
 * ==============================================================================
 */

const https = require('https');

const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos (Render hiberna a los 15 min)
const TARGET_URL = 'https://backend-finnova.onrender.com/api/health';

function ejecutarPing() {
  const horaActual = new Date().toLocaleTimeString('es-PE', { hour12: false });
  const inicio = Date.now();

  const req = https.get(TARGET_URL, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const duracion = Date.now() - inicio;
      console.log(`[${horaActual}] ⚡ [Keep-Alive Ping Exitoso]`);
      console.log(`       └─ Status: HTTP ${res.statusCode} ${res.statusMessage} | Latencia: ${duracion} ms`);
      console.log(`       └─ Estado del Contenedor: Activo y caliente (Sin Cold Start)`);
      console.log(`       └─ Próximo ping programado en 10 minutos...\n`);
    });
  });

  req.on('error', (err) => {
    console.error(`[${horaActual}] ✖ [Error en Keep-Alive Ping]:`, err.message);
  });

  req.setTimeout(15000, () => {
    req.abort();
    console.warn(`[${horaActual}] ⚠️ [Timeout en Keep-Alive Ping] (Servidor tardó más de 15s)`);
  });
}

console.log(`╔════════════════════════════════════════════════════════════════════╗`);
console.log(`║         WORKER KEEP-ALIVE ANTI-COLD START - FINNOVA                ║`);
console.log(`║     Manteniendo activo el contenedor Render cada 10 minutos        ║`);
console.log(`╚════════════════════════════════════════════════════════════════════╝`);
console.log(`Target: ${TARGET_URL}`);
console.log(`Intervalo: Cada 10 minutos\n`);

// 1. Ejecución inmediata al arrancar el script
console.log(`[>] Enviando ping inicial de verificación...`);
ejecutarPing();

// 2. Programación recurrente
const intervalId = setInterval(ejecutarPing, PING_INTERVAL_MS);

// Manejo elegante de detención (Ctrl + C)
process.on('SIGINT', () => {
  console.log(`\nDeteniendo Worker Keep-Alive...`);
  clearInterval(intervalId);
  process.exit(0);
});
