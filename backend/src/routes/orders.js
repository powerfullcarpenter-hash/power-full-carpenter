const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth.optional, orderController.getOrders);
router.post('/', auth.required, orderController.createOrder);

// PATCH /api/orders/:pedidoId/status
router.patch('/:pedidoId/status', auth.required, orderController.updateStatus);

module.exports = router;

// Nuevo endpoint con filtros
router.get('/filtered', auth.optional, orderController.getOrdersFiltered);



// nuevos
router.put("/orders/:pedidoId", orderController.editOrder);
router.post("/orders/:pedidoId/duplicate", orderController.duplicateOrder);

// 👇 debe ser solo ":pedidoId"
router.put("/:pedidoId", orderController.updateOrder);


router.post("/:pedidoId/duplicate", orderController.duplicateOrder); // 👈 NUEVO

// Ejemplo de un backend con Express
router.patch('/orders/:id/status', async (req, res) => {
  try {
    // Asegúrate de que la clave aquí coincida con la que envías desde el frontend.
    // Si el frontend envía `estado`, el backend debe usar `req.body.estado`.
    const { estado } = req.body; 
    const pedidoId = req.params.id;

    // Lógica de actualización de la base de datos
    // ... por ejemplo:
    // await Order.update({ estado: estado }, { where: { id: pedidoId } });

    res.status(200).json({ message: 'Pedido actualizado.' });

  } catch (error) {
    // Este `console.error` te mostrará el error real en la terminal del servidor.
    console.error('Error en el servidor:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});





