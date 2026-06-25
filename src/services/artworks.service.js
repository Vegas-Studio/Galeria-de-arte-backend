const { Op } = require('sequelize');
const artworksRepo = require('../repositories/artworks.repository');

const ALLOWED_STATUS = new Set(['Pendiente', 'Aprobado', 'Rechazado']);

/**
 * Lanza un objeto de error con un código de estado específico.
 */
function throwError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

/**
 * Formatea el objeto de la obra para el frontend, mapeando campos internos.
 * Retorna original_image en base64 para compatibilidad con el frontend React.
 */
function formatArtwork(artwork) {
  if (!artwork) return null;
  const data = typeof artwork.toJSON === 'function' ? artwork.toJSON() : { ...artwork };

  // Convertir bytea a base64 si existe
  let originalImageBase64 = null;
  if (data.original_image) {
    if (Buffer.isBuffer(data.original_image)) {
      originalImageBase64 = data.original_image.toString('base64');
    } else if (data.original_image.data) {
      originalImageBase64 = Buffer.from(data.original_image.data).toString('base64');
    } else if (typeof data.original_image === 'string') {
      originalImageBase64 = data.original_image;
    }
  }

  // Construir objeto de artista anidado (como espera el frontend)
  const artistObj = data.artist
    ? { id: data.artist.id, full_name: data.artist.full_name, email: data.artist.email }
    : data.Artist
    ? { id: data.Artist.id, full_name: data.Artist.full_name, email: data.Artist.email }
    : null;

  return {
    id: data.id,
    title: data.title,
    artist: artistObj,
    status: data.status,
    original_image: originalImageBase64,
    creation_year: data.creation_year,
    technique: data.technique,
    dimensions: data.dimensions,
    Tags: data.Tags || [],
    ArtworkStat: data.ArtworkStat || null,
    Comments: data.Comments || [],
    created_at: data.created_at
  };
}

function parseTagIds(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    const trimmed = tags.trim();
    if (!trimmed) return [];
    return JSON.parse(trimmed);
  }
  return [];
}

async function createArtwork({ body, file, user }) {
  const { title, creation_year, technique, dimensions, tags } = body;

  if (!file?.buffer) {
    throwError('Imagen requerida', 400);
  }

  const artwork = await artworksRepo.createArtwork({
    title,
    creation_year,
    technique,
    dimensions,
    original_image: file.buffer,
    artist_id: user.id
  });

  await artworksRepo.createArtworkStats(artwork.id);

  const tagIds = parseTagIds(tags);
  if (tagIds.length > 0) {
    await artworksRepo.setArtworkTags(artwork, tagIds);
  }

  return formatArtwork(artwork);
}

async function getAllArtworks({ query, user }) {
  const { status, artist_id, tag } = query;
  const where = {};

  const isGuestOrVisitor = !user || user.Role?.name === 'Visitante';

  if (isGuestOrVisitor) {
    where.status = 'Aprobado';
    if (artist_id) where.artist_id = artist_id;
  } else if (user.Role?.name === 'Artista') {
    if (artist_id) {
      if (Number(artist_id) === Number(user.id)) {
        where.artist_id = user.id;
        if (status) {
          if (!ALLOWED_STATUS.has(status)) throwError('Estado inválido', 400);
          where.status = status;
        }
      } else {
        where.artist_id = artist_id;
        where.status = 'Aprobado';
      }
    } else {
      where[Op.or] = [
        { status: 'Aprobado' },
        { artist_id: user.id }
      ];
      if (status) {
        if (!ALLOWED_STATUS.has(status)) throwError('Estado inválido', 400);
        where.status = status;
      }
    }
  } else {
    // Admin o Curador
    if (status) {
      if (!ALLOWED_STATUS.has(status)) throwError('Estado inválido', 400);
      where.status = status;
    }
    if (artist_id) where.artist_id = artist_id;
  }

  const artworks = await artworksRepo.findAllArtworks({ where, tagSearch: tag });
  return artworks.map(formatArtwork);
}

async function getArtworkById({ id, user }) {
  const artwork = await artworksRepo.findArtworkByIdWithDetails(id);

  if (!artwork) throwError('Obra no encontrada', 404);

  // Seguridad: Un usuario no identificado no puede ver obras pendientes o rechazadas
  const isGuestOrVisitor = !user || user.Role?.name === 'Visitante';

  if (isGuestOrVisitor && artwork.status !== 'Aprobado') {
    throwError('No tienes acceso a esta obra', 403);
  }

  await artworksRepo.incrementArtworkViews(id);

  const roleName = user?.Role?.name;
  const formatted = formatArtwork(artwork);

  // Solo ocultamos la imagen si la obra NO está aprobada y el usuario no tiene permisos elevados
  if (isGuestOrVisitor && formatted.status !== 'Aprobado') {
    formatted.img = null; // Si no tiene acceso, la URL de la imagen se anula
  }
  
  return formatted;
}

async function updateArtworkStatus({ id, status, message, user }) {
  if (!ALLOWED_STATUS.has(status)) {
    throwError('Estado inválido', 400);
  }

  const artwork = await artworksRepo.findArtworkById(id);
  if (!artwork) throwError('Obra no encontrada', 404);

  await artworksRepo.updateArtworkStatus(artwork, status);

  if (status === 'Rechazado') {
    if (!message || !String(message).trim()) {
      throwError('Debes proporcionar un motivo de rechazo', 400);
    }
    await artworksRepo.createRejectionMessage({
      id_artwork: id,
      message: String(message).trim(),
      user_id: user.id
    });
  }

  if (status === 'Aprobado') {
    await artworksRepo.createRejectionMessage({
      id_artwork: id,
      message: message?.trim() || `Tu obra "${artwork.title}" ha sido aprobada y publicada en la galería.`,
      user_id: user.id
    });
  }

  return formatArtwork(artwork);
}

/**
 * Obtiene el buffer de la imagen para ser mostrado directamente en el navegador.
 * Aplica control de acceso.
 */
async function getArtworkImageForDisplay({ id, user }) {
  const artwork = await artworksRepo.getArtworkImageById(id);

  if (!artwork || !artwork.original_image) throwError('Imagen no encontrada', 404);

  // Seguridad: Un usuario no identificado no puede ver imágenes de obras pendientes o rechazadas
  const isGuestOrVisitor = !user || user.Role?.name === 'Visitante';
  if (isGuestOrVisitor && artwork.status !== 'Aprobado') {
    throwError('No tienes acceso a esta imagen', 403);
  }

  // No incrementamos vistas/descargas aquí, ya que es para display, no para descarga explícita.
  // La vista se incrementa en getArtworkById.

  return artwork.original_image;
}

async function getArtworkImageForDownload({ id }) {
  const artwork = await artworksRepo.getArtworkImageById(id);

  if (!artwork || !artwork.original_image) throwError('Imagen no encontrada', 404);

  await artworksRepo.incrementArtworkDownloads(id);

  return artwork;
}

async function getAdminStats() {
  const Artwork = require('../models/Artwork');
  const sequelize = require('../config/database');

  const totalCollection = await Artwork.count();
  const pendingReview = await Artwork.count({ where: { status: 'Pendiente' } });

  const result = await Artwork.findOne({
    attributes: [
      [sequelize.fn('SUM', sequelize.fn('OCTET_LENGTH', sequelize.col('original_image'))), 'totalSize']
    ]
  });
  const totalSizeBytes = result?.getDataValue('totalSize') || 0;
  const storageUsedMB = (Number(totalSizeBytes) / (1024 * 1024)).toFixed(2);
  const storageUsed = `${storageUsedMB} MB`;

  return {
    totalCollection,
    pendingReview,
    storageUsed
  };
}

module.exports = {
  createArtwork,
  getAllArtworks,
  getArtworkById,
  updateArtworkStatus,
  getArtworkImageForDisplay, // Nueva función exportada
  downloadArtworkImage: getArtworkImageForDownload, // Mantenemos el nombre de exportación original
  getAdminStats
};
