/**
 * WebSocket Client for real-time updates
 * Connects to the API Gateway WebSocket endpoint and handles message routing
 */

type MessageHandler = (data: {
  channel: string;
  eventType: string;
  payload: any;
  timestamp: number;
}) => void;

interface WebSocketClientOptions {
  endpoint: string;
  token?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private endpoint: string;
  private token?: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts: number = 0;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private isConnected: boolean = false;
  private shouldReconnect: boolean = true;

  constructor(options: WebSocketClientOptions) {
    this.endpoint = options.endpoint;
    this.token = options.token;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      // Build URL with auth token
      const url = this.token
        ? `${this.endpoint}?token=${encodeURIComponent(this.token)}`
        : this.endpoint;

      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[WS] Connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('[WS] Closed:', event.code, event.reason);
          this.isConnected = false;

          // Auto-reconnect if appropriate
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Subscribe to a channel for real-time updates
   * @param channel Channel name (e.g., "complaint:123")
   * @param handler Callback for incoming messages
   */
  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }

    this.handlers.get(channel)!.add(handler);

    // Send subscription message if connected
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        channel
      }));
    }

    // Return unsubscribe function
    return () => {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        channelHandlers.delete(handler);

        // Unsubscribe from server if no more handlers
        if (channelHandlers.size === 0) {
          this.handlers.delete(channel);
          if (this.isConnected && this.ws) {
            this.ws.send(JSON.stringify({
              action: 'unsubscribe',
              channel
            }));
          }
        }
      }
    };
  }

  /**
   * Unsubscribe from a channel
   * @param channel Channel name
   */
  unsubscribe(channel: string): void {
    this.handlers.delete(channel);

    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        channel
      }));
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Route to appropriate channel handlers
      const channel = message.channel;
      if (channel && this.handlers.has(channel)) {
        this.handlers.get(channel)!.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('[WS] Handler error:', error);
          }
        });
      }
    } catch (error) {
      console.error('[WS] Failed to parse message:', error);
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    console.log(`[WS] Reconnecting in ${this.reconnectInterval}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(err => {
          console.error('[WS] Reconnect failed:', err);
        });
      }
    }, this.reconnectInterval);
  }

  /**
   * Update the authentication token
   */
  setToken(token: string): void {
    this.token = token;
    // Reconnect with new token if connected
    if (this.isConnected) {
      this.disconnect();
      this.connect().catch(console.error);
    }
  }

  /**
   * Check if connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

/**
 * Initialize the WebSocket client
 */
export function initWebSocketClient(options: WebSocketClientOptions): WebSocketClient {
  wsClient = new WebSocketClient(options);
  return wsClient;
}

/**
 * Get the current WebSocket client instance
 */
export function getWebSocketClient(): WebSocketClient | null {
  return wsClient;
}

/**
 * Convenience function to subscribe to a channel
 * Automatically connects if not already connected
 */
export function subscribe(
  channel: string,
  handler: MessageHandler,
  endpoint?: string,
  token?: string
): () => void {
  if (!wsClient && endpoint) {
    wsClient = new WebSocketClient({ endpoint, token });
    wsClient.connect().catch(console.error);
  }

  if (!wsClient) {
    console.warn('[WS] WebSocket client not initialized');
    return () => {};
  }

  // If not connected, connect first
  if (!wsClient.connected && endpoint) {
    wsClient.connect().catch(console.error);
  }

  return wsClient.subscribe(channel, handler);
}

/**
 * Convenience function to disconnect
 */
export function disconnectWebSocket(): void {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}

export type { MessageHandler, WebSocketClientOptions };