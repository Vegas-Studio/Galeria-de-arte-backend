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
  return {
    id: user.id,
    email: user.email,
    nombre,
    apellido,
    rol: user.Role?.name ?? null
  };
}

module.exports = {
  splitFullName,
  buildFullName,
  formatProfileUser
};
