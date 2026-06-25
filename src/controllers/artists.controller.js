const { User, Role } = require('../models');

const artistsController = {
  // GET /api/artists — lista todos los usuarios con role_id = 2 (Artista)
  getAll: async (req, res) => {
    try {
      const artists = await User.findAll({
        where: { role_id: 2 },
        include: [{ model: Role }],
        attributes: { exclude: ['password'] }
      });
      res.json(artists);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/artists/:id — detalle de un artista
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const artist = await User.findOne({
        where: { id, role_id: 2 },
        include: [{ model: Role }],
        attributes: { exclude: ['password'] }
      });
      if (!artist) return res.status(404).json({ error: 'Artista no encontrado' });
      res.json(artist);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/artists — crear un nuevo usuario con rol Artista
  create: async (req, res) => {
    try {
      const { full_name, email, password, biography, nationality, birth_date, death_date } = req.body;
      if (!full_name || !email || !password) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
      }
      const existing = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existing) return res.status(400).json({ error: 'El email ya está registrado' });

      const artist = await User.create({
        full_name,
        email: email.toLowerCase(),
        password,
        role_id: 2, // Artista
        status: true,
        biography: biography || null,
        nationality: nationality || null,
        birth_date: birth_date || null,
        death_date: death_date || null
      });
      res.status(201).json({
        message: 'Artista creado exitosamente',
        artist: {
          id: artist.id,
          full_name: artist.full_name,
          email: artist.email,
          nationality: artist.nationality
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/artists/:id — actualizar datos del artista
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name, biography, nationality, birth_date, death_date } = req.body;

      const artist = await User.findOne({ where: { id, role_id: 2 } });
      if (!artist) return res.status(404).json({ error: 'Artista no encontrado' });

      await artist.update({
        full_name: full_name ?? artist.full_name,
        biography: biography ?? artist.biography,
        nationality: nationality ?? artist.nationality,
        birth_date: birth_date ?? artist.birth_date,
        death_date: death_date ?? artist.death_date
      });

      res.json({ message: 'Artista actualizado exitosamente', artist });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // DELETE /api/artists/:id — eliminar artista
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const artist = await User.findOne({ where: { id, role_id: 2 } });
      if (!artist) return res.status(404).json({ error: 'Artista no encontrado' });

      await artist.destroy();
      res.json({ message: 'Artista eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = artistsController;
