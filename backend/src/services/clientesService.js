// services/clientesService.js
const pool = require("../db");

// Obtener todos los clientes con su número de pedidos
async function getClientes() {
  const res = await pool.query(
    `SELECT c.cliente_id, 
            c.nombre, 
            c.telefono, 
            c.correo, 
            c.direccion, 
            c.fecha_creacion,
            COUNT(p.pedido_id) AS total_pedidos
     FROM clientes c
     LEFT JOIN pedidos p ON p.cliente_id = c.cliente_id
     GROUP BY c.cliente_id, c.nombre, c.telefono, c.correo, c.direccion, c.fecha_creacion
     ORDER BY c.cliente_id DESC`
  );
  return res.rows;
}

// Agregar cliente
async function addCliente({ nombre, telefono, correo, direccion }) {
  const res = await pool.query(
    `INSERT INTO clientes (nombre, telefono, correo, direccion, fecha_creacion) 
     VALUES ($1, $2, $3, $4, NOW()) 
     RETURNING *`,
    [nombre, telefono, correo, direccion]
  );
  return res.rows[0];
}

// Actualizar cliente
async function updateCliente(id, { nombre, telefono, correo, direccion }) {
  const res = await pool.query(
    `UPDATE clientes 
     SET nombre = $1, telefono = $2, correo = $3, direccion = $4 
     WHERE cliente_id = $5 
     RETURNING *`,
    [nombre, telefono, correo, direccion, id]
  );
  return res.rows[0];
}

// Eliminar cliente
async function deleteCliente(id) {
  const res = await pool.query(
    `DELETE FROM clientes 
     WHERE cliente_id = $1 
     RETURNING cliente_id`,
    [id]
  );
  return res.rowCount > 0;
}

module.exports = { getClientes, addCliente, updateCliente, deleteCliente };
