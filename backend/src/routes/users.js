const express = require('express');
const router = express.Router();
const usersController = require('../controllers/userController');

// Listar todos los usuarios
router.get('/', usersController.getUsers);

// Agregar usuario
router.post('/', usersController.addUser);

// Actualizar rol
router.put('/:id/role', usersController.updateUserRole);

// Eliminar usuario
router.delete('/:id', usersController.deleteUser);

// 🔹 Nuevo: listar solo operarios
router.get('/operarios', async (req, res) => {
  const pool = require('../db');
  try {
    const result = await pool.query(
      `SELECT user_id, name, email 
       FROM users 
       WHERE role = 'Operario'
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error en /users/operarios:", err);
    res.status(500).json({ error: err.message });
  }
});

// Activar/Inhabilitar usuario
router.put('/:id/active', usersController.toggleUserActive);


module.exports = router;
