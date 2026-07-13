/**
 * WebSocket $default handler
 * Called when a client sends a message to an undefined route
 */
exports.handler = async (event) => {
  console.log('Unknown WebSocket action:', event.body);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Unknown action' })
  };
};