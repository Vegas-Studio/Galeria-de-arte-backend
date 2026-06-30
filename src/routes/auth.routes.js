const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

const registerValidation = [
  body('full_name').trim().notEmpty().withMessage('full_name es requerido'),
  body('email').isEmail().withMessage('email debe ser válido').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('password debe tener al menos 6 caracteres'),
  body('role_id').optional().isInt().withMessage('role_id debe ser un entero')
];

const loginValidation = [
  body('email').isEmail().withMessage('email debe ser válido').normalizeEmail(),
  body('password').notEmpty().withMessage('password es requerido')
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('email debe ser válido').normalizeEmail()
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('email debe ser válido').normalizeEmail(),
  body('token').notEmpty().withMessage('token es requerido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('password debe tener al menos 6 caracteres')
];

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

module.exports = router;
