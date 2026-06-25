const usersRepository = require('../repositories/users.repository');
const { buildFullName, formatProfileUser, splitFullName } = require('../utils/userName.utils');

/**
 * Lanza un objeto de error con un código de estado específico.
 */
function throwError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

async function getProfile(userId) {
  const user = await usersRepository.findByIdWithRole(userId);
  if (!user) throwError('Usuario no encontrado', 404);
  return formatProfileUser(user);
}

async function getAllUsers() {
  const users = await usersRepository.findAllWithRole();
  return users.map(formatProfileUser);
}

async function getUserById(id) {
  const user = await usersRepository.findByIdWithRole(id);
  if (!user) throwError('Usuario no encontrado', 404);
  return formatProfileUser(user);
}

async function updateProfile(userId, { nombre, apellido, email, password, biography, nationality, avatar }) {
  const user = await usersRepository.findByIdWithRole(userId);
  if (!user) throwError('Usuario no encontrado', 404);

  const updates = {};

  if (nombre !== undefined || apellido !== undefined) {
    const { nombre: storedNombre, apellido: storedApellido } = splitFullName(user.full_name);
    const currentNombre = nombre ?? storedNombre;
    const currentApellido = apellido ?? storedApellido;
    const fullName = buildFullName(currentNombre, currentApellido);
    if (!fullName) throwError('El nombre es requerido', 400);
    updates.full_name = fullName;
  }

  if (email !== undefined) {
    const normalizedEmail = email.toLowerCase();
    const existing = await usersRepository.findByEmail(normalizedEmail, userId);
    if (existing) throwError('El email ya está registrado', 400);
    updates.email = normalizedEmail;
  }

  if (password !== undefined && password !== '') {
    updates.password = password;
  }

  if (biography !== undefined) {
    updates.biography = biography;
  }

  if (nationality !== undefined) {
    updates.nationality = nationality;
  }

  if (avatar !== undefined) {
    updates.avatar = avatar;
  }

  if (Object.keys(updates).length === 0) {
    throwError('No hay campos para actualizar', 400);
  }

  await usersRepository.updateUser(user, updates);
  const updated = await usersRepository.findByIdWithRole(userId);
  return formatProfileUser(updated);
}

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById
};
