const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.WS_CONNECTIONS_TABLE || 'complaint-app-ws-connections-dev';

/**
 * Put a new connection into the connections table
 */
async function putConnection(connectionId, userId, subscribedChannels = []) {
  const ttl = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
  await docClient.send(new PutCommand({
    TableName: tableName,
    Item: {
      connectionId,
      userId,
      subscribedChannels,
      ttl,
      createdAt: Date.now()
    }
  }));
}

/**
 * Get a connection by ID
 */
async function getConnection(connectionId) {
  const result = await docClient.send(new GetCommand({
    TableName: tableName,
    Key: { connectionId }
  }));
  return result.Item;
}

/**
 * Delete a connection by ID
 */
async function deleteConnection(connectionId) {
  await docClient.send(new DeleteCommand({
    TableName: tableName,
    Key: { connectionId }
  }));
}

/**
 * Get connections by subscribed channel
 */
async function getConnectionsByChannel(channel) {
  // Scan is not ideal for production but works for MVP
  // In production, use a GSI on subscribedChannels
  const result = await docClient.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: 'contains(subscribedChannels, :channel)',
    ExpressionAttributeValues: {
      ':channel': channel
    }
  }));
  return result.Items || [];
}

/**
 * Update a connection's subscribed channels
 */
async function updateSubscription(connectionId, channel, action) {
  const connection = await getConnection(connectionId);
  if (!connection) return null;

  let channels = connection.subscribedChannels || [];
  if (action === 'subscribe') {
    if (!channels.includes(channel)) {
      channels.push(channel);
    }
  } else if (action === 'unsubscribe') {
    channels = channels.filter(c => c !== channel);
  }

  await docClient.send(new PutCommand({
    TableName: tableName,
    Item: {
      ...connection,
      subscribedChannels: channels,
      ttl: Math.floor(Date.now() / 1000) + 86400
    }
  }));

  return connection;
}

module.exports = {
  putConnection,
  getConnection,
  deleteConnection,
  getConnectionsByChannel,
  updateSubscription,
  tableName
};