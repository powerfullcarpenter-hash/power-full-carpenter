const express = require("express");
const router = express.Router();
const parametrosController = require("../controllers/parametrosController");
// 👇 Asegúrate de importar tu conexión a la BD
const pool = require('../db');   // <-- ESTA LÍNEA ES LA QUE FALTA

router.get("/", parametrosController.getParametros);
router.post("/", parametrosController.addParametro);
router.put("/:id", parametrosController.updateParametro);
router.delete("/:id", parametrosController.deleteParametro);

module.exports = router;
