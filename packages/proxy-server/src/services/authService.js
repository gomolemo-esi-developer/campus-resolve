// Authentication Service - Business logic for auth operations
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare plain password with hashed password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match
 */
async function comparePasswords(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} payload.id - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiry,
    algorithm: 'HS256',
  });
}

/**
 * Generate refresh token
 * @param {Object} payload - Token payload
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtRefreshExpiry,
    algorithm: 'HS256',
  });
}

/**
 * Verify JWT token - Development mode allows bypass
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
async function verifyToken(token) {
  const isDev = process.env.NODE_ENV === 'development';
  
  // Check for dev tokens BEFORE attempting Cognito verification
  // This avoids unnecessary JWKS fetch and decoding failures for simple dev tokens
  if (isDev && (token === 'test-token' || token.startsWith('dev-token-'))) {
    console.log('[AUTH] Dev test token detected, allowing access');
    return { 
      sub: 'dev-user', 
      email: 'dev@local.test', 
      role: 'staff',
      isDevToken: true 
    };
  }
  
  // Try Cognito first
  try {
    return await verifyCognitoToken(token);
  } catch (cognitoError) {
    console.log('[AUTH] Cognito verification failed:', cognitoError.message);

    // Try local HS256 verification as a fallback for locally-issued JWTs.
    // This still cryptographically verifies the signature - it is not a bypass.
    try {
      const { env } = require('../config/env');
      return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    } catch (localError) {
      // Neither Cognito nor local verification succeeded - reject.
      throw cognitoError;
    }
  }
}

/**
 * Check if a token looks like a Cognito token (by header)
 * @param {string} token - JWT token
 * @returns {boolean}
 */
function isCognitoToken(token) {
  try {
    const decoded = jwt.decode(token, { complete: true });
    // Cognito tokens typically use RS256 algorithm
    return decoded?.header?.alg === 'RS256';
  } catch {
    return false;
  }
}

/**
 * Verify Cognito JWT token using Cognito's public keys
 * @param {string} token - JWT token from Cognito
 * @returns {Object} Decoded token payload
 */
async function verifyCognitoToken(token) {
  try {
    // Get Cognito region and user pool from environment
    const cognitoRegion = process.env.COGNITO_REGION || 'us-east-2';
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    
    console.log('[COGNITO] Region:', cognitoRegion, 'Pool ID:', userPoolId);
    
    if (!userPoolId) {
      throw new Error('COGNITO_USER_POOL_ID not configured');
    }
    
    // Cognito JWKS endpoint
    const jwksUrl = `https://cognito-idp.${cognitoRegion}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    console.log('[COGNITO] JWKS URL:', jwksUrl);
    
    // Fetch JWKS
    const jwksResponse = await fetch(jwksUrl);
    if (!jwksResponse.ok) {
      throw new Error(`Failed to fetch JWKS: ${jwksResponse.status}`);
    }
    const jwks = await jwksResponse.json();
    console.log('[COGNITO] JWKS keys count:', jwks.keys?.length);
    
    // Decode token header to get key ID
    const decodedHeader = jwt.decode(token, { complete: true });
    console.log('[COGNITO] Token header:', decodedHeader?.header);
    
    if (!decodedHeader || !decodedHeader.header.kid) {
      throw new Error('Invalid token header - missing kid');
    }
    
    // Find matching key
    const key = jwks.keys.find(k => k.kid === decodedHeader.header.kid);
    console.log('[COGNITO] Matching key found:', !!key);
    
    if (!key) {
      throw new Error('Token key not found in JWKS');
    }
    
    // Convert JWK to RSA public key using Node.js crypto's native JWK import
    const crypto = require('crypto');
    const publicKey = crypto.createPublicKey({
      key: { kty: key.kty, n: key.n, e: key.e },
      format: 'jwk',
    });
    
    // Verify token with Cognito issuer
    const cognitoIssuer = `https://cognito-idp.${cognitoRegion}.amazonaws.com/${userPoolId}`;
    
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: cognitoIssuer,
    });
    
    return payload;
  } catch (error) {
    if (error.message.includes('Cognito') || error.message.includes('JWKS') || error.message.includes('key') || error.message.includes('issuer')) {
      throw error;
    }
    throw new Error(`Cognito token verification failed: ${error.message}`);
  }
}

/**
 * Validate signup input
 * @param {Object} data - Request body
 * @returns {Object} Validation result with errors array
 */
function validateSignupInput(data) {
  const errors = [];

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required and must be a string');
  } else if (!data.email.includes('@')) {
    errors.push('Email must be a valid email address');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required and must be a string');
  } else if (data.password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!data.firstName || typeof data.firstName !== 'string') {
    errors.push('First name is required and must be a string');
  }

  if (!data.lastName || typeof data.lastName !== 'string') {
    errors.push('Last name is required and must be a string');
  }

  if (!data.studentNumber || typeof data.studentNumber !== 'string') {
    errors.push('Student number is required and must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate signin input
 * @param {Object} data - Request body
 * @returns {Object} Validation result with errors array
 */
function validateSigninInput(data) {
  const errors = [];

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required and must be a string');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required and must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format user response (exclude password)
 * @param {Object} user - User object from database
 * @returns {Object} Formatted user object without password
 */
function formatUserResponse(user) {
  const userObj = user.toJSON ? user.toJSON() : user;
  const { password, ...userWithoutPassword } = userObj;
  return userWithoutPassword;
}

module.exports = {
  hashPassword,
  comparePasswords,
  generateToken,
  generateRefreshToken,
  verifyToken,
  isCognitoToken,
  validateSignupInput,
  validateSigninInput,
  formatUserResponse,
};
