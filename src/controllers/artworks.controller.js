const { validationResult } = require('express-validator');
const artworksService = require('../services/artworks.service');

const artworksController = {
  // Crear obra (Artista)
  create: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const artwork = await artworksService.createArtwork({
        body: req.body,
        file: req.file,
        user: req.user
      });

      res.status(201).json({
        message: 'Obra creada exitosamente',
        artwork: {
          id: artwork.id,
          title: artwork.title,
          status: artwork.status
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener todas las obras (con filtros)
  getAll: async (req, res) => {
    try {
      const artworks = await artworksService.getAllArtworks({
        query: req.query,
        user: req.user
      });
      res.json(artworks);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  // Obtener obra por ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const artwork = await artworksService.getArtworkById({
        id,
        user: req.user
      });
      res.json(artwork);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  // Actualizar estado de obra (Admin/Curador)
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, message } = req.body;
      const artwork = await artworksService.updateArtworkStatus({
        id,
        status,
        message,
        user: req.user
      });

      res.json({
        message: 'Estado actualizado exitosamente',
        artwork: {
          id: artwork.id,
          status: artwork.status
        }
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  // Nuevo: Obtener imagen para mostrar
  getImage: async (req, res) => {
    try {
      const { id } = req.params;
      const imageBuffer = await artworksService.getArtworkImageForDisplay({
        id,
        user: req.user // Pasamos el usuario para control de acceso
      });

      res.setHeader('Content-Type', 'image/jpeg'); // Asumimos JPEG, ajustar si hay otros formatos
      res.send(imageBuffer);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },

  // Descargar imagen original (Admin/Curador)
  downloadImage: async (req, res) => {
    try {
      const { id } = req.params;
      const artwork = await artworksService.getArtworkImageForDownload({ id }); // Usamos la nueva función

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${artwork.title}.jpg"`);
      res.send(artwork.original_image);
    } catch (error) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
};

module.exports = artworksController;