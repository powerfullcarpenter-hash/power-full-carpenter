// src/controllers/usersController.js
const pool = require('../db');
const bcrypt = require('bcryptjs');

// Roles permitidos (deben coincidir con el CHECK de la tabla)
const ROLES_PERMITIDOS = ['Supervisor', 'Inventario', 'Operario'];
const normalizaRol = (r) => {
  if (!r) return null;
  const up = String(r).trim().toLowerCase();
  if (up === 'supervisor') return 'Supervisor';
  if (up === 'inventario') return 'Inventario';
  if (up === 'operario') return 'Operario';
  return null;
};

// Listar todos los usuarios
// Listar todos los usuarios
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, name, email, role, activo
       FROM users
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: err.message });
  }
};


// Agregar un nuevo usuario (HASH de contraseña)
exports.addUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Faltan datos (name, email, password, role)' });
    }

    const emailClean = String(email).trim().toLowerCase();
    const rolNormalizado = normalizaRol(role);
    if (!rolNormalizado || !ROLES_PERMITIDOS.includes(rolNormalizado)) {
      return res.status(400).json({ error: 'Rol inválido. Use Supervisor | Inventario | Operario' });
    }

    // ¿Email ya existe?
    const dup = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = $1', [emailClean]);
    if (dup.rowCount > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, name, email, role`,
      [name, emailClean, hash, rolNormalizado]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('addUser error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Actualizar rol de un usuario
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const rolNormalizado = normalizaRol(req.body.role);

    if (!rolNormalizado) {
      return res.status(400).json({ error: 'Rol inválido. Use Supervisor | Inventario | Operario' });
    }

    const result = await pool.query(
      `UPDATE users
       SET role = $1
       WHERE user_id = $2
       RETURNING user_id, name, email, role`,
      [rolNormalizado, id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateUserRole error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Eliminar usuario
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM users WHERE user_id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ error: err.message });
  }
};


// Listar únicamente usuarios con rol Operario
exports.getOperarios = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, name, email
       FROM users
       WHERE role = 'Operario'
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getOperarios error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Activar/Inhabilitar usuario
exports.toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET activo = $1 
       WHERE user_id = $2 
       RETURNING user_id, name, email, role, activo`,
      [activo, id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('toggleUserActive error:', err);
    res.status(500).json({ error: err.message });
  }
};
