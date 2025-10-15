const pool = require('../db');


async function getUsers({ role } = {}) {
  const params = [];
  let where = '';
  if (role) {
    params.push(role);
    where = `WHERE role = $${params.length}`;
  }
  const sql = `SELECT user_id, name, email, role FROM users ${where} ORDER BY name`;
  const res = await pool.query(sql, params);
  return res.rows;
}

module.exports = { getUsers };
