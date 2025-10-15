const reportService = require('../services/reportService');

async function produccion(req, res) {
  try {
    const { from, to } = req.query;
    const data = await reportService.produccion(from, to);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function tiempos(req, res) {
  try {
    const data = await reportService.tiempos();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function consumo(req, res) {
  try {
    const { pedido_id } = req.query;
    const data = await reportService.consumo(pedido_id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function desperdicio(req, res) {
  try {
    const { from, to } = req.query; //  capturar filtros del frontend
    const data = await reportService.desperdicio(from, to); //  pasarlos al service
    res.json(data);
  } catch (e) {
    console.error("Error en desperdicio:", e);
    res.status(500).json({ error: e.message });
  }
}


// src/controllers/reportsController.js

async function eficiencia(req, res) {
  try {
    let { from, to } = req.query;

    // ✅ Ajustar "to" para que incluya todo el día
    if (to) {
      to = new Date(to);
      to.setDate(to.getDate() + 1);   // sumamos 1 día
      to = to.toISOString().split("T")[0]; // devolvemos solo YYYY-MM-DD
    }

    const data = await reportService.eficiencia(from, to);
    res.json(data);
  } catch (e) {
    console.error("Error en eficiencia:", e);
    res.status(500).json({ error: e.message });
  }
}




module.exports = { produccion, tiempos, consumo, desperdicio, eficiencia };
