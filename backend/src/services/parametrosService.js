const pool = require('../db');

// Crear parámetro + reflejar en insumos
async function addParametroInsumo(valor, subcategoria, unidad, stock_actual, stock_minimo) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insertar en parametros
    const resParam = await client.query(
      `INSERT INTO parametros (categoria, valor, subcategoria, unidad, stock_actual, stock_minimo)
       VALUES ('Insumo', $1, $2, $3, $4, $5)
       RETURNING *`,
      [valor, subcategoria, unidad, stock_actual, stock_minimo]
    );

    // Insertar en insumos con referencia al parametro_id
    const codigo = `INS-${String(resParam.rows[0].parametro_id).padStart(5, "0")}`;
    const resInsumo = await client.query(
      `INSERT INTO insumos (nombre, unidad_medida, stock, stock_minimo, codigo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [valor, unidad, stock_actual, stock_minimo, codigo]
    );

    await client.query('COMMIT');
    return { parametro: resParam.rows[0], insumo: resInsumo.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Actualizar insumo + parametro
async function updateParametroInsumo(id, { valor, subcategoria, unidad, stock_actual, stock_minimo, activo }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resParam = await client.query(
      `UPDATE parametros
       SET valor = COALESCE($1, valor),
           subcategoria = COALESCE($2, subcategoria),
           unidad = COALESCE($3, unidad),
           stock_actual = COALESCE($4, stock_actual),
           stock_minimo = COALESCE($5, stock_minimo),
           activo = COALESCE($6, activo)
       WHERE parametro_id = $7
       RETURNING *`,
      [valor, subcategoria, unidad, stock_actual, stock_minimo, activo, id]
    );

    if (!resParam.rows[0]) throw new Error("Parámetro no encontrado");

    const codigo = `INS-${String(resParam.rows[0].parametro_id).padStart(5, "0")}`;
    await client.query(
      `UPDATE insumos
       SET nombre = $1,
           unidad_medida = $2,
           stock = $3,
           stock_minimo = $4
       WHERE codigo = $5`,
      [resParam.rows[0].valor, resParam.rows[0].unidad, resParam.rows[0].stock_actual, resParam.rows[0].stock_minimo, codigo]
    );

    await client.query('COMMIT');
    return resParam.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Eliminar insumo + parametro
async function deleteParametroInsumo(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resParam = await client.query(
      `DELETE FROM parametros WHERE parametro_id = $1 RETURNING *`,
      [id]
    );

    if (resParam.rows[0]) {
      const codigo = `INS-${String(resParam.rows[0].parametro_id).padStart(5, "0")}`;
      await client.query(`DELETE FROM insumos WHERE codigo = $1`, [codigo]);
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


// 🔹 Obtener parámetros por categoría
async function getParametros(categoria) {
  const res = await pool.query(
    `SELECT parametro_id, categoria, valor, activo 
     FROM parametros
     WHERE LOWER(categoria) = LOWER($1)
     ORDER BY valor ASC`,
    [categoria]
  );
  return res.rows;
}

// 🔹 Crear parámetro genérico
async function addParametro({ categoria, valor, subcategoria }) {
  const res = await pool.query(
    `INSERT INTO parametros (categoria, valor, subcategoria)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [categoria, valor, subcategoria || null]
  );
  return res.rows[0];
}

// 🔹 Actualizar parámetro genérico
async function updateParametro(id, { valor, subcategoria, unidad, stock_actual, stock_minimo, activo }) {
  const res = await pool.query(
    `UPDATE parametros
     SET valor = COALESCE($1, valor),
         subcategoria = COALESCE($2, subcategoria),
         unidad = COALESCE($3, unidad),
         stock_actual = COALESCE($4, stock_actual),
         stock_minimo = COALESCE($5, stock_minimo),
         activo = COALESCE($6, activo)
     WHERE parametro_id = $7
     RETURNING *`,
    [valor, subcategoria, unidad, stock_actual, stock_minimo, activo, id]
  );
  return res.rows[0];
}

// 🔹 Eliminar parámetro genérico
async function deleteParametro(id) {
  await pool.query(`DELETE FROM parametros WHERE parametro_id = $1`, [id]);
  return true;
}


module.exports = {
  addParametroInsumo,
  updateParametroInsumo,
  deleteParametroInsumo,

  //para parmetros genericos
  getParametros,
  addParametro,
  updateParametro,
  deleteParametro,



};
