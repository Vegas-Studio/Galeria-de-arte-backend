const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArtworkStats = sequelize.define('ArtworkStats', {
  artwork_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'artworks',
      key: 'id'
    }
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'artwork_stats',
  timestamps: false
});

module.exports = ArtworkStats;