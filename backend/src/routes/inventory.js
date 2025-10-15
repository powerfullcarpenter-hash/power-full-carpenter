const express = require('express');
const router = express.Router();

// Importaciones unificadas
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Definición de rutas
router.get('/insumos', authMiddleware.optional, inventoryController.listarInsumos);
router.post('/insumos', authMiddleware.required, inventoryController.crearInsumo);

router.get('/movimientos', authMiddleware.optional, inventoryController.listarMovimientos);
router.post('/movimientos', authMiddleware.required, inventoryController.crearMovimiento);

// Consumo rápido (Operario)
router.post('/consumo', authMiddleware.required, inventoryController.registrarConsumoRapido);

// Incidencias
router.post('/incidencia', authMiddleware.required, inventoryController.reportarIncidencia);
router.get('/incidencias', authMiddleware.required, inventoryController.getIncidencias);
router.put('/incidencia/:id', authMiddleware.required, inventoryController.updateIncidenciaEstado);

// Historial por tarea
router.get('/historial/:taskId', authMiddleware.required, inventoryController.getHistorial);

// Endpoint de alertas de stock bajo
router.get('/alertas', authMiddleware.required, inventoryController.getAlertasStock);

// Kardex
router.get('/kardex', authMiddleware.required, inventoryController.getKardex);



// Agregamos ruta de insumos
router.get('/insumos', authMiddleware.required, inventoryController.getInsumos);


module.exports = router;