const taskService = require('../services/taskService');

// Mapear estado del frontend a estado válido en DB
function mapEstado(estado) {
  switch (estado) {
    case 'To Do':
    case 'Por Hacer':
      return 'Por Hacer';
    case 'In Progress':
    case 'En Curso':
      return 'En Curso';
    case 'Done':
    case 'Terminado':
      return 'Terminado';
    default:
      return estado; // fallback: lo que venga
  }
}

async function getTasks(req, res) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    let tasks = [];
    if (user.role && user.role.toLowerCase() === 'supervisor') {
      tasks = await taskService.getAllTasks();
    } else {
      tasks = await taskService.getTasksByUser(user.user_id);
    }

    res.json(tasks);
  } catch (err) {
    console.error('❌ Error en getTasks:', err);
    res.status(500).json({ error: err.message });
  }
}

async function updateTaskStatus(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) return res.status(400).json({ error: 'Campo estado requerido' });

    const newStateDb = mapEstado(estado);
    const task = await taskService.updateTaskStatus(Number(id), newStateDb);

    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    res.json(task);
  } catch (err) {
    console.error('❌ Error en updateTaskStatus:', err);
    res.status(500).json({ error: err.message });
  }
}

async function startTask(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;
    const task = await taskService.startTask(Number(id), user.user_id, user.role);
    res.json(task);
  } catch (err) {
    console.error('❌ Error en startTask:', err);
    res.status(400).json({ error: err.message });
  }
}

async function pauseTask(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;
    const task = await taskService.pauseTask(Number(id), user.user_id, user.role);
    res.json(task);
  } catch (err) {
    console.error('❌ Error en pauseTask:', err);
    res.status(400).json({ error: err.message });
  }
}

async function finishTask(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;
    const task = await taskService.finishTask(Number(id), user.user_id, user.role);
    res.json(task);
  } catch (err) {
    console.error('❌ Error en finishTask:', err);
    res.status(400).json({ error: err.message });
  }
}

// Extra: obtener todas las tareas de un pedido
async function getTasksByPedido(req, res) {
  try {
    const { pedidoId } = req.params;
    const tasks = await taskService.getTasksByOrder(Number(pedidoId));
    res.json(tasks);
  } catch (err) {
    console.error('❌ Error en getTasksByPedido:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getTasks,
  updateTaskStatus,
  startTask,
  pauseTask,
  finishTask,
  getTasksByPedido,
};
