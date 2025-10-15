import client from "./client";

/* ============================
   CRUD genérico de parámetros
   ============================ */

// Obtener parámetros por categoría
export async function getParametros(categoria) {
  const res = await client.get(`/parametros?categoria=${categoria}`);
  return res.data;
}

// Agregar nuevo parámetro
export async function addParametro(categoria, valor) {
  const res = await client.post("/parametros", { categoria, valor });
  return res.data;
}

// Actualizar parámetro
export async function updateParametro(id, valor, categoria) {
  const res = await client.put(`/parametros/${id}`, { valor, categoria });
  return res.data;
}

// Eliminar parámetro
export async function deleteParametro(id, categoria) {
  const res = await client.delete(`/parametros/${id}?categoria=${categoria}`);
  return res.data;
}

/* ============================
   Extensiones específicas
   ============================ */

// Motivos de Consumo / Desperdicio
export async function getMotivos() {
  // usa la misma tabla "parametros" → categoria = 'motivos_consumo'
  return getParametros("motivos_consumo");
}

// (opcional) Prioridades - por consistencia
export async function getPrioridades() {
  return getParametros("prioridades");
}
