// Profile Service - Business logic for user profile operations
const { Op } = require('sequelize');

/**
 * Get user profile by ID
 * @param {number} userId - User ID
 * @param {Object} User - User model
 * @returns {Promise<Object>} User profile
 */
async function getUserProfile(userId, User) {
  try {
    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ['password', 'createdAt', 'updatedAt'],
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
}

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {Object} User - User model
 * @returns {Promise<Object>} Updated user profile
 */
async function updateUserProfile(userId, updateData, User) {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Define allowed fields to update
    const allowedFields = [
      'firstName',
      'lastName',
      'email',
      'faculty',
      'department',
      'campus',
      'course',
      'residence',
      'specialization',
      'phone',
    ];

    // Filter update data to only allowed fields
    const filteredData = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    // Check if email is being updated and if it's already in use
    if (filteredData.email && filteredData.email !== user.email) {
      const existingEmail = await User.findOne({
        where: {
          email: filteredData.email,
          id: { [Op.ne]: userId },
        },
      });

      if (existingEmail) {
        throw new Error('Email already in use');
      }
    }

    // Update user
    await user.update(filteredData);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      studentNumber: user.studentNumber,
      faculty: user.faculty,
      department: user.department,
      campus: user.campus,
      course: user.course,
      residence: user.residence,
      specialization: user.specialization,
    };
  } catch (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
}

/**
 * Get user modules
 * @param {number} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Array>} List of modules
 */
async function getUserModules(userId, models) {
  try {
    const { UserModule } = models;

    const modules = await UserModule.findAll({
      where: { userId },
      attributes: ['id', 'moduleId', 'moduleName'],
      order: [['createdAt', 'DESC']],
    });

    return modules;
  } catch (error) {
    throw new Error(`Failed to fetch modules: ${error.message}`);
  }
}

/**
 * Update user modules (replace all)
 * @param {number} userId - User ID
 * @param {Array} moduleIds - Array of module IDs to assign
 * @param {Object} models - Database models
 * @returns {Promise<Array>} Updated modules list
 */
async function updateUserModules(userId, moduleIds, models) {
  try {
    const { UserModule } = models;

    // Validate input
    if (!Array.isArray(moduleIds)) {
      throw new Error('moduleIds must be an array');
    }

    // Delete existing modules for this user
    await UserModule.destroy({ where: { userId } });

    // Create new module associations
    const newModules = await Promise.all(
      moduleIds.map((moduleId) =>
        UserModule.create({
          userId,
          moduleId,
          moduleName: `Module ${moduleId}`, // In real scenario, fetch from admin tables
        })
      )
    );

    return newModules.map((mod) => ({
      id: mod.id,
      moduleId: mod.moduleId,
      moduleName: mod.moduleName,
    }));
  } catch (error) {
    throw new Error(`Failed to update modules: ${error.message}`);
  }
}

/**
 * Add single module to user
 * @param {number} userId - User ID
 * @param {string} moduleId - Module ID
 * @param {string} moduleName - Module name
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Created module association
 */
async function addUserModule(userId, moduleId, moduleName, models) {
  try {
    const { UserModule } = models;

    // Check if module already exists for user
    const existing = await UserModule.findOne({
      where: { userId, moduleId },
    });

    if (existing) {
      throw new Error('Module already assigned to user');
    }

    const module = await UserModule.create({
      userId,
      moduleId,
      moduleName,
    });

    return {
      id: module.id,
      moduleId: module.moduleId,
      moduleName: module.moduleName,
    };
  } catch (error) {
    throw new Error(`Failed to add module: ${error.message}`);
  }
}

/**
 * Remove module from user
 * @param {number} userId - User ID
 * @param {string} moduleId - Module ID
 * @param {Object} models - Database models
 * @returns {Promise<boolean>} Success flag
 */
async function removeUserModule(userId, moduleId, models) {
  try {
    const { UserModule } = models;

    const result = await UserModule.destroy({
      where: { userId, moduleId },
    });

    return result > 0;
  } catch (error) {
    throw new Error(`Failed to remove module: ${error.message}`);
  }
}

/**
 * Validate profile update data
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
function validateProfileUpdate(data) {
  const errors = [];

  if (data.email && !data.email.includes('@')) {
    errors.push('Email must be valid');
  }

  if (data.firstName && typeof data.firstName !== 'string') {
    errors.push('First name must be a string');
  }

  if (data.lastName && typeof data.lastName !== 'string') {
    errors.push('Last name must be a string');
  }

  if (data.phone && !/^\d{10,}$/.test(data.phone)) {
    errors.push('Phone must be at least 10 digits');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserModules,
  updateUserModules,
  addUserModule,
  removeUserModule,
  validateProfileUpdate,
};
