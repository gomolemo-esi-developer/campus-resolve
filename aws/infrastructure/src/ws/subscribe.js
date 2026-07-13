const { updateSubscription } = require('../lib/dynamo-connections');

/**
 * WebSocket subscribe handler
 * Subscribe a connection to a channel for real-time updates
 * Expected body: { "action": "subscribe", "channel": "complaint:123" }
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
    
    if (action !== 'subscribe' || !channel) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request: action must be "subscribe" and channel is required' })
      };
    }
    
    // Update subscription in DynamoDB
    const connection = await updateSubscription(connectionId, channel, 'subscribe');
    
    if (!connection) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Connection not found' })
      };
    }
    
    console.log(`Connection ${connectionId} subscribed to channel: ${channel}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Subscribed', 
        channel,
        subscribedChannels: connection.subscribedChannels
      })
    };
  } catch (error) {
    console.error('Subscribe handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to subscribe' })
    };
  }
};