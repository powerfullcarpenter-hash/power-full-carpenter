const pool = require('../db');
const { jsPDF } = require('jspdf');
require('jspdf-autotable'); // librería para tablas en PDF


async function getAllInsumos() {
  const res = await pool.query('SELECT * FROM insumos ORDER BY insumo_id');
  return res.rows;
}

async function addInsumo({ nombre, unidad_medida, stock = 0, stock_minimo = 0 }) {
  const res = await pool.query(
    'INSERT INTO insumos (nombre, unidad_medida, stock, stock_minimo) VALUES ($1,$2,$3,$4) RETURNING *',
    [nombre, unidad_medida, stock, stock_minimo]
  );
  return res.rows[0];
}

async function getMovimientos({ insumo_id, pedido_id, from, to }) {
  const where = [];
  const params = [];
  if (insumo_id) { params.push(insumo_id); where.push(`insumo_id = $${params.length}`); }
  if (pedido_id) { params.push(pedido_id); where.push(`pedido_id = $${params.length}`); }
  if (from) { params.push(from); where.push(`fecha_movimiento >= $${params.length}`); }
  if (to) { params.push(to); where.push(`fecha_movimiento <= $${params.length}`); }

  const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const sql = `SELECT * FROM movimientos_inventario ${whereSQL} ORDER BY fecha_movimiento DESC`;
  const res = await pool.query(sql, params);
  return res.rows;
}

async function addMovement({ tipo, insumo_id, pedido_id, cantidad, motivo = null, responsable_id = null, tarea_id = null }) {
  if (!insumo_id || !tipo || cantidad === undefined) throw new Error('Faltan campos obligatorios (tipo, insumo_id, cantidad)');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (tipo === 'SALIDA' && !pedido_id) throw new Error('Toda SALIDA debe estar asociada a un pedido.');

    // lock row
    const sel = await client.query('SELECT stock FROM insumos WHERE insumo_id = $1 FOR UPDATE', [insumo_id]);
    if (!sel.rows.length) throw new Error('Insumo no encontrado.');
    let stockActual = Number(sel.rows[0].stock);
    let delta = Number(cantidad);

    if (tipo === 'SALIDA') delta = -Math.abs(delta);
    if (tipo === 'ENTRADA') delta = Math.abs(delta);
    // AJUSTE: delta puede ser positivo o negativo según lo pase el cliente

    const nuevoStock = stockActual + delta;
    if (nuevoStock < 0) throw new Error('Stock insuficiente para registrar la salida.');

    await client.query('UPDATE insumos SET stock = $1 WHERE insumo_id = $2', [nuevoStock, insumo_id]);

    await client.query(
      `INSERT INTO movimientos_inventario
         (insumo_id, tipo_movimiento, cantidad, fecha_movimiento, responsable_id, pedido_id, tarea_id, motivo)
       VALUES ($1,$2,$3,NOW(),$4,$5,$6,$7)`,
      [insumo_id, tipo, delta, responsable_id, pedido_id || null, tarea_id || null, motivo || null]
    );

    await client.query('COMMIT');
    return { ok: true, nuevoStock };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}



/* ===================== */
/*   INSUMOS / LISTADO   */
/* ===================== */
async function listInsumos() {
  const res = await pool.query(
    `SELECT insumo_id, nombre, unidad_medida, stock, stock_minimo
     FROM insumos
     ORDER BY nombre ASC`
  );
  return res.rows;
}

/* ===================== */
/*  CONSUMO RÁPIDO       */
/* ===================== */
async function registrarConsumoRapido(taskId, insumoId, cantidad, motivo, operarioId) {
  // validar insumo/stock
  const chk = await pool.query(
    `SELECT stock, unidad_medida FROM insumos WHERE insumo_id = $1`,
    [insumoId]
  );
  if (!chk.rows.length) throw new Error("Insumo no encontrado");
  const { stock, unidad_medida } = chk.rows[0];

  if (!cantidad || Number(cantidad) <= 0) throw new Error("La cantidad debe ser mayor a 0");
  if (Number(cantidad) > Number(stock)) throw new Error("No hay suficiente stock disponible");

  // insertar movimiento con motivo → como AJUSTE
  await pool.query(
    `INSERT INTO movimientos_inventario 
     (insumo_id, tipo_movimiento, cantidad, responsable_id, tarea_id, motivo)
     VALUES ($1, 'AJUSTE', $2, $3, $4, $5)`,
    [insumoId, cantidad, operarioId, taskId, motivo]
  );

  // actualizar stock
  await pool.query(
    `UPDATE insumos SET stock = stock - $1 WHERE insumo_id = $2`,
    [cantidad, insumoId]
  );

  return { ok: true, unidad: unidad_medida };
}


/* ===================== */
/*     INCIDENCIAS       */
/* ===================== */
async function reportarIncidencia(taskId, operarioId, tipo, descripcion, urgencia, fotoUrl = null) {
  const res = await pool.query(
    `INSERT INTO incidencias (task_id, operario_id, tipo, descripcion, urgencia, foto_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING incidencia_id, task_id, tipo, urgencia, descripcion, estado, fecha_reporte`,
    [taskId, operarioId, tipo, descripcion, urgencia, fotoUrl]
  );
  return res.rows[0];
}

async function getIncidencias() {
  const res = await pool.query(
    `SELECT i.*, u.name AS operario_nombre, t.titulo AS tarea_titulo
       FROM incidencias i
  LEFT JOIN users u ON u.user_id = i.operario_id
  LEFT JOIN tasks t ON t.task_id  = i.task_id
   ORDER BY i.fecha_reporte DESC`
  );
  return res.rows;
}

async function updateIncidenciaEstado(incidenciaId, estado) {
  const res = await pool.query(
    `UPDATE incidencias
        SET estado = $1
      WHERE incidencia_id = $2
  RETURNING incidencia_id, estado, fecha_reporte`,
    [estado, incidenciaId]
  );
  return res.rows[0];
}

/* ===================== */
/*       HISTORIAL       */
/* ===================== */
async function getHistorialConsumos(taskId) {
  const res = await pool.query(
    `SELECT 
        m.movimiento_id,
        m.cantidad,
        m.fecha_movimiento,
        m.motivo,                -- 👈 ahora sí devuelve el motivo
        i.nombre,
        i.unidad_medida
     FROM movimientos_inventario m
     INNER JOIN insumos i ON i.insumo_id = m.insumo_id
     WHERE m.tarea_id = $1
       AND m.tipo_movimiento = 'AJUSTE'   -- 👈 coincide con lo que guardas
     ORDER BY m.fecha_movimiento DESC`,
    [taskId]
  );
  return res.rows;
}


async function getHistorialIncidencias(taskId) {
  const res = await pool.query(
    `SELECT incidencia_id, tipo, urgencia, descripcion, fecha_reporte, estado
       FROM incidencias
      WHERE task_id = $1
   ORDER BY fecha_reporte DESC`,
    [taskId]
  );
  return res.rows;
}


async function getAlertasStock() {
  const res = await pool.query(
    `SELECT insumo_id, nombre, unidad_medida, stock, stock_minimo
       FROM insumos
      WHERE stock < stock_minimo
      ORDER BY stock ASC`
  );
  return res.rows;
}



async function getKardex({ desde, hasta, tipo, insumoId }) {
  const conditions = [];
  const values = [];
  let i = 1;

  // desde >= 00:00:00 de ese día
  if (desde) {
    conditions.push(`m.fecha_movimiento >= $${i++}::date`);
    values.push(desde);
  }

  // hasta < (día + 1)  → incluye todo el día seleccionado
  if (hasta) {
    conditions.push(`m.fecha_movimiento < ($${i++}::date + INTERVAL '1 day')`);
    values.push(hasta);
  }

  if (tipo && tipo !== 'Todos') {
    conditions.push(`m.tipo_movimiento = $${i++}`);
    values.push(tipo);
  }

  if (insumoId && insumoId !== 'Todos') {
    conditions.push(`m.insumo_id = $${i++}`);
    values.push(insumoId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT 
      m.movimiento_id,
      m.fecha_movimiento AS fecha,
      i.nombre AS insumo,
      m.tipo_movimiento AS tipo,
      m.cantidad,
      COALESCE(p.codigo_unico, CONCAT('Pedido-', p.pedido_id)) AS orden,
      COALESCE(t.titulo, CONCAT('Tarea-', t.task_id)) AS tarea,
      COALESCE(u.name, 'N/A') AS responsable,
      COALESCE(m.motivo, '-') AS motivo
    FROM movimientos_inventario m
    JOIN insumos i ON m.insumo_id = i.insumo_id
    LEFT JOIN pedidos p ON m.pedido_id = p.pedido_id
    LEFT JOIN tasks t ON m.tarea_id = t.task_id
    LEFT JOIN users u ON m.responsable_id = u.user_id
    ${where}
    ORDER BY m.fecha_movimiento DESC
  `;

  const res = await pool.query(sql, values);
  return res.rows;
}





module.exports = {
  getAllInsumos, 
  addInsumo, 
  getMovimientos, 
  addMovement,
  // insumos
  listInsumos,

  // consumos
  registrarConsumoRapido,

  // incidencias
  reportarIncidencia,
  getIncidencias,
  updateIncidenciaEstado,

  // historial
  getHistorialConsumos,
  getHistorialIncidencias,

  //stock bajo
  getAlertasStock,

  // para el kardex
  getKardex,
  
};
