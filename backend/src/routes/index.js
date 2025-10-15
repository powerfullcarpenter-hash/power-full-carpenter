const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const kanbanRoutes = require('./kanban');
const inventoryRoutes = require('./inventory');
const reportsRoutes = require('./reports');
const ordersRoutes = require('./orders');
const clientesRoutes = require("./clientes"); // <-- RUTA DE CLIENTES AGREGADA


router.use('/auth', authRoutes);
router.use('/kanban', kanbanRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/reports', reportsRoutes);
router.use('/orders', ordersRoutes);
router.use('/users', require('./users'));
router.use('/kanban', require('./kanban'));
router.use('/inventory', require('./inventory')); // << aquí

router.use('/parametros', require('./parametros'));
router.use('/insumos', require('./insumos')); // ✅ CRUD completo de insumos
// 📌 Registrar las rutas
router.use("/clientes", clientesRoutes);



module.exports = router;
