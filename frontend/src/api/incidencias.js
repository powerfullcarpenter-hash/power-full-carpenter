// /frontend/src/api/incidencias.js
import client from './client';

export const reportarIncidencia = (data) => {
  return client.post("/inventory/incidencia", data).then((r) => r.data);
};
