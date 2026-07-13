// Environment variable validation and loading
const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL',
  'NODE_ENV',
];

const optionalEnvVars = [
  'PORT',
  'JWT_EXPIRY',
  'JWT_REFRESH_EXPIRY',
  'CORS_ORIGINS',
];

function validateEnv() {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  console.log('[ENV] All required environment variables are set');
}

function getEnv(key, defaultValue) {
  return process.env[key] || defaultValue;
}

module.exports = {
  validateEnv,
  getEnv,
  env: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: process.env.JWT_EXPIRY || '24h',
    jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    databaseUrl: process.env.DATABASE_URL,
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
  },
};
