const taskService = require('../services/taskService');

async function listarTasks(req, res) {
  try {
    const filtros = req.query;
    const tasks = await taskService.getTasks(filtros);
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function crearTask(req, res) {
  try {
    const payload = req.body;
    const nueva = await taskService.createTask(payload);
    res.status(201).json(nueva);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function cambiarEstado(req, res) {
  try {
    const taskId = req.params.id;
    const { estado } = req.body;
    await taskService.updateStatus(taskId, estado);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = { listarTasks, crearTask, cambiarEstado };
