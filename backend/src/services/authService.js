const pool = require('../db');
const bcrypt = require('bcryptjs');
const { signToken } = require('../utils/jwt');

async function login(email, password) {
  if (!email || typeof email !== 'string') throw new Error('Email inválido');
  if (!password || typeof password !== 'string') throw new Error('Password inválido');

  const emailClean = email.trim().toLowerCase();

  const res = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1',
    [emailClean]
  );

  if (!res.rows.length) throw new Error('Usuario no encontrado');

  const user = res.rows[0];

  // 🔹 Validar si está activo
  if (!user.activo) throw new Error('Usuario inhabilitado. Contacta al administrador.');

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new Error('Contraseña incorrecta');

  const token = signToken(user);

  return {
    token,
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    activo: user.activo,
  };
}


async function register({ name, email, password, role }) {
  if (!email || typeof email !== 'string') throw new Error('Email inválido');

  const emailClean = email.trim().toLowerCase();
  const hash = await bcrypt.hash(password, 10);

  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, name, email, role`,
    [name, emailClean, hash, role]
  );

  return res.rows[0];
}

module.exports = { login, register };
