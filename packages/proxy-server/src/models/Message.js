// Message Model - Sequelize
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'complaints',
          key: 'id',
        },
        onDelete: 'CASCADE',
        index: true,
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        index: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      message_type: {
        type: DataTypes.ENUM('initial', 'reply', 'escalation', 'status_update'),
        allowNull: false,
        defaultValue: 'reply',
      },
      is_internal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'messages',
      indexes: [
        {
          fields: ['complaint_id', 'created_at'],
        },
        {
          fields: ['sender_id'],
        },
        {
          fields: ['message_type'],
        },
      ],
    }
  );

  return Message;
};
