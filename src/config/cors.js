const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173'
];

function parseOriginsFromEnv() {
  const raw = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isNetlifyOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.netlify.app');
  } catch {
    return false;
  }
}

function getAllowedOrigins() {
  return [...new Set([...DEFAULT_ORIGINS, ...parseOriginsFromEnv()])];
}

function createCorsOptions() {
  const allowedOrigins = getAllowedOrigins();
  const allowNetlify = process.env.CORS_ALLOW_NETLIFY !== 'false';

  return {
    origin(origin, callback) {
      // Peticiones sin Origin (Postman, health checks, same-origin server-side)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (allowNetlify && isNetlifyOrigin(origin)) {
        return callback(null, true);
      }

      // eslint-disable-next-line no-console
      console.warn(`CORS bloqueado para origen: ${origin}`);
      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
  };
}

module.exports = {
  getAllowedOrigins,
  createCorsOptions
};
