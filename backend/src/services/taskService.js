const pool = require('../db');

// Obtener tareas de un operario
async function getTasksByUser(userId) {
  const res = await pool.query(
    `SELECT 
       t.task_id,
       t.pedido_id,
       t.titulo,
       t.descripcion,
       t.estado,
       t.area,
       t.asignado_a,
       t.inicio,
       t.fin,
       p.fecha_compromiso,
       COALESCE(t.tiempo_acumulado,0) AS tiempo_acumulado,
       p.nombre_cliente,
       p.prioridad,
       p.estado as pedido_estado,
       u.name AS operario_nombre
     FROM tasks t
     JOIN pedidos p ON t.pedido_id = p.pedido_id
     LEFT JOIN users u ON t.asignado_a = u.user_id
     WHERE t.asignado_a = $1
     ORDER BY t.task_id DESC`,
    [userId]
  );
  return res.rows;
}

// Obtener tareas de un pedido específico
async function getTasksByOrder(pedidoId) {
  const res = await pool.query(
    `SELECT 
       t.task_id,
       t.pedido_id,
       t.titulo,
       t.descripcion,
       t.estado,
       t.area,
       t.asignado_a,
       t.inicio,
       t.fin,
       p.fecha_compromiso,
       COALESCE(t.tiempo_acumulado,0) AS tiempo_acumulado,
       u.name AS operario_nombre
     FROM tasks t
     LEFT JOIN users u ON t.asignado_a = u.user_id
     WHERE t.pedido_id = $1
     ORDER BY t.task_id`,
    [pedidoId]
  );
  return res.rows;
}

// Obtener todas (Supervisor)
async function getAllTasks() {
  const res = await pool.query(
    `SELECT 
       t.task_id,
       t.pedido_id,
       t.titulo,
       t.descripcion,
       t.estado,
       t.area,
       t.asignado_a,
       t.inicio,
       t.fin,
       p.fecha_compromiso,
       COALESCE(t.tiempo_acumulado,0) AS tiempo_acumulado,
       p.nombre_cliente,
       p.prioridad,
       p.estado as pedido_estado,
       u.name AS operario_nombre
     FROM tasks t
     JOIN pedidos p ON t.pedido_id = p.pedido_id
     LEFT JOIN users u ON t.asignado_a = u.user_id
     ORDER BY t.task_id DESC`
  );
  return res.rows;
}

// startTask: marca inicio = NOW() si no existe ya
async function startTask(taskId, userId, userRole) {
  const t = await pool.query(`SELECT asignado_a FROM tasks WHERE task_id = $1`, [taskId]);
  if (!t.rows.length) throw new Error('Tarea no encontrada');
  const assigned = t.rows[0].asignado_a;
  if (userRole?.toLowerCase() !== 'supervisor' && assigned !== userId) {
    throw new Error('No autorizado para iniciar esta tarea');
  }

  await pool.query(
    `UPDATE tasks
     SET inicio = CASE WHEN inicio IS NULL THEN NOW() ELSE inicio END
     WHERE task_id = $1`,
    [taskId]
  );

  const res = await pool.query(
    `SELECT task_id, inicio, tiempo_acumulado, estado FROM tasks WHERE task_id = $1`,
    [taskId]
  );
  return res.rows[0];
}

// pauseTask: agrega tiempo acumulado y pone inicio = NULL
async function pauseTask(taskId, userId, userRole) {
  const t = await pool.query(`SELECT asignado_a, inicio, tiempo_acumulado FROM tasks WHERE task_id = $1`, [taskId]);
  if (!t.rows.length) throw new Error('Tarea no encontrada');
  const row = t.rows[0];
  if (userRole?.toLowerCase() !== 'supervisor' && row.asignado_a !== userId) {
    throw new Error('No autorizado para pausar esta tarea');
  }
  if (!row.inicio) {
    return { task_id: taskId, inicio: null, tiempo_acumulado: row.tiempo_acumulado, estado: row.estado };
  }

  const res = await pool.query(
    `UPDATE tasks
     SET tiempo_acumulado = COALESCE(tiempo_acumulado,0) + FLOOR(EXTRACT(EPOCH FROM (NOW() - inicio)))::int,
         inicio = NULL
     WHERE task_id = $1
     RETURNING task_id, inicio, tiempo_acumulado, estado`,
    [taskId]
  );

  return res.rows[0];
}

// finishTask: suma tiempo, pone fin y estado = 'Terminado', sincroniza pedido
async function finishTask(taskId, userId, userRole) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const t = await client.query(
      `SELECT asignado_a, inicio, tiempo_acumulado, pedido_id 
       FROM tasks WHERE task_id = $1 FOR UPDATE`,
      [taskId]
    );
    if (!t.rows.length) throw new Error('Tarea no encontrada');
    const row = t.rows[0];
    if (userRole?.toLowerCase() !== 'supervisor' && row.asignado_a !== userId) {
      throw new Error('No autorizado para finalizar esta tarea');
    }

    await client.query(
      `UPDATE tasks
       SET tiempo_acumulado = COALESCE(tiempo_acumulado,0) + COALESCE(FLOOR(EXTRACT(EPOCH FROM (NOW() - inicio)))::int,0),
           inicio = NULL,
           fin = NOW(),
           estado = 'Terminado'
       WHERE task_id = $1`,
      [taskId]
    );

    const pending = await client.query(
      `SELECT COUNT(*)::int AS cnt FROM tasks WHERE pedido_id = $1 AND estado != 'Terminado'`,
      [row.pedido_id]
    );
    if (pending.rows[0].cnt === 0) {
      await client.query(
        `UPDATE pedidos SET estado = 'Terminado', fecha_cierre = NOW() WHERE pedido_id = $1`,
        [row.pedido_id]
      );
    }

    await client.query('COMMIT');

    const out = await pool.query(
      `SELECT task_id, inicio, fin, tiempo_acumulado, estado FROM tasks WHERE task_id = $1`,
      [taskId]
    );
    return out.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
// updateTaskStatus: mover estados en Kanban
async function updateTaskStatus(taskId, newStateDb) {
  // Validación estricta
  const validStates = ["Por Hacer", "En Curso", "Terminado"];
  if (!validStates.includes(newStateDb)) {
    throw new Error(`Estado inválido para tareas: ${newStateDb}`);
  }

  const res = await pool.query(
    `UPDATE tasks SET estado = $1 WHERE task_id = $2 RETURNING task_id, pedido_id, estado, inicio`,
    [newStateDb, taskId]
  );
  if (!res.rows.length) return null;
  const task = res.rows[0];

  if (newStateDb === "Terminado") {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE tasks
         SET tiempo_acumulado = COALESCE(tiempo_acumulado,0) + FLOOR(EXTRACT(EPOCH FROM (NOW() - inicio)))::int,
             inicio = NULL,
             fin = NOW()
         WHERE task_id = $1`,
        [taskId]
      );

      const pending = await client.query(
        `SELECT COUNT(*)::int AS cnt FROM tasks WHERE pedido_id = $1 AND estado != 'Terminado'`,
        [task.pedido_id]
      );
      if (pending.rows[0].cnt === 0) {
        await client.query(
          `UPDATE pedidos SET estado = 'Terminado', fecha_cierre = NOW() WHERE pedido_id = $1`,
          [task.pedido_id]
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  if (newStateDb === "En Curso") {
    await pool.query(
      `UPDATE pedidos SET estado = 'En Proceso' WHERE pedido_id = $1 AND estado != 'En Proceso'`,
      [task.pedido_id]
    );
  }

  const out = await pool.query(
    `SELECT task_id, inicio, fin, tiempo_acumulado, estado FROM tasks WHERE task_id = $1`,
    [taskId]
  );
  return out.rows[0];
}



module.exports = {
  getTasksByUser,
  getAllTasks,
  startTask,
  pauseTask,
  finishTask,
  updateTaskStatus,
  getTasksByOrder, // 👈 lo añadimos aquí
};
