const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const { deleteConnection } = require('./dynamo-connections');

const endpoint = process.env.WS_ENDPOINT || `https://${process.env.WS_API_ID}.execute-api.${process.env.AWS_REGION}.amazonaws.com/${process.env.WS_STAGE}`;
const client = new ApiGatewayManagementApiClient({ endpoint });

/**
 * Create API Gateway Management API client for the current stage
 */
function createClient(stage, region, apiId) {
  return new ApiGatewayManagementApiClient({
    endpoint: `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}`
  });
}

/**
 * Send message to a specific connection
 */
async function sendToConnection(connectionId, data) {
  try {
    await client.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: typeof data === 'string' ? data : JSON.stringify(data)
    }));
    return true;
  } catch (error) {
    if (error.name === 'GoneException') {
      await deleteConnection(connectionId);
      console.log(`Removed stale connection: ${connectionId}`);
      return false;
    }
    throw error;
  }
}

/**
 * Post to multiple connections
 * @param {string} endpoint - The WebSocket API endpoint
 * @param {Array} connections - Array of connection objects with connectionId
 * @param {object} data - The data to send
 */
async function postToConnections(endpoint, connections, data) {
  const results = await Promise.allSettled(
    connections.map(conn => postToConnection(endpoint, conn.connectionId, data))
  );
  
  // Log failures
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`Failed to send to connection ${connections[index].connectionId}:`, result.reason);
    }
  });
  
  return results.filter(r => r.status === 'fulfilled').length;
}

module.exports = {
  createClient,
  sendToConnection,
  postToConnection,
  postToConnections
};