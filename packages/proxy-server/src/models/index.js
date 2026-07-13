// Models Index - Centralized Model Registration
const { Sequelize } = require('sequelize');
const { env } = require('../config/env');

// Initialize Sequelize connection
const sequelize = new Sequelize(
  env.database,
  env.dbUser,
  env.dbPassword,
  {
    host: env.dbHost,
    port: env.dbPort,
    dialect: env.dbDialect || 'postgres',
    logging: env.nodeEnv === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Import models
const User = require('./User')(sequelize);
const Complaint = require('./Complaint')(sequelize);
const Message = require('./Message')(sequelize);
const Attachment = require('./Attachment')(sequelize);
const UserModule = require('./UserModule')(sequelize);

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Complaint, {
    foreignKey: 'filed_by',
    as: 'filedComplaints',
  });
  User.hasMany(Complaint, {
    foreignKey: 'assigned_to',
    as: 'assignedComplaints',
  });
  User.hasMany(Message, {
    foreignKey: 'sender_id',
    as: 'sentMessages',
  });
  User.hasMany(UserModule, {
    foreignKey: 'userId',
    as: 'modules',
  });

  // Complaint associations
  Complaint.belongsTo(User, {
    foreignKey: 'filed_by',
    as: 'filer',
  });
  Complaint.belongsTo(User, {
    foreignKey: 'assigned_to',
    as: 'assignedTo',
  });
  Complaint.hasMany(Message, {
    foreignKey: 'complaint_id',
    as: 'messages',
    onDelete: 'CASCADE',
  });

  // Message associations
  Message.belongsTo(Complaint, {
    foreignKey: 'complaint_id',
    as: 'complaint',
  });
  Message.belongsTo(User, {
    foreignKey: 'sender_id',
    as: 'sender',
  });
  Message.hasMany(Attachment, {
    foreignKey: 'message_id',
    as: 'attachments',
    onDelete: 'CASCADE',
  });

  // Attachment associations
  Attachment.belongsTo(Message, {
    foreignKey: 'message_id',
    as: 'message',
  });

  // UserModule associations
  UserModule.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });
};

// Export models and sequelize instance
module.exports = {
  sequelize,
  Sequelize,
  User,
  Complaint,
  Message,
  Attachment,
  UserModule,
  defineAssociations,
};
