const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const emailService = require('./email.service');

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hora

function throwError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signJwt(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

async function registerUser({ full_name, email, password, role_id }) {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throwError('El email ya está registrado', 400);
  }

  const user = await User.create({
    full_name: full_name.trim(),
    email: normalizedEmail,
    password,
    role_id: role_id || 4,
    status: true
  });

  const token = signJwt(user);

  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role_id: user.role_id
    }
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({
    where: { email: normalizedEmail },
    attributes: { include: ['password', 'status'] },
    include: [{ model: Role }]
  });

  if (!user) {
    throwError('El email no está registrado', 401);
  }

  if (user.status === false) {
    throwError('El usuario está desactivado', 401);
  }

  let passwordMatches = false;
  try {
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      passwordMatches = user.password.trim() === password.trim();
    }
  } catch {
    passwordMatches = user.password.trim() === password.trim();
  }

  if (!passwordMatches) {
    throwError('Credenciales inválidas', 401);
  }

  const token = signJwt(user);

  return {
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.Role?.name
    }
  };
}

async function requestPasswordReset(email) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  // Respuesta genérica para no revelar si el email existe
  const genericResponse = {
    message: 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.'
  };

  if (!user || user.status === false) {
    return genericResponse;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await user.update({
    reset_password_token: hashedToken,
    reset_password_expires: expiresAt
  });

  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const resetUrl = `${frontendBase}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

  await emailService.sendPasswordResetEmail({ to: normalizedEmail, resetUrl });

  return genericResponse;
}

async function resetPassword({ email, token, password }) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user || !user.reset_password_token || !user.reset_password_expires) {
    throwError('Token inválido o expirado', 400);
  }

  const hashedToken = hashToken(token);
  if (user.reset_password_token !== hashedToken) {
    throwError('Token inválido o expirado', 400);
  }

  if (new Date() > new Date(user.reset_password_expires)) {
    throwError('Token inválido o expirado', 400);
  }

  await user.update({
    password,
    reset_password_token: null,
    reset_password_expires: null
  });

  return { message: 'Contraseña actualizada exitosamente' };
}

module.exports = {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword
};
