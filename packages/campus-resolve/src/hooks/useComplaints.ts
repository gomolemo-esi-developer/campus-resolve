/**
 * useComplaints Hook - Campus Resolve
 * Handles complaint retrieval for staff with realtime support
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useApiClient } from './useApiClient';

// In-memory cache for complaint fetch requests to prevent duplicate API calls
const complaintFetchCache = new Map<string, Promise<any>>();

export interface ComplaintType {
  id: string;
  key: string;
  label: string;
  description?: string;
  isActive: boolean;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
  current_level: string;
  priority: string;
  filed_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  messages?: ComplaintMessage[];
  student_name?: string;
  student_email?: string;
}

export interface ComplaintMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_type?: 'student' | 'staff';
  created_at: string;
  subject?: string;
  attachments?: ComplaintAttachment[];
  isSent?: boolean;
}

export interface ComplaintAttachment {
   id: string;
   name: string;
   type: "pdf" | "image" | "excel" | "word" | "document";
   url?: string | null;
   storageKey?: string;
   size?: number;
   s3_url?: string;
 }

interface LooseRecord {
  [key: string]: unknown;
}

const asRecord = (value: unknown): LooseRecord => {
  return value && typeof value === 'object' ? (value as LooseRecord) : {};
};

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const normalizeComplaint = (complaint: unknown): Complaint => {
  const item = asRecord(complaint);
  return {
    id: toStringValue(item.id, ''),
    title: toStringValue(item.title, ''),
    description: toStringValue(item.description, ''),
    category: toStringValue(item.category, ''),
    status: toStringValue(item.status, 'open') as Complaint['status'],
    current_level: toStringValue(item.current_level, '1'),
    priority: toStringValue(item.priority, 'normal'),
    filed_by: toStringValue(item.filed_by, ''),
    assigned_to: item.assigned_to ? toStringValue(item.assigned_to) : undefined,
    created_at: toStringValue(item.created_at, new Date().toISOString()),
    updated_at: toStringValue(item.updated_at, toStringValue(item.created_at, new Date().toISOString())),
    messages: Array.isArray(item.messages)
      ? item.messages.map((m: any) => ({
          id: toStringValue(m.id, ''),
          content: toStringValue(m.content, ''),
          sender_id: toStringValue(m.sender_id, ''),
          sender_type: m.sender_type ? toStringValue(m.sender_type) as any : undefined,
          created_at: toStringValue(m.created_at, new Date().toISOString()),
          subject: m.subject ? toStringValue(m.subject) : undefined,
          isSent: m.sender_type === 'staff',
attachments: Array.isArray(m.attachments)
              ? m.attachments.map((a: any) => {
                  const fileType = a.type ?? a.file_type ?? 'document';
                  const validType = fileType === 'pdf' || fileType === 'image' || fileType === 'excel' || fileType === 'word' ? fileType : 'document';
                  return {
                    id: toStringValue(a.id, ''),
                    name: toStringValue(a.name ?? a.file_name, 'Attachment'),
                    type: validType,
                    url: toStringValue(a.url ?? a.file_path, '') || null,
                    storageKey: toStringValue(a.storageKey ?? a.storage_key, '') || undefined,
                    size: typeof a.size === 'number' ? a.size : (typeof a.file_size === 'number' ? a.file_size : undefined),
                  };
                })
              : [],
        }))
      : [],
    student_name: item.student_name ? toStringValue(item.student_name) : undefined,
    student_email: item.student_email ? toStringValue(item.student_email) : undefined,
  };
};

export const useComplaints = () => {
  const api = useApiClient();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [currentComplaint, setCurrentComplaint] = useState<Complaint | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  // Fetch complaints assigned to current staff member
  const fetchAssignedComplaints = useCallback(async () => {
    const response = await api.get<Complaint[]>('/complaints/assigned', {
      showToast: false,
    });

    if (response?.success && response.data) {
      const normalized = response.data.map(normalizeComplaint);
      setComplaints(normalized);
      return normalized;
    }
    return [];
  }, [api]);

  // Fetch all open complaints (for escalation/reassignment)
  const fetchAllOpenComplaints = useCallback(async () => {
    const response = await api.get<Complaint[]>('/complaints/open', {
      showToast: false,
    });

    if (response?.success && response.data) {
      const normalized = response.data.map(normalizeComplaint);
      return normalized;
    }
    return [];
  }, [api]);

// Fetch single complaint with messages
   const fetchComplaint = useCallback(async (id: string) => {
     // Check cache first to prevent duplicate requests
     let fetchPromise = complaintFetchCache.get(id);
     if (!fetchPromise) {
       fetchPromise = api.get<Complaint>(`/complaints/${id}`, {
         showToast: false,
       }).then((response) => {
         if (response?.success && response.data) {
           const normalized = normalizeComplaint(response.data);
           setCurrentComplaint(normalized);
           return normalized;
         }
         return null;
       }).finally(() => {
         // Clean up cache after request completes
         setTimeout(() => complaintFetchCache.delete(id), 5000);
       });
       complaintFetchCache.set(id, fetchPromise);
     }
     return fetchPromise;
   }, [api]);

// Update complaint status
   const updateComplaintStatus = useCallback(async (id: string, status: string) => {
     const response = await api.put<Complaint>(`/complaints/${id}`, { status }, {
      showToast: true,
    });

    if (response?.success && response.data) {
      const normalized = normalizeComplaint(response.data);
      setComplaints((prev) => prev.map((c) => (c.id === id ? normalized : c)));
      if (currentComplaint?.id === id) {
        setCurrentComplaint(normalized);
      }
      return normalized;
    }
    return null;
  }, [api, currentComplaint?.id]);

// Assign complaint to staff
   const assignComplaint = useCallback(async (id: string) => {
     const response = await api.put<Complaint>(`/complaints/${id}/assign`, {}, {
      showToast: true,
    });

    if (response?.success && response.data) {
      const normalized = normalizeComplaint(response.data);
      setComplaints((prev) => prev.map((c) => (c.id === id ? normalized : c)));
      if (currentComplaint?.id === id) {
        setCurrentComplaint(normalized);
      }
      return normalized;
    }
    return null;
  }, [api, currentComplaint?.id]);

// Add message to complaint
const addComplaintMessage = useCallback(async (
       complaintId: string,
       data: {
         content: string;
         subject?: string;
         attachments?: Array<{ 
           name: string; 
           type: "pdf" | "image" | "excel" | "word" | "document"; 
           url?: string; 
           storageKey?: string; 
           size?: number;
           s3_url?: string;
           id?: string;
         }>;
       }
     ) => {
      const response = await api.post<ComplaintMessage>(`/complaints/${complaintId}/messages`, data, {
        showToast: true,
      });

if (response?.success && response.data) {
         const normalizedMessage: ComplaintMessage = {
           ...response.data,
           isSent: true,
           attachments: Array.isArray(response.data.attachments)
             ? response.data.attachments.map((att: any) => {
                 const fileType = att.type ?? att.file_type ?? 'document';
                 const validType = fileType === 'pdf' || fileType === 'image' || fileType === 'excel' || fileType === 'word' ? fileType : 'document';
                 return {
                   id: toStringValue(att.id, ''),
                   name: toStringValue(att.name ?? att.file_name, 'Attachment'),
                   type: validType,
                   url: toStringValue(att.url ?? att.file_path, '') || null,
                   storageKey: toStringValue(att.storageKey ?? att.storage_key, '') || undefined,
                   size: typeof att.size === 'number' ? att.size : (typeof att.file_size === 'number' ? att.file_size : undefined),
                 };
               })
             : [],
         };
        if (currentComplaint?.id === complaintId) {
          setCurrentComplaint((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...(prev.messages || []), normalizedMessage],
            };
          });
        }
        return normalizedMessage;
      }
      return null;
    }, [api, currentComplaint?.id]);

  // Setup realtime subscription for assigned complaints
  const setupRealtimeSubscription = useCallback(async (userId: string) => {
    const wsEndpoint = import.meta.env.VITE_WS_ENDPOINT;
    const realtimeEnabled = import.meta.env.VITE_REALTIME_WS_ENABLED === 'true';

    if (!wsEndpoint || !realtimeEnabled) {
      console.log('[Complaints RT] Realtime not enabled');
      return;
    }

    // Import and initialize WebSocket client
    const { initWebSocketClient, subscribe, getWebSocketClient } = await import('../lib/websocketClient');

    let client = getWebSocketClient();
    if (!client) {
      client = initWebSocketClient({ endpoint: wsEndpoint });
      client.connect().catch(err => console.error('[Complaints RT] Connection failed:', err));
    }

    // Subscribe to staff's assigned complaints channel
    const channel = `complaints:staff:${userId}`;
    realtimeChannelRef.current = subscribe(channel, (data: any) => {
      console.log('[Complaints RT] Received:', data);

      if (data.eventType === 'complaint.assigned') {
        fetchAssignedComplaints();
      } else if (data.eventType === 'complaint.message') {
        if (data.payload?.complaint_id === currentComplaint?.id) {
          setCurrentComplaint((prev) => {
            if (!prev) return prev;
            const newMessage = {
              ...data.payload,
              isSent: data.payload?.sender_type === 'staff',
            };
            return {
              ...prev,
              messages: [...(prev.messages || []), newMessage],
            };
          });
        }
      }
    }, wsEndpoint);

    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current();
      }
    };
  }, [fetchAssignedComplaints, currentComplaint?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current();
      }
    };
  }, []);

  return {
    complaints,
    currentComplaint,
    loading: api.loading,
    error: api.error,
    fetchAssignedComplaints,
    fetchAllOpenComplaints,
    fetchComplaint,
    updateComplaintStatus,
    assignComplaint,
    addComplaintMessage,
    setupRealtimeSubscription,
    setCurrentComplaint,
  };
};