// /backend/src/routes/kanban.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');

// Listar tareas
router.get('/tasks', auth.required, taskController.getTasks);
router.get('/tasks/pedido/:pedidoId', auth.required, taskController.getTasksByPedido);

// Soportar ambos endpoints por compatibilidad:
// PUT /kanban/tasks/:id/status
router.put('/tasks/:id/status', auth.required, taskController.updateTaskStatus);
// PUT /kanban/tasks/:id (alias)
router.put('/tasks/:id', auth.required, taskController.updateTaskStatus);

// Temporizador / acciones
router.post('/tasks/:id/start', auth.required, taskController.startTask);
router.post('/tasks/:id/pause', auth.required, taskController.pauseTask);
router.post('/tasks/:id/finish', auth.required, taskController.finishTask);

module.exports = router;
