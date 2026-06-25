const express = require('express');
const { body } = require('express-validator');

const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/profile_update:
 *   put:
 *     summary: Actualizar perfil del usuario en sesión
 *     description: Permite actualizar nombre, apellido, email y/o contraseña del usuario autenticado. El rol no es modificable.
 *     tags: [Perfil]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfileUpdate'
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Perfil actualizado exitosamente
 *                 user:
 *                   $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Validación fallida o sin campos
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - $ref: '#/components/schemas/ValidationErrors'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.put(
  '/',
  [
    body('nombre').optional().trim().notEmpty().withMessage('nombre no puede estar vacío'),
    body('apellido').optional().trim(),
    body('email').optional().isEmail().withMessage('email debe ser válido'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('password debe tener al menos 6 caracteres'),
    body('biography').optional().trim(),
    body('nationality').optional().trim()
  ],
  profileController.updateProfile
);

router.put('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const profileService = require('../services/profile.service');
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo' });
    }
    const updatedUser = await profileService.updateProfile(req.user.id, { avatar: req.file.buffer });
    res.json({
      message: 'Avatar actualizado exitosamente',
      user: updatedUser
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

module.exports = router;
