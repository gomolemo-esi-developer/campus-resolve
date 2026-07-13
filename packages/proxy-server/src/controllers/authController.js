// Authentication Controller - Route handlers for auth endpoints
const {
  hashPassword,
  comparePasswords,
  generateToken,
  generateRefreshToken,
  validateSignupInput,
  validateSigninInput,
  formatUserResponse,
} = require('../services/authService');

/**
 * POST /api/auth/signup
 * Register a new student user
 */
async function signup(req, res) {
  try {
    const { email, password, firstName, lastName, studentNumber, role = 'student' } = req.body;

    // Validate input
    const validation = validateSignupInput({
      email,
      password,
      firstName,
      lastName,
      studentNumber,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    // Check if email already exists
    const existingEmail = await req.app.locals.User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered',
      });
    }

    // Check if student number already exists (for students only)
    if (role === 'student') {
      const existingStudentNumber = await req.app.locals.User.findOne({
        where: { studentNumber },
      });
      if (existingStudentNumber) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Student number already registered',
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await req.app.locals.User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      studentNumber,
      role,
      is_active: true,
    });

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(tokenPayload);

    // Return token and user
    return res.status(201).json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('[AUTH] Signup error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * POST /api/auth/signin
 * Sign in an existing user
 */
async function signin(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    const validation = validateSigninInput({ email, password });

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    // Find user by email
    const user = await req.app.locals.User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Account is deactivated',
      });
    }

    // Compare passwords
    const passwordMatch = await comparePasswords(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Update last login timestamp
    await user.update({ last_login: new Date() });

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(tokenPayload);

    // Return token and user
    return res.status(200).json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('[AUTH] Signin error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * POST /api/auth/refresh
 * Refresh an expired JWT token
 * Requires: Authorization header with Bearer token
 */
async function refreshToken(req, res) {
  try {
    // User is already authenticated via authMiddleware
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Generate new token
    const tokenPayload = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    };

    const token = generateToken(tokenPayload);

    return res.status(200).json({ token });
  } catch (error) {
    console.error('[AUTH] Refresh token error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * POST /api/auth/logout
 * Sign out user (token invalidation on client side)
 * Requires: Authorization header with Bearer token
 */
async function logout(req, res) {
  try {
    // In a simple implementation, logout is handled on the client
    // by removing the token from localStorage
    // If token blacklisting is needed, implement a blacklist store

    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

module.exports = {
  signup,
  signin,
  refreshToken,
  logout,
};
