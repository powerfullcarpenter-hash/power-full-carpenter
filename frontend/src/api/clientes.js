import client from "./client";

// 🔹 Obtener clientes
export async function getClientes() {
  const res = await client.get("/clientes");
  return res.data;
}

// 🔹 Agregar cliente (con todos los campos)
export async function addCliente({ nombre, telefono, correo, direccion }) {
  const res = await client.post("/clientes", {
    nombre,
    telefono,
    correo,
    direccion,
  });
  return res.data;
}

// 🔹 Actualizar cliente
export async function updateCliente(clienteId, { nombre, telefono, correo, direccion }) {
  const res = await client.put(`/clientes/${clienteId}`, {
    nombre,
    telefono,
    correo,
    direccion,
  });
  return res.data;
}

// 🔹 Eliminar cliente
export async function deleteCliente(clienteId) {
  const res = await client.delete(`/clientes/${clienteId}`);
  return res.data;
}
