function splitFullName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  const nombre = parts[0] || '';
  const apellido = parts.slice(1).join(' ');
  return { nombre, apellido };
}

function buildFullName(nombre, apellido) {
  return [nombre, apellido].filter((part) => part && String(part).trim()).join(' ').trim();
}

function formatProfileUser(user) {
  const { nombre, apellido } = splitFullName(user.full_name);
  let avatarBase64 = null;
  if (user.avatar) {
    if (Buffer.isBuffer(user.avatar)) {
      avatarBase64 = user.avatar.toString('base64');
    } else if (user.avatar.data) {
      avatarBase64 = Buffer.from(user.avatar.data).toString('base64');
    } else if (typeof user.avatar === 'string') {
      avatarBase64 = user.avatar;
    }
  }
  return {
    id: user.id,
    email: user.email,
    nombre,
    apellido,
    rol: user.Role?.name ?? null,
    biography: user.biography || '',
    nationality: user.nationality || '',
    avatar: avatarBase64 ? `data:image/jpeg;base64,${avatarBase64}` : null
  };
}

module.exports = {
  splitFullName,
  buildFullName,
  formatProfileUser
};
