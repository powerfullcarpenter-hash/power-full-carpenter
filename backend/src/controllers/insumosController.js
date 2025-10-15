const insumosService = require('../services/insumosService');

async function getInsumos(req, res) {
  try {
    const data = await insumosService.getInsumos();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addInsumo(req, res) {
  try {
    const nuevo = await insumosService.addInsumo(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateInsumo(req, res) {
  try {
    const { id } = req.params;
    const actualizado = await insumosService.updateInsumo(id, req.body);
    if (!actualizado) return res.status(404).json({ error: "Insumo no encontrado" });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteInsumo(req, res) {
  try {
    const { id } = req.params;
    await insumosService.deleteInsumo(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET normal
exports.getInsumos = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM insumos ORDER BY insumo_id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET niveles de stock
exports.getNivelesStock = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        insumo_id,
        nombre,
        unidad_medida,
        stock,
        stock_minimo,
        CASE 
          WHEN stock < stock_minimo THEN 'Bajo'
          ELSE 'OK'
        END as estado
      FROM insumos
      ORDER BY nombre ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getInsumos, addInsumo, updateInsumo, deleteInsumo };
