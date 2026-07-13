/**
 * useComplaints Hook - Campus Voice
 * Handles all complaint API operations
 */

import { useState, useCallback } from 'react';
import { useApiClient } from './useApiClient';

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
  messages?: Message[];
  professor?: string;
  level?: string;
  fullText?: string;
  date?: string;
  time?: string;
  attachments?: Attachment[];
  responses?: ComplaintResponse[];
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name?: string;
  subject?: string;
  message_type?: string;
  attachments?: Attachment[];
}

export interface Attachment {
   id: string;
   file_name?: string;
   file_size?: number;
   file_type?: string;
   created_at?: string;
   name?: string;
   size?: number;
   type?: string;
   url?: string | null;
   storage_key?: string;
 }

export interface ComplaintResponse {
  sender: string;
  text: string;
  content: string;
  attachments: Attachment[];
  time: string;
  date: string;
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

const normalizeAttachment = (attachment: unknown): Attachment => {
   const item = asRecord(attachment);
   const normalizedName = toStringValue(
     item.name ?? item.file_name,
     'Attachment'
   );
   const normalizedType = toStringValue(
     item.type ?? item.file_type,
     'document'
   );
   const normalizedSize = Number(item.size ?? item.file_size ?? 0) || undefined;

   return {
     id: toStringValue(item.id, ''),
     file_name: normalizedName,
     file_size: normalizedSize,
     file_type: normalizedType,
     created_at: toStringValue(
       item.created_at,
       new Date().toISOString()
     ) || undefined,
     name: normalizedName,
     size: normalizedSize,
     type: normalizedType,
     url: toStringValue(item.url ?? item.file_path, '') || undefined,
     storage_key: toStringValue(item.storage_key ?? item.storageKey, '') || undefined,
   };
 };

const normalizeMessage = (message: unknown): Message => {
  const item = asRecord(message);
  return {
    id: toStringValue(item.id, ''),
    content: toStringValue(item.content, ''),
    sender_id: toStringValue(item.sender_id, ''),
    created_at: toStringValue(item.created_at, new Date().toISOString()),
    sender_name: item.sender_name ? toStringValue(item.sender_name) : undefined,
    subject: item.subject ? toStringValue(item.subject) : undefined,
    message_type: item.message_type ? toStringValue(item.message_type) : undefined,
    attachments: Array.isArray(item.attachments)
      ? item.attachments.map(normalizeAttachment)
      : [],
  };
};

const normalizeResponse = (response: unknown): ComplaintResponse => {
  const item = asRecord(response);
  return {
    sender: toStringValue(item.sender, 'staff'),
    text: toStringValue(item.text, ''),
    content: toStringValue(item.content, ''),
    attachments: Array.isArray(item.attachments)
      ? item.attachments.map(normalizeAttachment)
      : [],
    time: toStringValue(item.time, ''),
    date: toStringValue(item.date, ''),
  };
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
      ? item.messages.map(normalizeMessage)
      : [],
    professor: item.professor ? toStringValue(item.professor) : undefined,
    level: item.level ? toStringValue(item.level) : undefined,
    fullText: item.fullText ? toStringValue(item.fullText) : undefined,
    date: item.date ? toStringValue(item.date) : undefined,
    time: item.time ? toStringValue(item.time) : undefined,
    attachments: Array.isArray(item.attachments)
      ? item.attachments.map(normalizeAttachment)
      : [],
    responses: Array.isArray(item.responses)
      ? item.responses.map(normalizeResponse)
      : [],
  };
};

const normalizeComplaintType = (item: unknown): ComplaintType => {
  const record = asRecord(item);
  return {
    id: toStringValue(record.id, ''),
    key: toStringValue(record.key, ''),
    label: toStringValue(record.label, ''),
    description: toStringValue(record.description, ''),
    isActive: record.isActive !== false,
  };
};

export const useComplaints = () => {
  const api = useApiClient();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [currentComplaint, setCurrentComplaint] = useState<Complaint | null>(null);
  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([]);

  const fetchComplaintTypes = useCallback(async () => {
    const response = await api.get<ComplaintType[]>('/complaint-types');

    if (response?.success && response.data) {
      const normalized = response.data.map(normalizeComplaintType);
      setComplaintTypes(normalized);
      return normalized;
    }

    return [];
  }, [api]);

  // Get all complaints
  const fetchComplaints = useCallback(
    async (filters?: {
      status?: string;
      category?: string;
      from_date?: string;
      to_date?: string;
      limit?: number;
      offset?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const endpoint = `/complaints${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await api.get<Complaint[]>(endpoint);

      if (response?.success && response.data) {
        const normalized = response.data.map(normalizeComplaint);
        setComplaints(normalized);
        return normalized;
      }
      return null;
    },
    [api]
  );

  // Get single complaint
  const fetchComplaint = useCallback(
    async (id: string) => {
      const response = await api.get<Complaint>(`/complaints/${id}`);

      if (response?.success && response.data) {
        const normalized = normalizeComplaint(response.data);
        setCurrentComplaint(normalized);
        return normalized;
      }
      return null;
    },
    [api]
  );

  // Create complaint
  const createComplaint = useCallback(
    async (data: {
      title: string;
      description: string;
      category: string;
      attachments?: Array<{
        name: string;
        fileType?: string;
        mimeType?: string;
        sizeBytes?: number;
        size?: number;
        url?: string;
        storageKey?: string;
      }>;
    }) => {
      const response = await api.post<Complaint>('/complaints', data, {
        showToast: true,
      });

      if (response?.success && response.data) {
        const normalized = normalizeComplaint(response.data);
        setComplaints((prev) => [normalized, ...prev]);
        return normalized;
      }
      return null;
    },
    [api]
  );

  // Update complaint status
  const updateComplaintStatus = useCallback(
    async (id: string, status: string) => {
      const response = await api.put<Complaint>(`/complaints/${id}`, { status }, {
        showToast: true,
      });

      if (response?.success && response.data) {
        const normalized = normalizeComplaint(response.data);
        setComplaints((prev) =>
          prev.map((c) => (c.id === id ? normalized : c))
        );
        if (currentComplaint?.id === id) {
          setCurrentComplaint(normalized);
        }
        return normalized;
      }
      return null;
    },
    [api, currentComplaint?.id]
  );

  // Search complaints
  const searchComplaints = useCallback(
    async (query: string) => {
      const response = await api.get<Complaint[]>(`/complaints/search?query=${encodeURIComponent(query)}`);

      if (response?.success && response.data) {
        return response.data.map(normalizeComplaint);
      }
      return null;
    },
    [api]
  );

  // Get complaints by category
  const getByCategory = useCallback(
    async (category: string) => {
      const response = await api.get<Complaint[]>(`/complaints/category/${category}`);

      if (response?.success && response.data) {
        return response.data.map(normalizeComplaint);
      }
      return null;
    },
    [api]
  );

  // Get complaint statistics
  const getStats = useCallback(
    async () => {
      const response = await api.get<{
        total: number;
        open: number;
        in_progress: number;
        resolved: number;
        closed: number;
      }>('/complaints/stats');

      if (response?.success && response.data) {
        return response.data;
      }
      return null;
    },
    [api]
  );

  return {
    // State
    complaints,
    currentComplaint,
    complaintTypes,
    loading: api.loading,
    error: api.error,

    // Methods
    fetchComplaintTypes,
    fetchComplaints,
    fetchComplaint,
    createComplaint,
    updateComplaintStatus,
    searchComplaints,
    getByCategory,
    getStats,
  };
};
