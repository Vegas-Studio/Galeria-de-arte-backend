const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');

const authController = {
  register: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { full_name, password, role_id } = req.body;
      const result = await authService.registerUser({
        full_name,
        email: req.body.email,
        password,
        role_id
      });

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { password } = req.body;
      const result = await authService.loginUser({
        email: req.body.email,
        password
      });

      res.json({
        message: 'Login exitoso',
        token: result.token,
        user: result.user,
        role: result.user.role
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.requestPasswordReset(req.body.email);
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, token, password } = req.body;
      const result = await authService.resetPassword({ email, token, password });
      res.json(result);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
};

module.exports = authController;
