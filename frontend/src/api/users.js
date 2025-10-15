import client from './client';

// 🔹 Obtener todos los usuarios o filtrados por rol
export async function getUsers(params = {}) {
  const res = await client.get('/users', { params });
  return res.data;
}

// 🔹 Agregar un nuevo usuario
export async function addUser(user) {
  const res = await client.post('/users', user);
  return res.data;
}

// 🔹 Actualizar rol de un usuario
export async function updateUserRole(id, role) {
  const res = await client.put(`/users/${id}/role`, { role });
  return res.data;
}

// 🔹 Eliminar usuario
export async function deleteUser(id) {
  const res = await client.delete(`/users/${id}`);
  return res.data;
}

// 🔹 Obtener únicamente operarios (endpoint dedicado)
export async function getOperarios() {
  const res = await client.get('/users/operarios');
  return res.data;
}

// Habilitar/Inhabilitar usuario
export const toggleUserActive = (id, activo) =>
  client.put(`/users/${id}/active`, { activo }).then(r => r.data);
