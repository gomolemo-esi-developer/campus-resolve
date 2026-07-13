// Auth Routes
const express = require('express');
const {
  signup,
  signin,
  refreshToken,
  logout,
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

/**
 * Rate limiting for authentication endpoints
 * 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many attempts',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/signup
 * Register a new student user
 * Body: { email, password, firstName, lastName, studentNumber }
 */
router.post('/signup', authLimiter, signup);

/**
 * POST /api/auth/signin
 * Sign in existing user
 * Body: { email, password }
 */
router.post('/signin', authLimiter, signin);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 * Header: Authorization: Bearer {token}
 */
router.post('/refresh', authMiddleware, refreshToken);

/**
 * POST /api/auth/logout
 * Sign out user
 * Header: Authorization: Bearer {token}
 */
router.post('/logout', authMiddleware, logout);

module.exports = router;
