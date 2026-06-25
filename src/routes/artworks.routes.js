const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');

const artworksController = require('../controllers/artworks.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- Rutas Públicas ---
// Estas rutas no requieren token para que la galería funcione para todos, pero detectan sesión si existe
router.get('/', authMiddleware.optional, artworksController.getAll);
router.get('/all', authMiddleware.optional, artworksController.getAll); 
router.get('/admin/stats', authMiddleware, roleMiddleware('Admin', 'Curador'), artworksController.getAdminStats);
router.get('/:id', authMiddleware.optional, artworksController.getById);
router.get('/:id/image', authMiddleware.optional, artworksController.getImage); // Nueva ruta para la imagen

// --- Rutas Protegidas ---
// A partir de aquí, se requiere token para crear o modificar obras
router.use(authMiddleware);

router.post(
  '/',
  roleMiddleware('Artista'),
  upload.single('image'),
  [
    body('title').notEmpty().withMessage('title es requerido'),
    body('creation_year').toInt().isInt().withMessage('creation_year debe ser un entero'),
    body('technique').notEmpty().withMessage('technique es requerido'),
    body('dimensions').notEmpty().withMessage('dimensions es requerido')
  ],
  artworksController.create
);

router.patch(
  '/:id/status',
  roleMiddleware('Admin', 'Curador'),
  artworksController.updateStatus
);

router.get(
  '/:id/download',
  roleMiddleware('Admin', 'Curador'),
  artworksController.downloadImage
);

module.exports = router;
