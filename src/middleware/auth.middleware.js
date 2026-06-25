const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role }]
    });

    if (!user || user.status === false) {
      return res.status(401).json({ error: 'Usuario no autorizado' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        include: [{ model: Role }]
      });
      if (user && user.status !== false) {
        req.user = user;
        req.token = token;
      }
    }
  } catch (error) {
    // ignorar errores de token en autenticación opcional
  }
  next();
};

authMiddleware.optional = optionalAuth;

module.exports = authMiddleware;
