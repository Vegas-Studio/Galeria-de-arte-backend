const Role = require('./Role');
const User = require('./User');
const Artwork = require('./Artwork');
const ArtMessage = require('./ArtMessage');
const Tag = require('./Tag');
const ArtworkTag = require('./ArtworkTag');
const Comment = require('./Comment');
const ArtworkStats = require('./ArtworkStats');

// Definir relaciones
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

User.hasMany(Artwork, { foreignKey: 'artist_id', as: 'artworks' });
Artwork.belongsTo(User, { foreignKey: 'artist_id', as: 'artist' });

User.hasMany(Comment, { foreignKey: 'user_id' });
Comment.belongsTo(User, { foreignKey: 'user_id' });

Artwork.hasMany(Comment, { foreignKey: 'artwork_id' });
Comment.belongsTo(Artwork, { foreignKey: 'artwork_id' });

Artwork.belongsToMany(Tag, { 
  through: ArtworkTag, 
  foreignKey: 'artwork_id',
  otherKey: 'tag_id'
});
Tag.belongsToMany(Artwork, { 
  through: ArtworkTag, 
  foreignKey: 'tag_id',
  otherKey: 'artwork_id'
});

Artwork.hasOne(ArtworkStats, { foreignKey: 'artwork_id' });
ArtworkStats.belongsTo(Artwork, { foreignKey: 'artwork_id' });

Artwork.hasMany(ArtMessage, { foreignKey: 'id_artwork' });
ArtMessage.belongsTo(Artwork, { foreignKey: 'id_artwork' });

User.hasMany(ArtMessage, { foreignKey: 'user_id' });
ArtMessage.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  Role,
  User,
  Artwork,
  ArtMessage,
  Tag,
  ArtworkTag,
  Comment,
  ArtworkStats
};