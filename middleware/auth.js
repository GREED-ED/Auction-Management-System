// middleware/auth.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET;

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token or wrong format (expected Bearer <token>)' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // { id, role } dinxa decode paxi
    req.user.id = decoded.id; 
    req.user.role = decoded.role;

    next();
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
};
