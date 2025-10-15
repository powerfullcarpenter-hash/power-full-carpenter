const { verifyToken } = require('../utils/jwt');

function required(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token requerido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function optional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = verifyToken(token);
    } catch (err) {
      // token inválido → ignorar, continúa sin usuario
    }
  }
  next();
}

module.exports = { required, optional };
