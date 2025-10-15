import client from "./client";

export const getInsumos = async () => {
  const res = await client.get("/insumos");
  return res.data;
};

export const getInsumoById = async (id) => {
  const res = await client.get(`/insumos/${id}`);
  return res.data;
};

export const addInsumo = async (data) => {
  const res = await client.post("/insumos", data);
  return res.data;
};

export const updateInsumo = async (id, data) => {
  const res = await client.put(`/insumos/${id}`, data);
  return res.data;
};

export const deleteInsumo = async (id) => {
  const res = await client.delete(`/insumos/${id}`);
  return res.data;
};

export const getNivelesStock = async () => {
  const res = await client.get("/insumos/niveles");
  return res.data;
};
