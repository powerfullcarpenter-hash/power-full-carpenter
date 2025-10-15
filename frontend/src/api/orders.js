// /frontend/src/api/orders.js
import client from './client';

export async function getOrders() {
  const res = await client.get('/orders');
  return res.data;
}

export async function createOrder(order) {
  const res = await client.post('/orders', order);
  return res.data;
}

// actualizar estado
export const updateOrderStatus = (pedidoId, estado) =>
  client.patch(`/orders/${pedidoId}/status`, { estado }).then((res) => res.data);


// 🔍 obtener pedidos filtrados desde el backend
export async function getOrdersFiltered(params = {}) {
  const query = {};
  Object.keys(params).forEach((k) => {
    if (params[k] !== null && params[k] !== undefined && params[k] !== "") {
      query[k] = params[k];
    }
  });
  const res = await client.get("/orders/filtered", { params: query });
  return res.data;
}



export const updateOrder = (pedidoId, order) =>
  client.put(`/orders/${pedidoId}`, order).then((res) => res.data);


// Duplicar pedido
export async function duplicateOrder(pedidoId) {
  const res = await client.post(`/orders/${pedidoId}/duplicate`);
  return res.data;
}
