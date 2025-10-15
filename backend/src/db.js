require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // necesario para Neon
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 60000,
});

pool.on("connect", () => {
  console.log("✅ Conectado a PostgreSQL (Neon)");
});

pool.on("error", (err) => {
  console.error("⚠️ Error inesperado en PostgreSQL:", err.message);
});

// Mantener viva la conexión
setInterval(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("🕓 Ping exitoso a Neon");
  } catch (err) {
    console.error("❌ Fallo en ping a PostgreSQL:", err.message);
  }
}, 300000);

module.exports = pool;
