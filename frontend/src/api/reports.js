import client from './client';

export const getProduccion = (from, to) => client.get('/reports/produccion', { params: { from, to } }).then(r => r.data);
export const getTiempos = () => client.get('/reports/tiempos').then(r => r.data);
export const getConsumo = (pedido_id) => client.get('/reports/consumo', { params: { pedido_id } }).then(r => r.data);

export const getDesperdicio = (from, to) =>
  client.get('/reports/desperdicio', { params: { from, to } }).then(r => r.data);


export const getEficiencia = (from, to) =>
  client.get("/reports/eficiencia", { params: { from, to } }).then((r) => r.data);
