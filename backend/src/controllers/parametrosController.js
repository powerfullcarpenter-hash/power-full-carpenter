const parametrosService = require('../services/parametrosService');

// 🔹 GET por categoría
async function getParametros(req, res) {
  try {
    const { categoria } = req.query;
    if (!categoria) {
      return res.status(400).json({ error: "Debe especificar una categoría" });
    }

    const data = await parametrosService.getParametros(categoria);
    res.json(data);
  } catch (err) {
    console.error("Error en getParametros:", err);
    res.status(500).json({ error: err.message });
  }
}

// 🔹 POST
async function addParametro(req, res) {
  try {
    const { categoria, valor, subcategoria, unidad, stock_actual, stock_minimo } = req.body;

    if (categoria.toLowerCase() === "insumo") {
      const nuevo = await parametrosService.addParametroInsumo(valor, subcategoria, unidad, stock_actual, stock_minimo);
      return res.status(201).json(nuevo);
    }

    const nuevo = await parametrosService.addParametro({ categoria, valor, subcategoria });
    res.status(201).json(nuevo);
  } catch (err) {
    console.error("Error en addParametro:", err);
    res.status(500).json({ error: err.message });
  }
}

// 🔹 PUT
async function updateParametro(req, res) {
  try {
    const { id } = req.params;
    const { valor, subcategoria, unidad, stock_actual, stock_minimo, activo } = req.body;

    let actualizado;
    if (req.body.categoria?.toLowerCase() === "insumo") {
      actualizado = await parametrosService.updateParametroInsumo(id, { valor, subcategoria, unidad, stock_actual, stock_minimo, activo });
    } else {
      actualizado = await parametrosService.updateParametro(id, { valor, subcategoria, unidad, stock_actual, stock_minimo, activo });
    }

    res.json(actualizado);
  } catch (err) {
    console.error("Error en updateParametro:", err);
    res.status(500).json({ error: err.message });
  }
}

// 🔹 DELETE
async function deleteParametro(req, res) {
  try {
    const { id } = req.params;

    if (req.query.categoria?.toLowerCase() === "insumo") {
      await parametrosService.deleteParametroInsumo(id);
    } else {
      await parametrosService.deleteParametro(id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error en deleteParametro:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getParametros,
  addParametro,
  updateParametro,
  deleteParametro
};
