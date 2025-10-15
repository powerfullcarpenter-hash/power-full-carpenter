const express = require('express'); 
const router = express.Router();
const insumosController = require('../controllers/insumosController');
const pool = require('../db');   // 🔹 Te faltaba importar pool aquí

// CRUD Insumos
router.get('/', insumosController.getInsumos);
router.post('/', insumosController.addInsumo);
router.put('/:id', insumosController.updateInsumo);
router.delete('/:id', insumosController.deleteInsumo);

// GET niveles de stock
router.get('/niveles', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT insumo_id, nombre, unidad_medida, stock, stock_minimo
       FROM insumos
       ORDER BY nombre ASC`
    );

    // Clasificar con alerta (convertimos a número)
    const data = result.rows.map(i => {
      const stock = Number(i.stock);
      const minimo = Number(i.stock_minimo);

      return {
        ...i,
        stock,
        stock_minimo: minimo,
        alerta: stock < minimo ? "BAJO" : "OK"
      };
    });

    res.json(data);
  } catch (err) {
    console.error("Error en /insumos/niveles:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
