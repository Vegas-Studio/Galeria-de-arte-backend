const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Artwork = sequelize.define('Artwork', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  creation_year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  technique: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dimensions: {
    type: DataTypes.STRING,
    allowNull: false
  },
  original_image: {
    type: DataTypes.BLOB('long'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Rechazado'),
    defaultValue: 'Pendiente'
  },
  artist_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'artworks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Artwork;