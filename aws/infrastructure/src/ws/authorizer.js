const { verifyToken, extractToken } = require('../lib/jwt-verify');

/**
 * WebSocket Authorizer handler
 * Validates JWT tokens for $connect route
 */
exports.handler = async (event) => {
  try {
    const token = extractToken(event);
    const region = event.headers?.['x-aws-region'] || process.env.AWS_REGION || 'us-east-2';
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    
    if (!token) {
      // Allow connection without token for development
      // In production, return 401 to deny
      console.log('No token provided, allowing for development');
      return generatePolicy('anonymous', 'Allow', event.routeArn);
    }
    
    // Verify the token
    const claims = await verifyToken(token, region, userPoolId);
    
    console.log('Authorizer: Token valid for user', claims.sub);
    
    // Generate IAM policy with the Cognito sub as principalId
    return generatePolicy(claims.sub, 'Allow', event.routeArn, {
      userId: claims.sub,
      email: claims.email,
      role: claims.role
    });
  } catch (error) {
    console.error('Authorizer error:', error.message);
    
    // Allow in development, deny in production
    if (process.env.NODE_ENV === 'production') {
      return generatePolicy('anonymous', 'Deny', event.routeArn);
    }
    
    console.log('Allowing connection despite auth failure (dev mode)');
    return generatePolicy('anonymous', 'Allow', event.routeArn);
  }
};

/**
 * Generate IAM policy for API Gateway authorizer
 */
function generatePolicy(principalId, effect, resource, context = null) {
  const policy = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    }
  };
  
  if (context) {
    policy.context = context;
  }
  
  return policy;
}