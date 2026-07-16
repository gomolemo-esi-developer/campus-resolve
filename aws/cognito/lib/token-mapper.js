/**
 * JWT Token Mapper
 * Decodes Cognito JWT tokens and maps claims to application User objects
 */

const jwt = require('jsonwebtoken');

class TokenMapper {
  /**
   * Decode JWT without verification (for client-side use)
   * Warning: This does NOT verify the token signature
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload
   */
  static decodeToken(token) {
    try {
      if (!token) return null;

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const decoded = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );
      return decoded;
    } catch (error) {
      console.error('[TokenMapper] Decode error:', error.message);
      return null;
    }
  }

  /**
   * Map Cognito ID token claims to application User object
   * @param {string} idToken - Cognito ID token (JWT)
   * @returns {Object} Normalized User object
   */
  static mapIdTokenToUser(idToken) {
    const decoded = this.decodeToken(idToken);
    if (!decoded) return null;

    return {
      id: decoded.sub, // Cognito user ID
      email: decoded.email,
      emailVerified: decoded.email_verified || false,
      studentNumber: decoded['custom:student_number'] || null,
      staffNumber: decoded['custom:staff_number'] || null,
      role: decoded['custom:role'] || 'student',
      // Cognito-specific fields
      cognito_sub: decoded.sub,
      cognito_aud: decoded.aud,
      cognito_iss: decoded.iss,
    };
  }

  /**
   * Map Cognito access token claims to authorization object
   * @param {string} accessToken - Cognito access token (JWT)
   * @returns {Object} Authorization object with scopes and permissions
   */
  static mapAccessTokenToAuthz(accessToken) {
    const decoded = this.decodeToken(accessToken);
    if (!decoded) return null;

    return {
      userId: decoded.sub,
      username: decoded.username,
      scope: decoded.scope ? decoded.scope.split(' ') : [],
      tokenUse: decoded.token_use, // 'access'
      tokenExpiry: decoded.exp,
      issuedAt: decoded.iat,
      // Cognito-specific
      cognito_sub: decoded.sub,
      cognito_aud: decoded.aud,
    };
  }

  /**
   * Extract all custom attributes from ID token
   * @param {string} idToken - Cognito ID token
   * @returns {Object} Custom attributes (prefixed with 'custom:')
   */
  static extractCustomAttributes(idToken) {
    const decoded = this.decodeToken(idToken);
    if (!decoded) return {};

    const customAttrs = {};
    Object.entries(decoded).forEach(([key, value]) => {
      if (key.startsWith('custom:')) {
        const attrName = key.replace('custom:', '');
        customAttrs[attrName] = value;
      }
    });

    return customAttrs;
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  static isTokenExpired(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  }

  /**
   * Get token expiry time in milliseconds
   * @param {string} token - JWT token
   * @returns {number|null} Milliseconds until expiry (or null if expired/invalid)
   */
  static getTimeUntilExpiry(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    const secondsUntilExpiry = decoded.exp - now;

    return secondsUntilExpiry > 0 ? secondsUntilExpiry * 1000 : null;
  }

  /**
   * Verify JWT signature using Cognito public keys
   * Note: Requires fetching public keys from Cognito JWKS endpoint
   * @param {string} token - JWT token
   * @param {Object} publicKeys - Cognito public keys (from JWKS endpoint)
   * @returns {Promise<Object>} Verified decoded token
   */
  static async verifyToken(token, publicKeys) {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) throw new Error('Invalid token format');

      const kid = decoded.header.kid;
      const publicKey = publicKeys[kid];

      if (!publicKey) {
        throw new Error('Public key not found for token key ID');
      }

      const verified = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      });

      return verified;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Create normalized auth response
   * @param {Object} cognitoResponse - Response from Cognito signin/refresh
   * @returns {Object} Normalized authentication response
   */
  static normalizeAuthResponse(cognitoResponse) {
    return {
      success: true,
      idToken: cognitoResponse.idToken,
      accessToken: cognitoResponse.accessToken,
      refreshToken: cognitoResponse.refreshToken || null,
      expiresIn: cognitoResponse.expiresIn,
      tokenType: 'Bearer',
      user: this.mapIdTokenToUser(cognitoResponse.idToken),
    };
  }

  /**
   * Create normalized error response
   * @param {Error} error - Error object
   * @returns {Object} Normalized error response
   */
  static normalizeErrorResponse(error) {
    const statusMap = {
      UsernameExistsException: 409,
      UserNotFoundException: 401,
      NotAuthorizedException: 401,
      UserNotConfirmedException: 403,
      UserDisabledException: 403,
      InvalidPasswordException: 400,
      InvalidParameterException: 400,
      CodeMismatchException: 400,
      ExpiredCodeException: 400,
      LimitExceededException: 429,
    };

    const status = statusMap[error.code] || 500;
    const userMessage =
      error.userMessage || error.message || 'Authentication failed';

    return {
      success: false,
      status,
      error: error.code || 'UnknownError',
      message: userMessage,
      details: error.details || null,
    };
  }
}

module.exports = TokenMapper;
