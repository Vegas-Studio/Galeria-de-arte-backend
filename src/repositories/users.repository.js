const { Op } = require('sequelize');
const { User, Role } = require('../models');

async function findByIdWithRole(id) {
  return User.findByPk(id, {
    include: [{ model: Role }],
    attributes: { exclude: [] }
  });
}

async function findByEmail(email, excludeUserId = null) {
  const where = { email };
  if (excludeUserId) {
    where.id = { [Op.ne]: excludeUserId };
  }
  return User.findOne({ where });
}

async function updateUser(user, fields) {
  return user.update(fields);
}

async function findAllWithRole() {
  return User.findAll({
    include: [{ model: Role }],
    attributes: { exclude: [] }
  });
}

module.exports = {
  findByIdWithRole,
  findByEmail,
  updateUser,
  findAllWithRole
};
