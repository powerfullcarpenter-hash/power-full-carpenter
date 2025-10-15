const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const auth = require('../middleware/authMiddleware');

router.get('/produccion', auth.required, reportsController.produccion);
router.get('/tiempos', auth.required, reportsController.tiempos);
router.get('/consumo', auth.required, reportsController.consumo);
router.get('/desperdicio', auth.required, reportsController.desperdicio);
router.get('/eficiencia', auth.required, reportsController.eficiencia);

module.exports = router;
