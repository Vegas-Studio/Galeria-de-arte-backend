const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArtMessage = sequelize.define('ArtMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_artwork: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'art_message',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ArtMessage;