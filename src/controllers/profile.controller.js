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
  },

  getMessages: async (req, res) => {
    try {
      const { ArtMessage, Artwork, User } = require('../models');
      const messages = await ArtMessage.findAll({
        include: [
          {
            model: Artwork,
            where: { artist_id: req.user.id },
            attributes: ['id', 'title', 'status'],
            required: true
          },
          {
            model: User,
            attributes: ['id', 'full_name', 'email']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      const formatted = messages.map((msg) => {
        const data = msg.toJSON();
        const artwork = data.Artwork;
        const sender = data.User?.full_name || 'Equipo Curatorial';
        const isApproved = artwork?.status === 'Aprobado';
        const isRejected = artwork?.status === 'Rechazado';
        const subject = isApproved
          ? `Aprobada: ${artwork?.title || 'Obra'}`
          : isRejected
            ? `Rechazada: ${artwork?.title || 'Obra'}`
            : `Actualización: ${artwork?.title || 'Obra'}`;

        return {
          id: data.id,
          sender,
          subject,
          message: data.message,
          artworkId: artwork?.id,
          artworkTitle: artwork?.title,
          artworkStatus: artwork?.status,
          date: data.created_at
            ? new Date(data.created_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
            : '',
          read: false
        };
      });

      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = profileController;
