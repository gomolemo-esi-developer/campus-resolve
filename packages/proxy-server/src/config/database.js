// Database configuration for Sequelize
const { Sequelize } = require('sequelize');
const { env } = require('./env');

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: env.nodeEnv === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: env.nodeEnv === 'production' ? { require: true, rejectUnauthorized: false } : false,
  },
});

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connection established successfully');
  } catch (error) {
    console.error('[DB] Unable to connect to database:', error);
    process.exit(1);
  }
}

module.exports = {
  sequelize,
  testConnection,
};
