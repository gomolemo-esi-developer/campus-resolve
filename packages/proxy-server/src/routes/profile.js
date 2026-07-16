// Profile Routes
const express = require('express');
const {
  getProfile,
  updateProfile,
  getModules,
  updateModules,
  addModule,
  removeModule,
} = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * All profile routes require authentication
 */
router.use(authMiddleware);

/**
 * GET /api/voice/profile
 * Get current user's profile
 * Requires: Authorization header with Bearer token
 */
router.get('/', getProfile);

/**
 * PUT /api/voice/profile
 * Update current user's profile
 * Requires: Authorization header with Bearer token
 * Body: { email, faculty, department, campus, course, residence, phone }
 */
router.put('/', updateProfile);

/**
 * GET /api/voice/profile/modules
 * Get user's enrolled modules
 * Requires: Authorization header with Bearer token
 * Returns: Array of modules with moduleId and moduleName
 */
router.get('/modules', getModules);

/**
 * PUT /api/voice/profile/modules
 * Update user's enrolled modules (replace all)
 * Requires: Authorization header with Bearer token
 * Body: { moduleIds: [string] }
 */
router.put('/modules', updateModules);

/**
 * POST /api/voice/profile/modules
 * Add single module to user
 * Requires: Authorization header with Bearer token
 * Body: { moduleId: string, moduleName?: string }
 */
router.post('/modules', addModule);

/**
 * DELETE /api/voice/profile/modules/:moduleId
 * Remove module from user
 * Requires: Authorization header with Bearer token
 * Params: moduleId (string)
 */
router.delete('/modules/:moduleId', removeModule);

module.exports = router;
