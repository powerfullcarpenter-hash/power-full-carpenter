const authService = require('../services/authService');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: e.message });
  }
}

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    const data = await authService.register({ name, email, password, role });
    res.status(201).json(data);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
}

module.exports = { login, register };
