const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// optionalProtect — decodes token if present, never blocks the request
const optionalProtect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer')) {
    try {
      const token = auth.split(' ')[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    } catch (_) { /* invalid token — proceed as guest */ }
  }
  next();
};

module.exports = { protect, optionalProtect };
