const pool = require('../db');

// Listar insumos
async function getInsumos() {
  const res = await pool.query(
    `SELECT insumo_id, nombre, unidad_medida, stock, stock_minimo, subcategoria, creado_en
     FROM insumos
     ORDER BY insumo_id DESC`
  );
  return res.rows;
}

// Crear insumo
async function addInsumo({ nombre, unidad_medida, stock, stock_minimo, subcategoria }) {
  const res = await pool.query(
    `INSERT INTO insumos (nombre, unidad_medida, stock, stock_minimo, subcategoria)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [nombre, unidad_medida, stock, stock_minimo, subcategoria]
  );
  return res.rows[0];
}

// Actualizar insumo
async function updateInsumo(id, { nombre, unidad_medida, stock, stock_minimo, subcategoria }) {
  const res = await pool.query(
    `UPDATE insumos
     SET nombre = COALESCE($1, nombre),
         unidad_medida = COALESCE($2, unidad_medida),
         stock = COALESCE($3, stock),
         stock_minimo = COALESCE($4, stock_minimo),
         subcategoria = COALESCE($5, subcategoria)
     WHERE insumo_id = $6
     RETURNING *`,
    [nombre, unidad_medida, stock, stock_minimo, subcategoria, id]
  );
  return res.rows[0];
}

// Eliminar insumo
async function deleteInsumo(id) {
  await pool.query(`DELETE FROM insumos WHERE insumo_id = $1`, [id]);
  return { success: true };
}

module.exports = { getInsumos, addInsumo, updateInsumo, deleteInsumo };
