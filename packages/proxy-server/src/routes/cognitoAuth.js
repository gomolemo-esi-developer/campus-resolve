/**
 * Cognito Authentication Routes
 * AWS Cognito endpoints for sign-up, sign-in, token refresh, etc.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const CognitoAuthController = require('../controllers/cognitoAuthController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const controller = new CognitoAuthController();

/**
 * Rate limiting configuration
 * Prevents brute force attacks on auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Don't rate-limit authenticated users (token refresh)
    return req.user ? true : false;
  },
});

const refreshLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 refresh attempts per minute
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many refresh attempts. Please try again in a moment.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/cognito/signup
 * Register a new user
 * Body: { email, password, given_name, family_name, student_number, staff_number, role }
 */
router.post('/signup', authLimiter, (req, res) => {
  controller.signup(req, res);
});

/**
 * POST /api/auth/cognito/confirm
 * Confirm user email with verification code
 * Body: { email, confirmationCode }
 */
router.post('/confirm', authLimiter, (req, res) => {
  controller.confirmSignup(req, res);
});

/**
 * POST /api/auth/cognito/resend-code
 * Resend verification code
 * Body: { email }
 */
router.post('/resend-code', authLimiter, (req, res) => {
  controller.resendConfirmationCode(req, res);
});

/**
 * POST /api/auth/cognito/signin
 * Sign in existing user
 * Body: { email, password }
 */
router.post('/signin', authLimiter, (req, res) => {
  controller.signin(req, res);
});

/**
 * POST /api/auth/cognito/refresh
 * Refresh access and ID tokens
 * Body: { refreshToken } or Cookie: refreshToken
 */
router.post('/refresh', refreshLimiter, (req, res) => {
  controller.refreshToken(req, res);
});

/**
 * POST /api/auth/cognito/logout
 * Sign out user
 * Headers: Authorization: Bearer {token}
 */
router.post('/logout', authMiddleware, (req, res) => {
  controller.logout(req, res);
});

module.exports = router;
