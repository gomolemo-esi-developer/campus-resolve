const { getConnectionsByChannel, deleteConnection } = require('../lib/dynamo-connections');
const { postToConnections, createClient } = require('../lib/ws-management');

/**
 * Event Fanout Lambda handler
 * Processes SQS events and fans them out to subscribed WebSocket connections
 * Expected SQS message: { "channel": "complaint:123", "eventType": "message.new", "payload": {...} }
 */
exports.handler = async (event) => {
  console.log('Processing SQS event batch:', JSON.stringify(event, null, 2));
  
  const region = process.env.AWS_REGION || 'us-east-2';
  const stage = process.env.WS_STAGE || 'dev';
  const apiId = process.env.WS_API_ID;
  
  const endpoint = apiId ? `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}` : null;
  
  // Process each record in the batch
  for (const record of event.Records) {
    try {
      // Parse the SQS message body
      let message;
      try {
        message = JSON.parse(record.body);
      } catch (e) {
        console.error('Failed to parse SQS message:', record.body);
        continue;
      }
      
      const { channel, eventType, payload } = message;
      
      if (!channel) {
        console.error('Missing channel in message:', message);
        continue;
      }
      
      console.log(`Processing event ${eventType} for channel: ${channel}`);
      
      // Get all connections subscribed to this channel
      const connections = await getConnectionsByChannel(channel);
      
      if (connections.length === 0) {
        console.log(`No connections subscribed to channel: ${channel}`);
        continue;
      }
      
      console.log(`Found ${connections.length} connections for channel: ${channel}`);
      
      // Prepare the WebSocket message
      const wsMessage = {
        channel,
        eventType,
        payload,
        timestamp: Date.now()
      };
      
      // Send to all connections
      if (endpoint) {
        const sentCount = await postToConnections(endpoint, connections, wsMessage);
        console.log(`Successfully sent to ${sentCount} connections`);
      } else {
        console.log('WS_API_ID not configured, skipping WebSocket fanout');
      }
      
    } catch (error) {
      console.error('Error processing SQS record:', error);
      // Continue processing other records
    }
  }
  
  return { batchItemFailures: [] };
};