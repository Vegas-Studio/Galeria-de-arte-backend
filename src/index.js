require('dotenv').config();

const express = require('express');
const cors = require('cors');

const sequelize = require('./config/database');
const { createCorsOptions, getAllowedOrigins } = require('./config/cors');
require('./models'); // init associations

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const artworksRoutes = require('./routes/artworks.routes');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const profileUpdateRoutes = require('./routes/profileUpdate.routes');
const artistsRoutes = require('./routes/artists.routes');
const usersRoutes = require('./routes/users.routes');

const app = express();

app.use(cors(createCorsOptions()));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ ok: true, corsOrigins: getAllowedOrigins() }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/artworks', artworksRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // compatibilidad: /api/login, /api/register
app.use('/api/profile', profileRoutes);
app.use('/api/profile_update', profileUpdateRoutes);
app.use('/api/artists', artistsRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  if (err.message?.includes('CORS') || err.message?.includes('Origen no permitido')) {
    return res.status(403).json({ error: err.message });
  }
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

async function ensureUserColumns() {
  const columnsToAdd = [
    { name: 'biography', type: 'TEXT' },
    { name: 'nationality', type: 'VARCHAR(255)' },
    { name: 'birth_date', type: 'VARCHAR(50)' },
    { name: 'death_date', type: 'VARCHAR(50)' },
    { name: 'avatar', type: 'BYTEA' },
    { name: 'reset_password_token', type: 'VARCHAR(255)' },
    { name: 'reset_password_expires', type: 'TIMESTAMP WITH TIME ZONE' }
  ];
  for (const col of columnsToAdd) {
    try {
      await sequelize.query(
        `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`
      );
    } catch (err) {
      // La columna ya existe, ignorar
    }
  }
}

async function start() {
  const port = process.env.PORT || 3000;
  await sequelize.authenticate();
  await ensureUserColumns();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${port}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
