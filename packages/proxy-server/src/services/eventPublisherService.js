const { isEnabled } = require('./featureFlagService');

// Lazy load AWS SDK to avoid breaking if module not installed yet
let sqsClient = null;
let initialized = false;

function initSQS() {
  if (initialized) return sqsClient;
  initialized = true;
  
  // Check if AWS SDK is available (may not be installed yet)
  let SQSClient, SendMessageCommand;
  try {
    const awsSdk = require('@aws-sdk/client-sqs');
    SQSClient = awsSdk.SQSClient;
    SendMessageCommand = awsSdk.SendMessageCommand;
  } catch (e) {
    console.log('[EventPublisher] @aws-sdk/client-sqs not installed - realtime events disabled');
    return null;
  }
  
  if (!process.env.SQS_QUEUE_URL || !isEnabled('FEATURE_REALTIME_WS')) {
    console.log('[EventPublisher] SQS disabled - missing SQS_QUEUE_URL or FEATURE_REALTIME_WS');
    return null;
  }
  
  const region = process.env.AWS_REGION || process.env.COGNITO_REGION || 'us-east-2';
  sqsClient = new SQSClient({ region });
  return sqsClient;
}

/**
 * Publish an event to SQS for WebSocket fanout
 * If SQS_QUEUE_URL is not set or FEATURE_REALTIME_WS is false, this is a no-op
 */
async function publishEvent(channel, eventType, payload) {
  const client = initSQS();
  if (!client) return;

  const message = {
    channel,
    eventType,
    payload,
    timestamp: Date.now(),
  };

  try {
    await client.send(new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(message),
    }));
    console.log(`[EventPublisher] Published ${eventType} to ${channel}`);
  } catch (error) {
    console.error('[EventPublisher] Failed to publish event:', error);
  }
}

/**
 * Build event payload for complaint events
 */
function buildComplaintPayload(complaint, eventType) {
  return {
    complaintId: complaint.id,
    title: complaint.title,
    status: complaint.status,
    assignedTo: complaint.assigned_to,
    currentLevel: complaint.current_level,
    priority: complaint.priority,
    filedBy: complaint.filed_by,
  };
}

/**
 * Build event payload for message events
 */
function buildMessagePayload(message) {
  return {
    messageId: message.id,
    complaintId: message.complaint_id,
    senderId: message.sender_id,
    content: message.content,
    messageType: message.message_type,
  };
}

module.exports = {
  publishEvent,
  buildComplaintPayload,
  buildMessagePayload,
};