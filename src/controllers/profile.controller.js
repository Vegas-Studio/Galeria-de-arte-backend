const { validationResult } = require('express-validator');
const profileService = require('../services/profile.service');

const profileController = {
  getProfile: async (req, res) => {
    try {
      const profile = await profileService.getProfile(req.user.id);
      res.json(profile);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const profile = await profileService.updateProfile(req.user.id, req.body);
      res.json({
        message: 'Perfil actualizado exitosamente',
        user: profile
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
};

module.exports = profileController;
