const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArtworkTag = sequelize.define('ArtworkTag', {
  artwork_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'artworks',
      key: 'id'
    }
  },
  tag_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'tags',
      key: 'id'
    }
  }
}, {
  tableName: 'artwork_tags',
  timestamps: false
});

module.exports = ArtworkTag;