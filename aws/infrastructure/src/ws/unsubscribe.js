const { updateSubscription } = require('../lib/dynamo-connections');

/**
 * WebSocket unsubscribe handler
 * Unsubscribe a connection from a channel
 * Expected body: { "action": "unsubscribe", "channel": "complaint:123" }
 */
exports.handler = async (event) => {
  try {
    const connectionId = event.requestContext.connectionId;
    let body = {};
    
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      body = event.body || {};
    }
    
    const { action, channel } = body;
    
    if (action !== 'unsubscribe' || !channel) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request: action must be "unsubscribe" and channel is required' })
      };
    }
    
    // Update subscription in DynamoDB
    const connection = await updateSubscription(connectionId, channel, 'unsubscribe');
    
    if (!connection) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Connection not found' })
      };
    }
    
    console.log(`Connection ${connectionId} unsubscribed from channel: ${channel}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Unsubscribed', 
        channel,
        subscribedChannels: connection.subscribedChannels
      })
    };
  } catch (error) {
    console.error('Unsubscribe handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to unsubscribe' })
    };
  }
};