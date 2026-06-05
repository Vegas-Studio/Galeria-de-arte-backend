const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middleware/auth.middleware'); // Asumiendo que tienes un middleware de autenticación
const roleMiddleware = require('../middleware/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints para la gestión de usuarios
 */

router.get('/', authMiddleware, roleMiddleware('Admin', 'Curador'), usersController.getAllUsers);
router.get('/:id', authMiddleware, roleMiddleware('Admin', 'Curador'), usersController.getUserById);

module.exports = router;