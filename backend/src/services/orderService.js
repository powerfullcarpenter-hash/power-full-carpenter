const pool = require('../db');

async function getOrders() {
  const res = await pool.query(`
    SELECT 
      p.pedido_id,
      p.cliente_id,
      p.nombre_cliente,
      p.estado,
      p.prioridad,
      p.area,
      p.fecha_creacion,
      p.fecha_cierre,
      p.fecha_compromiso,   
      p.descripcion,   
      t.titulo AS tarea_titulo,
      u.name AS operario_nombre,
      u.email AS operario_email
    FROM pedidos p
    LEFT JOIN clientes c ON p.cliente_id = c.cliente_id
    LEFT JOIN tasks t ON p.pedido_id = t.pedido_id
    LEFT JOIN users u ON t.asignado_a = u.user_id
    ORDER BY p.pedido_id DESC
  `);
  return res.rows;
}


async function createOrder({
  cliente_id = null,
  nombre_cliente,
  area,
  prioridad = 'Normal',
  descripcion = null,
  fecha_compromiso = null,
  asignado_a,
  nombre_tarea = null,
  responsable_id = null
}) {
  // 🔹 Validación área y prioridad (ya existente, se mantiene)

  if (!asignado_a) throw new Error('Debe asignar un operario a la tarea.');

  const usr = await pool.query('SELECT user_id, role FROM users WHERE user_id = $1', [asignado_a]);
  if (!usr.rows.length) throw new Error('Operario asignado no encontrado.');
  if ((usr.rows[0].role || '').toLowerCase() !== 'operario') throw new Error('El usuario asignado no es un operario.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 👇 Insertar pedido con soporte a cliente_id
    const insertPedido = await client.query(
      `INSERT INTO pedidos (cliente_id, nombre_cliente, area, descripcion, prioridad, fecha_compromiso, responsable_id, estado, fecha_creacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'En Proceso',NOW())
       RETURNING *`,
      [cliente_id, nombre_cliente, area, descripcion, prioridad, fecha_compromiso, responsable_id || null]
    );

    const pedido = insertPedido.rows[0];

    // Insertar tarea asociada
    const tareaTitulo = nombre_tarea || `Tarea - Pedido ${pedido.pedido_id}`;
    await client.query(
      `INSERT INTO tasks (pedido_id, titulo, descripcion, estado, asignado_a, area)
       VALUES ($1,$2,$3,'Por Hacer',$4,$5)`,
      [pedido.pedido_id, tareaTitulo, descripcion || null, asignado_a, area || null]
    );

    await client.query('COMMIT');
    return pedido;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Obtener pedidos con filtros
async function getOrdersFiltered({ estado, area, prioridad, desde, hasta }) {
  let conditions = [];
  let values = [];
  let i = 1;

  if (estado && estado !== 'Todos') {
    conditions.push(`p.estado = $${i++}`);
    values.push(estado);
  }
  if (area && area !== 'Todos') {
    conditions.push(`p.area = $${i++}`);
    values.push(area);
  }
  if (prioridad && prioridad !== 'Todos') {
    conditions.push(`p.prioridad = $${i++}`);
    values.push(prioridad);
  }
  if (desde) {
    conditions.push(`p.fecha_compromiso >= $${i++}`);
    values.push(desde);
  }
  if (hasta) {
    conditions.push(`p.fecha_compromiso <= $${i++}`);
    values.push(hasta);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const res = await pool.query(
    `
    SELECT 
      p.pedido_id,
      p.nombre_cliente,
      p.estado,
      p.prioridad,
      p.area,
      p.descripcion, 
      p.fecha_compromiso,
      p.fecha_creacion,
      p.fecha_cierre,
      t.titulo AS tarea_titulo,
      u.name AS operario_nombre,
      u.email AS operario_email
    FROM pedidos p
    LEFT JOIN tasks t ON p.pedido_id = t.pedido_id
    LEFT JOIN users u ON t.asignado_a = u.user_id
    ${where}
    ORDER BY p.fecha_compromiso ASC NULLS LAST, p.pedido_id DESC
    `,
    values
  );

  return res.rows;
}

// Cambiar estado de un pedido (y sincronizar tasks si aplica)
async function updateOrderStatus(pedidoId, nuevoEstado) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ✅ actualizar pedido
    const pedidoRes = await client.query(
      `UPDATE pedidos 
       SET estado = $1::varchar, 
           fecha_cierre = CASE WHEN $1::varchar IN ('Terminado','Cancelado') THEN NOW() ELSE fecha_cierre END
       WHERE pedido_id = $2 
       RETURNING *`,
      [nuevoEstado, pedidoId]
    );

    const pedido = pedidoRes.rows[0];
    if (!pedido) {
      throw new Error("Pedido no encontrado");
    }

    // ✅ sincronizar según estado
    if (nuevoEstado === "Terminado") {
      await client.query(
        `UPDATE tasks 
         SET estado = 'Terminado', fin = NOW(), inicio = NULL
         WHERE pedido_id = $1 AND estado != 'Terminado'`,
        [pedidoId]
      );
    } else if (nuevoEstado === "Cancelado") {
      // 🚩 en vez de forzar estados, eliminamos las tasks
      await client.query(
        `DELETE FROM tasks WHERE pedido_id = $1`,
        [pedidoId]
      );
    }

    await client.query("COMMIT");
    return pedido;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}



// Editar pedido existente
async function editOrder(pedidoId, { nombre_cliente, area, prioridad, descripcion, fecha_compromiso }) {
  const res = await pool.query(
    `UPDATE pedidos
     SET nombre_cliente = $1,
         area = $2,
         prioridad = $3,
         descripcion = $4,
         fecha_compromiso = $5
     WHERE pedido_id = $6
     RETURNING *`,
    [nombre_cliente, area, prioridad, descripcion, fecha_compromiso, pedidoId]
  );
  return res.rows[0];
}

// Duplicar pedido
async function duplicateOrder(pedidoId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Obtener pedido original
    const pedidoRes = await client.query(
      `SELECT * FROM pedidos WHERE pedido_id = $1`,
      [pedidoId]
    );
    if (!pedidoRes.rows.length) throw new Error("Pedido no encontrado");
    const pedido = pedidoRes.rows[0];

    // Insertar nuevo pedido (copiamos cliente, área, descripción, prioridad, fecha_compromiso)
    const insertPedido = await client.query(
      `INSERT INTO pedidos (nombre_cliente, area, descripcion, prioridad, fecha_compromiso, estado, fecha_creacion)
       VALUES ($1,$2,$3,$4,$5,'En Proceso',NOW()) 
       RETURNING *`,
      [
        pedido.nombre_cliente,
        pedido.area,
        pedido.descripcion,
        pedido.prioridad,
        pedido.fecha_compromiso
      ]
    );

    const newPedido = insertPedido.rows[0];

    // Copiar tarea asociada
    const tasksRes = await client.query(
      `SELECT titulo, descripcion, asignado_a, area
       FROM tasks WHERE pedido_id = $1`,
      [pedidoId]
    );

    for (const t of tasksRes.rows) {
      await client.query(
        `INSERT INTO tasks (pedido_id, titulo, descripcion, estado, asignado_a, area)
         VALUES ($1, $2, $3, 'Por Hacer', $4, $5)`,
        [newPedido.pedido_id, t.titulo, t.descripcion, t.asignado_a, t.area]
      );
    }

    await client.query("COMMIT");
    return newPedido;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}


// src/services/orderService.js
async function updateOrder(pedidoId, { nombre_cliente, area, prioridad, descripcion, fecha_compromiso, asignado_a }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const pedidoRes = await client.query(
      `UPDATE pedidos 
       SET nombre_cliente = $1,
           area = $2,
           prioridad = $3,
           descripcion = $4,
           fecha_compromiso = $5
       WHERE pedido_id = $6
       RETURNING *`,
      [nombre_cliente, area, prioridad, descripcion, fecha_compromiso, pedidoId]
    );

    const pedido = pedidoRes.rows[0];
    if (!pedido) throw new Error("Pedido no encontrado");

    // 🔹 Sincronizar descripción en tasks
    if (descripcion) {
      await client.query(
        `UPDATE tasks
         SET descripcion = $1
         WHERE pedido_id = $2`,
        [descripcion, pedidoId]
      );
    }

    // 🔹 Actualizar operario en tasks
    if (asignado_a) {
      await client.query(
        `UPDATE tasks 
         SET asignado_a = $1
         WHERE pedido_id = $2`,
        [asignado_a, pedidoId]
      );
    }

    await client.query("COMMIT");
    return pedido;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}


module.exports = { 
  getOrders, 
  createOrder, 
  updateOrderStatus, 
  getOrdersFiltered,
  editOrder,
  duplicateOrder,
  updateOrder
 };