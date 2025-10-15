const inventoryService = require('../services/inventoryService');

async function listarInsumos(req, res) {
  try {
    const insumos = await inventoryService.getAllInsumos();
    res.json(insumos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function crearInsumo(req, res) {
  try {
    const { nombre, unidad_medida, stock = 0, stock_minimo = 0 } = req.body;
    const nuevo = await inventoryService.addInsumo({ nombre, unidad_medida, stock, stock_minimo });
    res.status(201).json(nuevo);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function listarMovimientos(req, res) {
  try {
    const filtros = req.query;
    const movimientos = await inventoryService.getMovimientos(filtros);
    res.json(movimientos);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function crearMovimiento(req, res) {
  try {
    const responsable_id = req.user ? req.user.user_id : null;
    const payload = { ...req.body, responsable_id };
    const result = await inventoryService.addMovement(payload);
    res.status(201).json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

/* ============= */
/*   INSUMOS     */
/* ============= */
async function listInsumos(req, res) {
  try {
    const data = await inventoryService.listInsumos();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/* ============= */
/*  CONSUMOS     */
/* ============= */
async function registrarConsumoRapido(req, res) {
  try {
    const { taskId, insumoId, cantidad, motivo } = req.body;
    const user = req.user;

    if (!user || user.role.toLowerCase() !== 'operario') {
      return res.status(403).json({ error: 'Solo operarios pueden registrar consumo' });
    }

    const out = await inventoryService.registrarConsumoRapido(
      Number(taskId), Number(insumoId), Number(cantidad), String(motivo || 'normal'), user.user_id
    );
    res.json(out);
  } catch (err) {
    console.error('registrarConsumoRapido:', err);
    res.status(400).json({ error: err.message });
  }
}

/* ============= */
/*  INCIDENCIAS  */
/* ============= */
async function reportarIncidencia(req, res) {
  try {
    const { taskId, tipo, descripcion, urgencia, fotoUrl } = req.body;
    const user = req.user;

    if (!user || user.role.toLowerCase() !== 'operario') {
      return res.status(403).json({ error: 'Solo operarios pueden reportar incidencias' });
    }

    const out = await inventoryService.reportarIncidencia(
      Number(taskId), user.user_id, String(tipo), String(descripcion), String(urgencia), fotoUrl || null
    );
    res.json(out);
  } catch (err) {
    console.error('reportarIncidencia:', err);
    res.status(400).json({ error: err.message });
  }
}

async function getIncidencias(req, res) {
  try {
    const data = await inventoryService.getIncidencias();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateIncidenciaEstado(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const out = await inventoryService.updateIncidenciaEstado(Number(id), String(estado));
    res.json(out);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/* ============= */
/*  HISTORIAL    */
/* ============= */
async function getHistorial(req, res) {
  try {
    const { taskId } = req.params;
    const consumos = await inventoryService.getHistorialConsumos(Number(taskId));
    const incidencias = await inventoryService.getHistorialIncidencias(Number(taskId));
    res.json({ consumos, incidencias });
  } catch (err) {
    console.error('getHistorial:', err);
    res.status(500).json({ error: err.message });
  }
}

async function getAlertasStock(req, res) {
  try {
    const alertas = await inventoryService.getAlertasStock();
    res.json(alertas);
  } catch (err) {
    console.error("getAlertasStock error:", err);
    res.status(500).json({ error: err.message });
  }
}

async function getKardex(req, res) {
  try {
    const { desde, hasta, tipo, insumoId } = req.query;
    const data = await inventoryService.getKardex({ desde, hasta, tipo, insumoId });
    res.json(data);
  } catch (err) {
    console.error('getKardex error:', err);
    res.status(500).json({ error: err.message });
  }
}



// Obtener lista de insumos (para select dinámico)
async function getInsumos(req, res) {
  try {
    const result = await pool.query(
      `SELECT insumo_id, nombre, unidad_medida 
       FROM insumos 
       ORDER BY nombre ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getInsumos error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { 
  listarInsumos, 
  crearInsumo, 
  listarMovimientos, 
  crearMovimiento,
    // insumos
  listInsumos,

  // consumo rápido
  registrarConsumoRapido,

  // incidencias
  reportarIncidencia,
  getIncidencias,
  updateIncidenciaEstado,

  // historial
  getHistorial,

  //stock minimo
  getAlertasStock,

  // para kardex
  getKardex,
  getInsumos,
};
