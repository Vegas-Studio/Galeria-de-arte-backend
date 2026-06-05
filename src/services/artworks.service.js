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
 */
function formatArtwork(artwork) {
  if (!artwork) return null;
  const data = typeof artwork.toJSON === 'function' ? artwork.toJSON() : { ...artwork };

  // Si hay una imagen original, devolvemos la URL del endpoint dedicado
  // El frontend hará una petición GET a esta URL para obtener la imagen.
  const imageUrl = data.original_image ? `/api/artworks/${data.id}/image` : null;

  return {
    id: data.id,
    title: data.title,
    artist: data.Artist ? data.Artist.full_name : 'Artista Desconocido',
    status: data.status,
    img: imageUrl, // Ahora es una URL
    // Metadatos adicionales útiles para el frontend
    creation_year: data.creation_year,
    technique: data.technique,
    dimensions: data.dimensions
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

  // Si no hay usuario o es Visitante, forzamos que solo se vean obras Aprobadas
  const isGuestOrVisitor = !user || user.Role?.name === 'Visitante';

  if (isGuestOrVisitor) {
    where.status = 'Aprobado';
  } else if (status) {
    if (!ALLOWED_STATUS.has(status)) {
      throwError('Estado inválido', 400);
    }
    where.status = status;
  }

  if (artist_id) where.artist_id = artist_id;

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

  if (status === 'Rechazado' && message) {
    await artworksRepo.createRejectionMessage({
      id_artwork: id,
      message,
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

module.exports = {
  createArtwork,
  getAllArtworks,
  getArtworkById,
  updateArtworkStatus,
  getArtworkImageForDisplay, // Nueva función exportada
  downloadArtworkImage: getArtworkImageForDownload // Mantenemos el nombre de exportación original
};
