// routes/clientes.js
const express = require("express");
const router = express.Router();
const clientesController = require("../controllers/clientesController");
const auth = require("../middleware/authMiddleware");


// 📋 Obtener todos los clientes
router.get("/", clientesController.getClientes);

// ➕ Agregar cliente
router.post("/", clientesController.addCliente);

// ✏️ Actualizar cliente
router.put("/:id", clientesController.updateCliente);

// ❌ Eliminar cliente
router.delete("/:id", clientesController.deleteCliente);

module.exports = router;

