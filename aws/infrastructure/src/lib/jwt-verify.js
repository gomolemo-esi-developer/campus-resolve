const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Cache for JWKS
let client = null;
let clientConfig = null;

/**
 * Get or create JWKS client
 */
function getClient(region, userPoolId) {
  const configKey = `${region}:${userPoolId}`;
  
  if (!client || clientConfig !== configKey) {
    client = jwksClient({
      jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10
    });
    clientConfig = configKey;
  }
  
  return client;
}

/**
 * Get signing key from JWKS
 */
async function getSigningKey(client, kid) {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
      } else {
        resolve(key.getPublicKey());
      }
    });
  });
}

/**
 * Verify and decode JWT token
 * @param {string} token - The JWT token to verify
 * @param {string} region - AWS region
 * @param {string} userPoolId - Cognito User Pool ID
 * @returns {object} Decoded token payload
 */
async function verifyToken(token, region, userPoolId) {
  try {
    // Decode without verification to get the header
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded || !decoded.header.kid) {
      throw new Error('Invalid token: missing kid');
    }
    
    // Get the signing key
    const client = getClient(region, userPoolId);
    const signingKey = await getSigningKey(client, decoded.header.kid);
    
    // Verify the token
    const payload = jwt.verify(token, signingKey, {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
    });
    
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload['cognito:role'] || payload.role || 'user'
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw error;
  }
}

/**
 * Extract token from request
 * Supports:
 * - queryStringParameters.token
 * - headers.Authorization (Bearer token)
 * - headers.authorization (Bearer token)
 */
function extractToken(event) {
  // Check query string
  if (event.queryStringParameters && event.queryStringParameters.token) {
    return event.queryStringParameters.token;
  }
  
  // Check headers
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
  }
  
  return null;
}

module.exports = {
  verifyToken,
  extractToken
};