const { putConnection } = require('../lib/dynamo-connections');
const { verifyToken, extractToken } = require('../lib/jwt-verify');

/**
 * WebSocket $connect handler
 * Called when a client connects to the WebSocket API
 */
exports.handler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const region = event.headers?.['x-aws-region'] || process.env.AWS_REGION || 'us-east-2';
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    
    // Extract and verify token
    const token = extractToken(event);
    let userId = 'anonymous';
    
    if (token && userPoolId) {
      try {
        const claims = await verifyToken(token, region, userPoolId);
        userId = claims.sub;
        console.log(`Connection ${connectionId} authenticated as user ${userId}`);
      } catch (err) {
        console.log(`Connection ${connectionId} authentication failed, allowing as anonymous:`, err.message);
        // Allow anonymous connections for development
      }
    }
    
    // Store connection in DynamoDB
    await putConnection(connectionId, userId, []);
    
    console.log(`WebSocket connected: ${connectionId} (user: ${userId})`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected', connectionId })
    };
  } catch (error) {
    console.error('Connect handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to connect' })
    };
  }
};