const { Op } = require('sequelize');
const { Artwork, ArtworkStats, Tag, User, Comment, ArtMessage } = require('../models');

async function createArtwork({ title, creation_year, technique, dimensions, original_image, artist_id }) {
  return Artwork.create({
    title,
    creation_year,
    technique,
    dimensions,
    original_image,
    artist_id,
    status: 'Pendiente'
  });
}

async function createArtworkStats(artwork_id) {
  return ArtworkStats.create({ artwork_id });
}

async function setArtworkTags(artworkInstance, tagIds) {
  return artworkInstance.setTags(tagIds);
}

function buildArtworkIncludes({ tagSearch } = {}) {
  const include = [
    {
      model: User,
      as: 'artist',
      attributes: ['id', 'full_name', 'email']
    },
    {
      model: Tag,
      through: { attributes: [] }
    },
    {
      model: ArtworkStats
    }
  ];

  if (tagSearch) {
    include[1].where = {
      name: { [Op.iLike]: `%${tagSearch}%` }
    };
  }

  return include;
}

async function findAllArtworks({ where, tagSearch } = {}) {
  return Artwork.findAll({
    where,
    include: buildArtworkIncludes({ tagSearch })
  });
}

async function findArtworkByIdWithDetails(id) {
  return Artwork.findByPk(id, {
    include: [
      {
        model: User,
        as: 'artist',
        attributes: ['id', 'full_name', 'email']
      },
      {
        model: Tag,
        through: { attributes: [] }
      },
      {
        model: ArtworkStats
      },
      {
        model: Comment,
        include: [
          {
            model: User,
            attributes: ['id', 'full_name']
          }
        ]
      }
    ]
  });
}

async function findArtworkById(id) {
  return Artwork.findByPk(id);
}

async function incrementArtworkViews(artwork_id) {
  return ArtworkStats.increment('view_count', {
    where: { artwork_id }
  });
}

async function incrementArtworkDownloads(artwork_id) {
  return ArtworkStats.increment('download_count', {
    where: { artwork_id }
  });
}

async function updateArtworkStatus(artworkInstance, status) {
  artworkInstance.status = status;
  return artworkInstance.save();
}

async function createRejectionMessage({ id_artwork, message, user_id }) {
  return ArtMessage.create({ id_artwork, message, user_id });
}

async function getArtworkImageById(id) {
  return Artwork.findByPk(id, { attributes: ['id', 'original_image', 'title'] });
}

module.exports = {
  createArtwork,
  createArtworkStats,
  setArtworkTags,
  findAllArtworks,
  findArtworkByIdWithDetails,
  findArtworkById,
  incrementArtworkViews,
  incrementArtworkDownloads,
  updateArtworkStatus,
  createRejectionMessage,
  getArtworkImageById
};

