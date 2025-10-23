const pool = require('../db');

async function produccion(from, to) {
  const res = await pool.query(
    `SELECT pedido_id, nombre_cliente, fecha_creacion, fecha_cierre
     FROM pedidos
     WHERE estado = 'Terminado'
       AND ($1::date IS NULL OR fecha_cierre::date >= $1::date)
       AND ($2::date IS NULL OR fecha_cierre::date <= $2::date)
     ORDER BY fecha_creacion`,
    [from || null, to || null]
  );
  return res.rows;
}


async function tiempos() {
  // 📊 Resumen por operario
  const resumen = await pool.query(
    `SELECT 
        u.name AS operario,
        COUNT(*) AS tareas_completadas,
        ROUND(AVG(t.tiempo_acumulado)::numeric, 2) AS promedio_min
     FROM tasks t
     JOIN users u ON u.user_id = t.asignado_a
     WHERE t.estado = 'Terminado' AND t.tiempo_acumulado > 0
     GROUP BY u.name
     ORDER BY promedio_min ASC`
  );

  // 📋 Detalle de cada tarea
  const detalle = await pool.query(
    `SELECT 
        t.task_id,
        t.pedido_id,
        p.nombre_cliente,
        t.area,
        t.tiempo_acumulado,
        t.fin AS fecha_fin,
        u.name AS operario
     FROM tasks t
     JOIN users u ON u.user_id = t.asignado_a
     JOIN pedidos p ON p.pedido_id = t.pedido_id
     WHERE t.estado = 'Terminado' AND t.tiempo_acumulado > 0
     ORDER BY t.fin DESC`
  );

  return {
    resumen: resumen.rows,
    detalle: detalle.rows
  };
}



async function consumo(pedido_id) {
  const id = pedido_id ? Number(pedido_id) : null;

  const sql = `
    WITH base AS (
      -- 🔹 A) Movimientos SALIDA (registrados directamente al pedido desde inventario)
      SELECT 
        m.pedido_id AS pedido_id,
        p.nombre_cliente,
        i.nombre AS insumo,
        ABS(m.cantidad)::numeric AS cantidad,
        i.unidad_medida
      FROM movimientos_inventario m
      JOIN pedidos p ON p.pedido_id = m.pedido_id
      JOIN insumos i ON i.insumo_id = m.insumo_id
      WHERE m.tipo_movimiento = 'SALIDA'
        AND m.pedido_id IS NOT NULL

      UNION ALL

      -- 🔹 B) Movimientos AJUSTE (consumos rápidos realizados por los operarios desde tareas)
      SELECT 
        t.pedido_id AS pedido_id,
        p2.nombre_cliente,
        i.nombre AS insumo,
        ABS(m.cantidad)::numeric AS cantidad,
        i.unidad_medida
      FROM movimientos_inventario m
      JOIN tasks t   ON t.task_id = m.tarea_id
      JOIN pedidos p2 ON p2.pedido_id = t.pedido_id
      JOIN insumos i ON i.insumo_id = m.insumo_id
      WHERE m.tipo_movimiento = 'AJUSTE'
        AND m.tarea_id IS NOT NULL
    )

    SELECT 
      pedido_id,
      nombre_cliente,
      insumo,
      SUM(cantidad)::numeric AS cantidad,
      unidad_medida
    FROM base
    WHERE ($1::int IS NULL OR pedido_id = $1::int)
    GROUP BY pedido_id, nombre_cliente, insumo, unidad_medida
    ORDER BY pedido_id, insumo;
  `;

  const res = await pool.query(sql, [id]);
  return res.rows;
}

async function desperdicio(from, to) {
  const params = [];
  let where = "";

  if (from) {
    params.push(from);
    where += ` AND m.fecha_movimiento::date >= $${params.length}::date`;
  }
  if (to) {
    params.push(to);
    where += ` AND m.fecha_movimiento::date <= $${params.length}::date`;
  }

  // 🔹 Totales
  const totalesRes = await pool.query(
    `WITH totales AS (
       SELECT
         SUM(CASE WHEN tipo_movimiento = 'SALIDA' THEN -cantidad ELSE 0 END)::numeric AS total_salida,
         SUM(CASE WHEN tipo_movimiento = 'AJUSTE' AND cantidad < 0 THEN -cantidad ELSE 0 END)::numeric AS total_ajuste
       FROM movimientos_inventario m
       WHERE 1=1 ${where}
     )
     SELECT total_salida, total_ajuste,
            CASE WHEN total_salida > 0 
                 THEN ROUND((total_ajuste / total_salida)*100, 2) 
                 ELSE 0 END AS porcentaje
     FROM totales`,
    params
  );

  const resumen = totalesRes.rows[0];

  // 🔹 Detalle
  const detalleRes = await pool.query(
    `SELECT i.nombre AS insumo,
            SUM(-m.cantidad) AS cantidad_ajustada,
            i.unidad_medida,
            m.motivo,
            TO_CHAR(m.fecha_movimiento, 'YYYY-MM-DD') AS fecha
     FROM movimientos_inventario m
     JOIN insumos i ON i.insumo_id = m.insumo_id
     WHERE m.tipo_movimiento = 'AJUSTE' AND m.cantidad < 0
       ${where}
     GROUP BY i.nombre, i.unidad_medida, m.motivo, m.fecha_movimiento
     ORDER BY m.fecha_movimiento DESC`,
    params
  );

  return {
    ...resumen,
    detalle: detalleRes.rows,
  };
}


async function eficiencia(from, to) {
  const pedidosParams = [];
  let wherePedidos = "";

  if (from) {
    pedidosParams.push(from);
    wherePedidos += ` AND p.fecha_creacion::date >= $${pedidosParams.length}::date`;
  }
  if (to) {
    pedidosParams.push(to);
    wherePedidos += ` AND p.fecha_creacion::date <= $${pedidosParams.length}::date`;
  }

  // 🔹 Resumen pedidos
  const resPedidos = await pool.query(
    `SELECT COUNT(*) AS total, 
            COUNT(*) FILTER (WHERE estado='Terminado') AS completados
     FROM pedidos p
     WHERE 1=1 ${wherePedidos}`,
    pedidosParams
  );

  // 🔹 Resumen tareas (ojo aquí 👇)
  const tasksParams = [];
  let fechaFiltro = "";
  if (from) {
    tasksParams.push(from);
    fechaFiltro += ` AND t.fin::date >= $${tasksParams.length}::date`;
  }
  if (to) {
    tasksParams.push(to);
    fechaFiltro += ` AND t.fin::date <= $${tasksParams.length}::date`;
  }

  const resTasks = await pool.query(
    `SELECT COUNT(*) AS total, 
            COUNT(*) FILTER (WHERE estado='Terminado' ${fechaFiltro}) AS completados
     FROM tasks t`,
    tasksParams
  );

  // 🔹 Detalle por operario
  const detalle = await pool.query(
    `SELECT u.name AS operario,
            COUNT(*) FILTER (WHERE t.estado = 'Terminado' ${fechaFiltro})::int AS tareas_completadas
     FROM users u
     LEFT JOIN tasks t ON u.user_id = t.asignado_a
     WHERE LOWER(u.role) = 'operario'
     GROUP BY u.name
     ORDER BY tareas_completadas DESC`,
    tasksParams
  );

  return {
    resumen: {
      total_pedidos: Number(resPedidos.rows[0]?.total || 0),
      pedidos_completados: Number(resPedidos.rows[0]?.completados || 0),
      total_tareas: Number(resTasks.rows[0]?.total || 0),
      tareas_completadas: Number(resTasks.rows[0]?.completados || 0),
    },
    detalle: detalle.rows,
  };
}



module.exports = { produccion, tiempos, consumo, desperdicio, eficiencia };
