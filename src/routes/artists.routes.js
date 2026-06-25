const express = require('express');
const router = express.Router();
const artistsController = require('../controllers/artists.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// GET /api/artists — lista todos los artistas (requiere Admin o Curador)
router.get('/', authMiddleware, roleMiddleware('Admin', 'Curador'), artistsController.getAll);

// GET /api/artists/:id — detalle de un artista (requiere Admin o Curador)
router.get('/:id', authMiddleware, roleMiddleware('Admin', 'Curador'), artistsController.getById);

// POST /api/artists — crear artista (requiere Admin)
router.post('/', authMiddleware, roleMiddleware('Admin'), artistsController.create);

// PUT /api/artists/:id — actualizar artista (requiere Admin)
router.put('/:id', authMiddleware, roleMiddleware('Admin'), artistsController.update);

// DELETE /api/artists/:id — eliminar artista (requiere Admin)
router.delete('/:id', authMiddleware, roleMiddleware('Admin'), artistsController.delete);

module.exports = router;
