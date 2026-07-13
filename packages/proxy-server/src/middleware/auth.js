// Authentication Middleware - JWT verification and RBAC
const { verifyToken, isCognitoToken } = require('../services/authService');

// Dev mode: bypass authentication if SKIP_AUTH is set
const SKIP_AUTH = process.env.SKIP_AUTH === 'true';

// Mock dev user for testing all roles
const DEV_USERS = {
  student: { id: 'dev-user-1', email: 'student@dev.local', role: 'student', firstName: 'Dev', lastName: 'Student' },
  staff: { id: 'dev-user-2', email: 'staff@dev.local', role: 'staff', firstName: 'Dev', lastName: 'Staff' },
  admin: { id: 'dev-user-3', email: 'admin@dev.local', role: 'admin', firstName: 'Dev', lastName: 'Admin' },
};

/**
 * JWT Authentication Middleware
 * Supports both local HS256 and Cognito RS256 tokens
 */
async function authMiddleware(req, res, next) {
  // Dev mode: bypass authentication
  if (SKIP_AUTH) {
    // Default to admin role in dev mode
    req.user = DEV_USERS.admin;
    req.user.source = 'dev-mode';
    console.log('[AUTH] Dev mode enabled - using mock admin user');
    return next();
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header missing or invalid',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Debug logging
    console.log('[AUTH] Verifying token, length:', token.length);
    console.log('[AUTH] Token header:', token.split('.')[0]); // First part is header
    
    // Detect if this is a Cognito token and verify accordingly
    // verifyToken now auto-detects token type
    
    try {
      // verifyToken now handles both local and Cognito tokens
      const decoded = await verifyToken(token);
      
      // Map Cognito role to our role system
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.given_name || decoded.firstName || 'User',
        lastName: decoded.family_name || decoded.lastName || 'Name',
        role: mapCognitoRole(decoded['custom:role'] || decoded.role),
        cognitoSub: decoded.sub,
      };
      
      console.log('[AUTH] Token verified:', req.user.email, 'Role:', req.user.role);
      next();
    } catch (error) {
      console.error('[AUTH] Token verification failed:', error.message);
      return res.status(401).json({
        error: 'Unauthorized',
        message: error.message,
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * Map Cognito role to our role system
 */
function mapCognitoRole(cognitoRole) {
  if (!cognitoRole) return 'staff';
  
  const roleMap = {
    'admin': 'admin-resolve',
    'staff': 'staff',
    'student': 'student',
    'admin-resolve': 'admin-resolve',
  };
  
  return roleMap[cognitoRole.toLowerCase()] || 'staff';
}

/**
 * Role-based Access Control Middleware Factory
 * Creates middleware that checks if user has required role(s)
 * @param {...string} allowedRoles - Roles that are allowed
 * @returns {Function} Middleware function
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `User role '${req.user.role}' is not authorized to access this resource. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Preset role combinations for common use cases
 */
const requireRoles = {
  student: requireRole('student', 'admin'),
  staff: requireRole('staff', 'admin'),
  admin: requireRole('admin'),
  studentOrStaff: requireRole('student', 'staff', 'admin'),
  staffOrAdmin: requireRole('staff', 'admin'),
};

module.exports = {
  authMiddleware,
  requireRole,
  requireRoles,
};
