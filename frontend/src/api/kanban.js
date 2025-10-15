// /frontend/src/api/kanban.js
import client from './client';

export const getTasks = () =>
  client.get('/kanban/tasks').then((r) => r.data);

export const getTasksByPedido = (pedidoId) =>
  client.get(`/kanban/tasks/pedido/${pedidoId}`).then((r) => r.data);

// NOTA: usamos /status y enviamos { estado: "Por Hacer" }
export const updateTaskStatus = (taskId, data) =>
  client.put(`/kanban/tasks/${taskId}/status`, data).then((r) => r.data);

export const startTask = (taskId) =>
  client.post(`/kanban/tasks/${taskId}/start`).then((r) => r.data);

export const pauseTask = (taskId) =>
  client.post(`/kanban/tasks/${taskId}/pause`).then((r) => r.data);

export const finishTask = (taskId) =>
  client.post(`/kanban/tasks/${taskId}/finish`).then((r) => r.data);
