// controllers/clientesController.js
const clientesService = require("../services/clientesService");

// Obtener todos los clientes
async function getClientes(req, res) {
  try {
    const clientes = await clientesService.getClientes();
    res.json(clientes);
  } catch (err) {
    console.error("Error en getClientes:", err);
    res.status(500).json({ error: "Error al obtener clientes" });
  }
}

// Agregar cliente
async function addCliente(req, res) {
  try {
    const { nombre, telefono, correo, direccion } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre del cliente es obligatorio" });
    }

    const nuevoCliente = await clientesService.addCliente({
      nombre: nombre.trim(),
      telefono: telefono?.trim() || null,
      correo: correo?.trim() || null,
      direccion: direccion?.trim() || null,
    });

    res.status(201).json(nuevoCliente);
  } catch (err) {
    console.error("Error en addCliente:", err);
    res.status(500).json({ error: "Error al registrar cliente" });
  }
}

// Actualizar cliente
async function updateCliente(req, res) {
  try {
    const { id } = req.params;
    const { nombre, telefono, correo, direccion } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre del cliente es obligatorio" });
    }

    const updated = await clientesService.updateCliente(id, {
      nombre: nombre.trim(),
      telefono: telefono?.trim() || null,
      correo: correo?.trim() || null,
      direccion: direccion?.trim() || null,
    });

    if (!updated) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Error en updateCliente:", err);
    res.status(500).json({ error: "Error al actualizar cliente" });
  }
}

// Eliminar cliente
async function deleteCliente(req, res) {
  try {
    const { id } = req.params;
    const deleted = await clientesService.deleteCliente(id);

    if (!deleted) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ success: true, message: "Cliente eliminado correctamente" });
  } catch (err) {
    console.error("Error en deleteCliente:", err);
    res.status(500).json({ error: "Error al eliminar cliente" });
  }
}

module.exports = {
  getClientes,
  addCliente,
  updateCliente,
  deleteCliente,
};
