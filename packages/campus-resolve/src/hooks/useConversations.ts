/**
 * useConversations Hook - Campus Resolve
 * Handles direct message conversations
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useApiClient } from './useApiClient';
import { initWebSocketClient, getWebSocketClient, subscribe, type MessageHandler } from '../lib/websocketClient';
import type { Conversation, Message, MessageAttachment } from '@/contexts/ConversationsContext';

export const useConversations = () => {
  const api = useApiClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

const normalizeConversation = (conversation: any): Conversation => {
  return {
    ...conversation,
    type: 'direct' as 'direct',
    priority: (['normal', 'urgent', 'emergency'].includes(conversation.priority)
      ? conversation.priority
      : 'normal') as 'normal' | 'urgent' | 'emergency',
    messages: Array.isArray(conversation.messages)
      ? conversation.messages.map((message: any) => ({
          ...message,
attachments: Array.isArray(message.attachments)
  ? message.attachments.map((att: any) => {
    // Determine the best URL - prefer valid http URLs, skip blob/data URLs
    const isBlob = (v: string) => v && (v.startsWith('blob:') || v.startsWith('data:') || !v.startsWith('http'));
    const validUrl = att?.url && !isBlob(att.url) ? att.url : (att?.file_path && !isBlob(att.file_path) ? att.file_path : undefined);
    return {
      type: att?.file_type === 'image' ? 'image' : att?.type === 'pdf' ? 'pdf' : 'document',
      name: att?.name || att?.file_name || 'Attachment',
      url: validUrl || att?.s3_url || att?.storage_key || undefined,
      storageKey: att?.storage_key || att?.storageKey || undefined,
      id: att?.id || undefined,
      size: att?.size || att?.file_size || undefined,
      mimeType: att?.mimeType || att?.mime_type || undefined,
    };
  })
  : undefined,
        }))
      : [],
  };
};

  // Fetch direct conversations
  const fetchDirectConversations = useCallback(async () => {
    const response = await api.get<Conversation[]>('/direct/conversations', {
      showToast: false,
    });

    if (response?.success && response.data) {
      const directConvs = response.data.filter(c => c.type === 'direct').map(normalizeConversation);
      setConversations(prev => [...directConvs]);
      return directConvs;
    }
    return [];
  }, [api]);

  // WebSocket message handler for real-time updates
  const handleWebSocketMessage = useCallback(
    (data: { channel: string; eventType: string; payload: any }) => {
      console.log('[WS] Received message:', data);
      if (data.eventType === 'complaint.new' || data.eventType === 'complaint.updated') {
        // Refresh conversations list when there are new/updated complaints
        // Trigger a refresh by calling the API directly
        api.get<Conversation[]>('/direct/conversations', { showToast: false });
      } else if (data.eventType === 'message.new') {
        // Update the selected conversation if it's the one being updated
        if (selectedConversation && data.payload?.complaint_id === selectedConversation.id) {
          setSelectedConversation(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...(prev.messages || []), data.payload],
            };
          });
        }
      }
    },
    [api, selectedConversation]
  );

  // Initialize WebSocket and subscribe to complaints channel
  const setupWebSocket = useCallback(
    (token?: string) => {
      const wsEndpoint = import.meta.env.VITE_WS_ENDPOINT;
      const realtimeEnabled = import.meta.env.VITE_REALTIME_WS_ENABLED === 'true';

      if (!wsEndpoint || !realtimeEnabled) {
        console.log('[WS] WebSocket not enabled');
        return;
      }

      // Clean up previous subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
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

      // Subscribe to all complaints channel for staff
      const channel = 'complaints:all';
      unsubscribeRef.current = subscribe(channel, handleWebSocketMessage as MessageHandler, wsEndpoint, token);
    },
    [handleWebSocketMessage]
  );

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Fetch all conversations
  const fetchAllConversations = useCallback(async (token?: string) => {
    try {
      const direct = await fetchDirectConversations();

      // Set up WebSocket after fetching conversations
      setupWebSocket(token);

      return direct;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }, [fetchDirectConversations, setupWebSocket]);

  // Get conversation details
  const fetchConversation = useCallback(
    async (conversationId: string, type: 'direct') => {
      const endpoint = `/${type}/conversations/${conversationId}`;
      const response = await api.get<Conversation>(endpoint, {
        showToast: false,
      });

      if (response?.success && response.data) {
        const normalized = normalizeConversation(response.data);
        setSelectedConversation(normalized);
        return normalized;
      }
      return null;
    },
    [api]
  );

// Add message to conversation
  const addMessage = useCallback(
    async (
      conversationId: string,
      type: 'direct',
      message: Omit<Message, 'id'>
    ) => {
      const endpoint = `/${type}/conversations/${conversationId}/messages`;
      const response = await api.post<Message>(
        endpoint,
        {
          subject: message.subject,
          content: message.content,
          attachments: message.attachments,
        },
        {
          showToast: true,
        }
      );

      if (response?.success && response.data) {
        // Helper to check if URL is blob/invalid
        const isBlob = (v: string) => v && (v.startsWith('blob:') || v.startsWith('data:') || !v.startsWith('http'));
        // Helper to get best URL from attachment
        const getBestUrl = (att: any) => {
          const validUrl = att?.url && !isBlob(att.url) ? att.url : (att?.file_path && !isBlob(att.file_path) ? att.file_path : undefined);
          return validUrl || att?.s3_url || att?.storage_key || undefined;
        };

        const normalizedMessage: Message = {
          ...response.data,
          attachments: Array.isArray(response.data.attachments)
            ? response.data.attachments.map((att: any) => ({
                type: att?.file_type === 'image' ? 'image' : att?.type === 'pdf' ? 'pdf' : 'document',
                name: att?.name || att?.file_name || 'Attachment',
                url: getBestUrl(att),
                storageKey: att?.storage_key || undefined,
                id: att?.id || undefined,
                size: att?.size || att?.file_size || undefined,
                mimeType: att?.mimeType || att?.mime_type || undefined,
              }))
            : undefined,
        };

        // Update selected conversation
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(prev =>
            prev ? { ...prev, messages: [...prev.messages, normalizedMessage] } : null
          );
        }
        return normalizedMessage;
      }
      return null;
    },
    [api, selectedConversation]
  );

  // Create new conversation
  const createConversation = useCallback(
    async (type: 'direct', conversationData: Omit<Conversation, 'id'>) => {
      const endpoint = `/${type}/conversations`;
      const response = await api.post<Conversation>(
        endpoint,
        {
          subject: conversationData.subject,
          sender: conversationData.sender,
          messages: conversationData.messages,
          priority: conversationData.priority,
        },
        {
          showToast: true,
        }
      );

      if (response?.success && response.data) {
        const normalized = normalizeConversation(response.data);
        setConversations(prev => [normalized, ...prev]);
        return normalized;
      }
      return null;
    },
    [api]
  );

  return useMemo(
    () => ({
      // State
      conversations,
      selectedConversation,
      loading: api.loading,
      error: api.error,
      isConnected,

      // Methods
      fetchAllConversations,
      fetchDirectConversations,
      fetchConversation,
      addMessage,
      createConversation,
      setSelectedConversation,
      setConversations,
    }),
    [
      conversations,
      selectedConversation,
      api.loading,
      api.error,
      isConnected,
      fetchAllConversations,
      fetchDirectConversations,
      fetchConversation,
      addMessage,
      createConversation,
      setSelectedConversation,
      setConversations,
    ]
  );
};
