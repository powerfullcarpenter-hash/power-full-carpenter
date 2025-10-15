const orderService = require('../services/orderService');

async function getOrders(req, res) {
  try {
    const orders = await orderService.getOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}



async function createOrder(req, res) {
  try {
    const payload = req.body;
    const responsable_id = req.user ? req.user.user_id : null;

    // Normalizamos valores de área y prioridad (para evitar mayúsculas/minúsculas inconsistentes)
    if (payload.area) {
      payload.area = payload.area.trim();
    }
    if (payload.prioridad) {
      payload.prioridad = payload.prioridad.trim();
    }

    // Pasamos al service con el responsable
    const order = await orderService.createOrder({ ...payload, responsable_id });
    res.status(201).json(order);
  } catch (err) {
    console.error("Error en createOrder:", err.message);
    res.status(400).json({
      error: err.message || "Error creando pedido. Verifica los datos enviados."
    });
  }
}


async function updateStatus(req, res) {
  try {
    const { pedidoId } = req.params;
    const { estado } = req.body;

    // validar estado permitido
    if (!['En Proceso', 'Terminado', 'Cancelado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    const pedido = await orderService.updateOrderStatus(pedidoId, estado);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(pedido);
  } catch (err) {
    console.error('Error en updateStatus:', err);
    res.status(500).json({ error: err.message });
  }
}

async function getOrdersFiltered(req, res) {
  try {
    const { estado, area, prioridad, desde, hasta } = req.query;
    const pedidos = await orderService.getOrdersFiltered({
      estado,
      area,
      prioridad,
      desde,
      hasta,
    });
    res.json(pedidos);
  } catch (err) {
    console.error('Error en getOrdersFiltered:', err);
    res.status(500).json({ error: err.message });
  }
}



async function editOrder(req, res) {
  try {
    const { pedidoId } = req.params;
    const updated = await orderService.editOrder(pedidoId, req.body);
    if (!updated) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(updated);
  } catch (err) {
    console.error("Error en editOrder:", err);
    res.status(500).json({ error: err.message });
  }
}

async function duplicateOrder(req, res) {
  try {
    const { pedidoId } = req.params;

    const newOrder = await orderService.duplicateOrder(pedidoId);

    res.status(201).json(newOrder);
  } catch (err) {
    console.error("Error en duplicateOrder:", err);
    res.status(500).json({ error: err.message });
  }
}


async function updateOrder(req, res) {
  try {
    const { pedidoId } = req.params;
    const payload = req.body;

    const updated = await orderService.updateOrder(pedidoId, payload);
    if (!updated) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error en updateOrder:", err);
    res.status(500).json({ error: err.message });
  }
}



module.exports = { 
  getOrders, 
  createOrder, 
  updateStatus, 
  getOrdersFiltered,
  editOrder,
  duplicateOrder,
  updateOrder
 };
