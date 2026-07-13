// Profile Controller - Route handlers for profile endpoints

const {
  getUserProfile,
  updateUserProfile,
  getUserModules,
  updateUserModules,
  addUserModule,
  removeUserModule,
  validateProfileUpdate,
} = require('../services/profileService');

/**
 * GET /api/voice/profile
 * Get current user's profile
 */
async function getProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const profile = await getUserProfile(req.user.id, req.app.locals.User);

    return res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile retrieved successfully',
    });
  } catch (error) {
    console.error('[PROFILE] Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * PUT /api/voice/profile
 * Update current user's profile
 */
async function updateProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Validate input
    const validation = validateProfileUpdate(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const updatedProfile = await updateUserProfile(
      req.user.id,
      req.body,
      req.app.locals.User
    );

    return res.status(200).json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('[PROFILE] Update profile error:', error);

    // Handle specific error cases
    if (error.message.includes('Email already in use')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Email already in use',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/voice/profile/modules
 * Get user's enrolled modules
 */
async function getModules(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const modules = await getUserModules(req.user.id, req.app.locals);

    return res.status(200).json({
      success: true,
      data: modules,
      count: modules.length,
      message: 'Modules retrieved successfully',
    });
  } catch (error) {
    console.error('[PROFILE] Get modules error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * PUT /api/voice/profile/modules
 * Update user's enrolled modules (replace all)
 */
async function updateModules(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { moduleIds } = req.body;

    if (!moduleIds || !Array.isArray(moduleIds)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['moduleIds must be an array'],
      });
    }

    const updatedModules = await updateUserModules(
      req.user.id,
      moduleIds,
      req.app.locals
    );

    return res.status(200).json({
      success: true,
      data: updatedModules,
      count: updatedModules.length,
      message: 'Modules updated successfully',
    });
  } catch (error) {
    console.error('[PROFILE] Update modules error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * POST /api/voice/profile/modules
 * Add single module to user
 */
async function addModule(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { moduleId, moduleName } = req.body;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['moduleId is required'],
      });
    }

    const module = await addUserModule(
      req.user.id,
      moduleId,
      moduleName || `Module ${moduleId}`,
      req.app.locals
    );

    return res.status(201).json({
      success: true,
      data: module,
      message: 'Module added successfully',
    });
  } catch (error) {
    console.error('[PROFILE] Add module error:', error);

    // Handle specific error cases
    if (error.message.includes('Module already assigned')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Module already assigned to user',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * DELETE /api/voice/profile/modules/:moduleId
 * Remove module from user
 */
async function removeModule(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { moduleId } = req.params;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['moduleId is required'],
      });
    }

    const success = await removeUserModule(req.user.id, moduleId, req.app.locals);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Module not found for this user',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Module removed successfully',
    });
  } catch (error) {
    console.error('[PROFILE] Remove module error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getModules,
  updateModules,
  addModule,
  removeModule,
};
