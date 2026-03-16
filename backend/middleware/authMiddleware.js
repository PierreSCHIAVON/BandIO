const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}

module.exports = authMiddleware;
