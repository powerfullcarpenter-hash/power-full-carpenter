import client from './client';

export const getInsumos = () => client.get('/inventory/insumos').then(r => r.data);
export const createInsumo = (payload) => client.post('/inventory/insumos', payload).then(r => r.data);

export const getMovimientos = (params) => client.get('/inventory/movimientos', { params }).then(r => r.data);
export const postMovimiento = (payload) => client.post('/inventory/movimientos', payload).then(r => r.data);

// NUEVOS ENDPOINTS
export const getConsumos = () => client.get('/inventory/consumos').then(r => r.data);
export const getIncidencias = () => client.get('/inventory/incidencias').then(r => r.data);

export const updateIncidenciaEstado = (id, estado) =>
  client.put(`/inventory/incidencia/${id}`, { estado }).then(r => r.data);

export const getHistorial = (taskId) =>
  client.get(`/inventory/historial/${taskId}`).then(r => r.data);

// Nuevo: registrar consumo rápido
export const registrarConsumoRapido = (data) =>
  client.post('/inventory/consumo', data).then(r => r.data);


export const getAlertas = () =>
  client.get('/inventory/alertas').then(r => r.data);


export const getKardex = (params) =>
  client.get("/inventory/kardex", { params }).then((r) => r.data);
