/**
 * useMessages Hook - Campus Voice
 * Handles message thread and attachment operations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useApiClient } from './useApiClient';
import { uploadFileToS3 } from '../lib/attachmentUpload';
import { initWebSocketClient, getWebSocketClient, subscribe, type MessageHandler } from '../lib/websocketClient';

export interface AttachmentPayload {
  name: string;
  fileType?: string;
  mimeType?: string;
  sizeBytes?: number;
  size?: number;
  url?: string;
  storageKey?: string;
}

interface LooseRecord {
  [key: string]: unknown;
}

const asRecord = (value: unknown): LooseRecord => {
  return value && typeof value === 'object' ? (value as LooseRecord) : {};
};

export interface ComplaintMessage {
  id: string;
  complaint_id: string;
  sender_id: string;
  content: string;
  subject?: string;
  message_type: 'student' | 'staff' | 'system' | 'initial' | 'reply';
  is_internal: boolean;
  read_at?: string;
  created_at: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
    id: string;
    file_name: string;
    file_path?: string;
    file_size?: number;
    file_type?: string;
    mime_type?: string;
    storage_key?: string;
    created_at?: string;
    url?: string;
    s3Url?: string;
 }

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const normalizeAttachment = (attachment: unknown): MessageAttachment => {
    const item = asRecord(attachment);
    return {
      id: toStringValue(item.id, ''),
      file_name: toStringValue(
        item.file_name ?? item.name,
        'Attachment'
      ),
      file_path: toStringValue(
        item.file_path ?? item.url,
        ''
      ) || undefined,
      file_size: Number(item.file_size ?? item.size ?? 0) || undefined,
      file_type: toStringValue(
        item.file_type ?? item.type,
        'document'
      ),
      mime_type: toStringValue(item.mime_type ?? item.mimeType, '') || undefined,
      storage_key: toStringValue(
        item.storage_key ?? item.storageKey,
        ''
      ) || undefined,
      created_at: toStringValue(item.created_at, new Date().toISOString()) || undefined,
      url: toStringValue(item.url ?? item.file_path, '') || undefined,
      s3Url: toStringValue(item.s3Url ?? item.url ?? item.file_path, '') || undefined,
    };
  };

const normalizeMessage = (message: unknown): ComplaintMessage => {
  const item = asRecord(message);
  return {
    id: toStringValue(item.id, ''),
    complaint_id: toStringValue(item.complaint_id, ''),
    sender_id: toStringValue(item.sender_id, ''),
    content: toStringValue(item.content, ''),
    subject: item.subject ? toStringValue(item.subject) : undefined,
    message_type: (toStringValue(item.message_type, 'reply') as ComplaintMessage['message_type']),
    is_internal: Boolean(item.is_internal),
    read_at: item.read_at ? toStringValue(item.read_at) : undefined,
    created_at: toStringValue(item.created_at, new Date().toISOString()),
    attachments: Array.isArray(item.attachments)
      ? item.attachments.map(normalizeAttachment)
      : [],
  };
};

export const useMessages = () => {
  const api = useApiClient();
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ComplaintMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const currentComplaintId = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize WebSocket and subscribe to complaint channel
  const setupWebSocket = useCallback(
    (complaintId: string, token?: string) => {
      // Clean up previous subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      const wsEndpoint = import.meta.env.VITE_WS_ENDPOINT;
      const realtimeEnabled = import.meta.env.VITE_REALTIME_WS_ENABLED === 'true';

      if (!wsEndpoint || !realtimeEnabled) {
        console.log('[WS] WebSocket not enabled');
        return;
      }

      // Initialize WebSocket client if not already done
      let client = getWebSocketClient();
      if (!client) {
        client = initWebSocketClient({
          endpoint: wsEndpoint,
          token,
        });
        client.connect()
          .then(() => setIsConnected(true))
          .catch(err => console.error('[WS] Connection failed:', err));
      }

      // Subscribe to complaint channel
      const channel = `complaint:${complaintId}`;
      const handler: MessageHandler = (data) => {
        console.log('[WS] Received message:', data);
        if (data.eventType === 'message.new') {
          // New message received, refresh the thread
          const newMessage = normalizeMessage(data.payload);
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        } else if (data.eventType === 'complaint.updated') {
          // Complaint was updated, could trigger a refresh
          console.log('[WS] Complaint updated:', data.payload);
        }
      };

      unsubscribeRef.current = subscribe(channel, handler, wsEndpoint, token);
      currentComplaintId.current = complaintId;
    },
    []
  );

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Get message thread for a complaint
  const fetchThread = useCallback(
    async (complaintId: string, token?: string) => {
      const response = await api.get<ComplaintMessage[]>(`/messages/${complaintId}`);

      if (response?.success && response.data) {
        const normalized = response.data.map(normalizeMessage);
        setMessages(normalized);
        
        // Set up WebSocket subscription after fetching messages
        setupWebSocket(complaintId, token);
        
        return normalized;
      }
      return null;
    },
    [api, setupWebSocket]
  );

  // Search messages
  const searchMessages = useCallback(
    async (query: string) => {
      const response = await api.get<ComplaintMessage[]>(
        `/messages/search?query=${encodeURIComponent(query)}`
      );

      if (response?.success && response.data) {
        const normalized = response.data.map(normalizeMessage);
        setFilteredMessages(normalized);
        return normalized;
      }
      return null;
    },
    [api]
  );

  // Filter messages by status
  const filterMessages = useCallback(
    async (filter: string) => {
      const response = await api.get<ComplaintMessage[]>(`/messages?filter=${filter}`);

      if (response?.success && response.data) {
        const normalized = response.data.map(normalizeMessage);
        setFilteredMessages(normalized);
        return normalized;
      }
      return null;
    },
    [api]
  );

  // Add message reply to complaint
  const addReply = useCallback(
    async (
      complaintId: string,
      content: string,
      options?: { subject?: string; attachments?: AttachmentPayload[] }
    ) => {
      const response = await api.post<ComplaintMessage>(
        `/messages/${complaintId}/reply`,
        {
          content,
          subject: options?.subject,
          attachments: options?.attachments || [],
        },
        {
          showToast: true,
        }
      );

      if (response?.success && response.data) {
        const normalized = normalizeMessage(response.data);
        setMessages((prev) => [...prev, normalized]);
        return normalized;
      }
      return null;
    },
    [api]
  );

  // Upload attachment
  const uploadAttachment = useCallback(
    async (messageId: string, file: File, complaintId?: string) => {
      try {
        const result = await uploadFileToS3(file, 'complaint', complaintId || messageId, {
          messageId,
          onProgress: (progress) => {
            console.log(`Upload progress: ${progress}%`);
          },
        });

        if (result.attachment) {
          return normalizeAttachment(result.attachment);
        }
        return null;
      } catch (error) {
        console.error('Upload error:', error);
        return null;
      }
    },
    []
  );

  // Get message attachments
  const fetchAttachments = useCallback(
    async (messageId: string) => {
      const response = await api.get<MessageAttachment[]>(
        `/messages/${messageId}/attachments`
      );

      if (response?.success && response.data) {
        return response.data.map(normalizeAttachment);
      }
      return null;
    },
    [api]
  );

  return {
    // State
    messages,
    filteredMessages,
    loading: api.loading,
    error: api.error,
    isConnected,

    // Methods
    fetchThread,
    searchMessages,
    filterMessages,
    addReply,
    uploadAttachment,
    fetchAttachments,
  };
};
