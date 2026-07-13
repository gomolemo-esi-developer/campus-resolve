/**
 * WebSocket complaints channel handler
 * Handles complaint-specific realtime events
 */
const { getConnection, updateConnection } = require('../lib/dynamo-connections');
const { sendToConnection } = require('../lib/ws-management');

// Channel subscriptions stored in memory (use Redis in production)
const channelSubscriptions = new Map();

/**
 * Subscribe to complaints channel
 */
exports.subscribeComplaints = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const body = JSON.parse(event.body || '{}');
  const { userId, staffId } = body;

  try {
    // Get existing connection
    const connection = await getConnection(connectionId);
    
    // Add to complaints channel
    const channel = `complaints:${staffId || userId}`;
    if (!channelSubscriptions.has(channel)) {
      channelSubscriptions.set(channel, new Set());
    }
    channelSubscriptions.get(channel).add(connectionId);

    // Update connection metadata
    await updateConnection(connectionId, { status: 'subscribed', channel });

    console.log(`Connection ${connectionId} subscribed to ${channel}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Subscribed to complaints channel', channel })
    };
  } catch (error) {
    console.error('Subscribe complaints error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to subscribe' })
    };
  }
};

/**
 * Broadcast complaint events to subscribed staff
 */
exports.broadcastComplaintEvent = async (event) => {
  const { type, complaintId, staffId, data } = JSON.parse(event.body || '{}');

  try {
    const channel = staffId ? `complaints:${staffId}` : 'complaints:all';
    const subscribers = channelSubscriptions.get(channel) || new Set();

    const message = JSON.stringify({
      type: `complaint.${type}`,
      complaintId,
      data
    });

    const results = await Promise.allSettled(
      Array.from(subscribers).map(connId => sendToConnection(connId, message))
    );

    console.log(`Broadcast to ${subscribers.size} subscribers on ${channel}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ broadcasted: results.length })
    };
  } catch (error) {
    console.error('Broadcast error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Broadcast failed' })
    };
  }
};

/**
 * Handle new complaint message
 */
exports.handleComplaintMessage = async (event) => {
  const { complaintId, senderId, message } = JSON.parse(event.body || '{}');

  // Broadcast to complaint channel
  const channel = `complaint:${complaintId}`;
  const subscribers = channelSubscriptions.get(channel) || new Set();

  const payload = JSON.stringify({
    action: 'complaint.message',
    complaintId,
    senderId,
    message,
    timestamp: new Date().toISOString()
  });

  await Promise.allSettled(
    Array.from(subscribers).map(connId => sendToConnection(connId, payload))
  );

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};