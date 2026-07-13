// UserModule Model - Sequelize
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserModule = sequelize.define(
    'UserModule',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        index: true,
      },
      moduleId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        index: true,
      },
      moduleName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      semester: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 2000,
          max: 2100,
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'user_modules',
      indexes: [
        {
          fields: ['userId', 'moduleId'],
          unique: true,
        },
        {
          fields: ['userId'],
        },
        {
          fields: ['moduleId'],
        },
      ],
    }
  );

  return UserModule;
};
