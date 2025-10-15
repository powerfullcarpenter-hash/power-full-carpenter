// ============================================================
// 🌐 Power Full Carpenter - Backend App
// Configuración principal de Express con CORS seguro, rutas y manejo global de errores
// Compatible con entorno local (Vite) y producción (Render + Vercel)
// ============================================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const app = express();

// ============================================================
// 🧩 Configuración CORS segura y flexible
// ============================================================

// Lista blanca de orígenes permitidos
const allowedOrigins = [
  'http://localhost:5173',                    // Desarrollo local (Vite)
  'http://localhost:4173',                    // Preview local
  'https://power-full-carpenter.vercel.app',  // Despliegue anterior (mantener por compatibilidad)
  'https://power-full-carpenter1.vercel.app', // Nuevo dominio Vercel activo
];

// Middleware CORS personalizado
app.use(
  cors({
    origin: function (origin, callback) {
      // Permite solicitudes sin "Origin" (como Postman o cron jobs)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚫 Bloqueado por CORS: ${origin}`);
        callback(new Error('No permitido por CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos HTTP permitidos
    credentials: true, // Permite cookies / headers de autenticación
  })
);

// ============================================================
// ⚙️ Middlewares base
// ============================================================

// Permite manejar JSON en el body de las solicitudes
app.use(express.json());

// ============================================================
// 🩺 Endpoint de verificación (para monitoreo y debugging)
// ============================================================
app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'Servidor operativo 🚀' });
});

// ============================================================
// 🛠️ Rutas principales de la API
// ============================================================
app.use('/api', routes);

// ============================================================
// ❌ Manejo global de errores
// ============================================================
// Captura cualquier error lanzado por middlewares o rutas
app.use((err, req, res, next) => {
  console.error('❌ Error detectado:', err.message);
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Error interno del servidor' });
});

// ============================================================
// ✅ Exportar instancia configurada de Express
// ============================================================
module.exports = app;
