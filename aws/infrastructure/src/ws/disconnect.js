const { deleteConnection } = require('../lib/dynamo-connections');

/**
 * WebSocket $disconnect handler
 * Called when a client disconnects from the WebSocket API
 */
exports.handler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    
    // Remove connection from DynamoDB
    await deleteConnection(connectionId);
    
    console.log(`WebSocket disconnected: ${connectionId}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Disconnected' })
    };
  } catch (error) {
    console.error('Disconnect handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to disconnect' })
    };
  }
};