// Complaint Model - Sequelize
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Complaint = sequelize.define(
    'Complaint',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      filed_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        index: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          len: [5, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [20, 10000],
        },
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        index: true,
        validate: {
          isIn: [
            [
              'student-services',
              'campus-facilities',
              'course-complaint',
              'timetable',
              'lecture-hall-lab',
              'report-lecturer',
              'accommodation',
              'finance',
              'registration',
              'security-emergency',
              'student-life',
              'controls',
            ],
          ],
        },
      },
      status: {
        type: DataTypes.ENUM('open', 'in_progress', 'escalated', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'open',
        index: true,
      },
      current_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          max: 7,
        },
      },
      assigned_to: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        index: true,
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        allowNull: false,
        defaultValue: 'medium',
      },
      resolution_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      tableName: 'complaints',
      indexes: [
        {
          fields: ['filed_by', 'created_at'],
        },
        {
          fields: ['status', 'created_at'],
        },
        {
          fields: ['category', 'status'],
        },
      ],
    }
  );

  return Complaint;
};
