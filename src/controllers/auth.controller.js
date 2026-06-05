const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const { validationResult } = require('express-validator');

const authController = {
  register: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { full_name, password, role_id } = req.body;
      const email = req.body.email.toLowerCase(); // Normalizar email

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      const user = await User.create({
        full_name,
        email,
        password,
        role_id: role_id || 4
      });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role_id: user.role_id
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const email = req.body.email.toLowerCase(); // Normalizar para evitar problemas de mayúsculas
      const { password } = req.body;

      const user = await User.findOne({ 
        where: { email },
        attributes: { include: ['password', 'status'] }, // Forzamos que traiga estos campos
        include: [{ model: Role }]
      });

      if (!user) {
        return res.status(401).json({ error: 'El email no está registrado' });
      }

      if (!user.status) {
        return res.status(401).json({ error: 'El usuario está desactivado (status: false)' });
      }

      // Comparación directa de texto plano. Usamos trim() por si hay espacios invisibles en la BD
      if (user.password?.trim() !== password?.trim()) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.Role.name
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = authController;