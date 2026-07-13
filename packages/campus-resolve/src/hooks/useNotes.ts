/**
 * useNotes Hook - Campus Resolve
 * Unified CRUD for all note content types:
 * - notes (textual content)
 * - files (attachments)
 * - links (URLs)
 * 
 * Uses unified /api/resolve/items endpoint
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { useApiClient } from './useApiClient';
import { uploadFileToS3 } from '../lib/attachmentUpload';

// In-memory cache for download URLs to prevent redundant API calls
const downloadUrlCache = new Map<string, Promise<string | null>>();

// ═══════════════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export interface Note {
   id: string;
   type: 'note';
   subject: string;
   description: string;
   link_url?: string;
   link_label?: string;
   links?: QuickNoteLink[];
   createdAt: Date;
   updatedAt?: Date;
 }

export interface FileItem {
  id: string;
  type: 'file';
  name: string;
  title?: string;
  fileType: 'pdf' | 'image' | 'excel' | 'word' | 'document';
  size?: number;
  s3_url?: string;
  storage_key?: string;
  thumbnail?: string;
  createdAt: Date;
}

export interface LinkItem {
  id: string;
  type: 'link';
  title: string;
  link_url: string;
  link_label?: string;
  createdAt: Date;
}

export type NoteItem = Note | FileItem | LinkItem;

// Unified item type for API
export interface QuickItem {
  id: string;
  content_type: 'note' | 'file' | 'link';
  title: string;
  description?: string;
  // File fields
  name?: string;
  file_type?: string;
  file_size?: number;
  s3_url?: string;
  // Link fields
  link_url?: string;
  link_label?: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface QuickNoteLink {
  id: string;
  label: string;
  url: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

const toDate = (value: Date | string | undefined): Date => {
  if (value instanceof Date) return value;
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const normalizeFileType = (value: any): 'pdf' | 'image' | 'excel' | 'word' | 'document' => {
  const allowed = ['pdf', 'image', 'excel', 'word', 'document'];
  return allowed.includes(value) ? value : 'document';
};

const normalizeItem = (item: any): NoteItem => {
  const base = {
    id: item.id,
    createdAt: toDate(item.createdAt || item.created_at),
  };

  switch (item.content_type) {
    case 'file': {
      const fileUrl = item.thumbnail || (item.s3_url && item.s3_url.startsWith('http') ? item.s3_url : item.storage_key);
      return {
        ...base,
        type: 'file' as const,
        name: item.name || item.file_name || '',
        title: item.title || undefined,
        fileType: normalizeFileType(item.file_type),
        size: item.file_size,
        s3_url: fileUrl,
        storage_key: item.storage_key,
        thumbnail: fileUrl,
      };
    }
    case 'link':
      return {
        ...base,
        type: 'link' as const,
        title: item.title,
        link_url: item.link_url,
        link_label: item.link_label,
      };
    case 'note':
    default:
      return {
        ...base,
        type: 'note' as const,
        subject: item.title || item.subject || '',
        description: item.description || '',
        link_url: item.link_url || undefined,
        link_label: item.link_label || undefined,
        links: item.links || [],
        updatedAt: item.updatedAt ? toDate(item.updatedAt) : (item.updated_at ? toDate(item.updated_at) : undefined),
      };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// Hook Implementation
// ═══════════════════════════════════════════════════════════════════════════════

export const useNotes = () => {
  const api = useApiClient();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  // Tracks the most recently issued fetchNotes call so a slower, older request
  // (e.g. a previously selected filter tab) can't overwrite state after a newer one resolves.
  const latestFetchIdRef = useRef(0);

  // ═══════════════════════════════════════════════════════════════════════════════
  // READ - Fetch all items
  // ═══════════════════════════════════════════════════════════════════════════════

  const fetchNotes = useCallback(
    async (contentType?: string) => {
      const fetchId = ++latestFetchIdRef.current;
      const endpoint = contentType && contentType !== 'all'
        ? `/items?content_type=${contentType}`
        : '/items';

      console.log('[fetchNotes] Fetching from endpoint:', endpoint);
      const response = await api.get<QuickItem[]>(endpoint, { showToast: false });
      console.log('[fetchNotes] Response:', JSON.stringify(response, null, 2));

      if (response?.success && response.data) {
        console.log('[fetchNotes] Got', response.data.length, 'items');
        
        // For each file item, check if we already have a URL or need to fetch one
        const itemsWithThumbnails = await Promise.all(
          response.data.map(async (item: any) => {
            console.log('[fetchNotes] Processing item:', item.id, 'content_type:', item.content_type, 'file_type:', item.file_type, 's3_url:', item.s3_url);

            // Image files: the stored s3_url is a presigned URL that expires (default 1 hour),
            // so it can never be trusted as a permanent reference. Always regenerate a fresh
            // presigned URL from the durable storage_key so images keep working across sessions.
            if (item.content_type === 'file' && item.file_type === 'image') {
              try {
                console.log('[fetchNotes] Fetching fresh download URL for:', item.id);
                // Check cache first to prevent redundant requests
                let downloadUrlPromise = downloadUrlCache.get(item.id);
                if (!downloadUrlPromise) {
                  downloadUrlPromise = (async () => {
                    try {
                      const downloadRes = await api.get(
                        `/items/${item.id}/download`,
                        { showToast: false }
                      ) as any;
                      const url = downloadRes?.data?.downloadUrl || downloadRes?.downloadUrl;
                      console.log('[fetchNotes] Got downloadUrl:', url);
                      return url || null;
                    } catch (e) {
                      console.warn('[fetchNotes] Failed to get thumbnail for item:', item.id, e);
                      return null;
                    } finally {
                      // Remove from cache after resolution to avoid memory leaks
                      setTimeout(() => downloadUrlCache.delete(item.id), 30000);
                    }
                  })();
                  downloadUrlCache.set(item.id, downloadUrlPromise);
                }
                const downloadUrl = await downloadUrlPromise;
                return { ...item, thumbnail: downloadUrl || item.s3_url };
              } catch (e) {
                console.warn('[fetchNotes] Failed to get thumbnail for item:', item.id, e);
              }
            }

            // Non-image files: any complete URL is fine since they're opened on-demand
            // via a fresh download request rather than rendered as a persistent <img> src.
            if (item.s3_url && item.s3_url.startsWith('http')) {
              return { ...item, thumbnail: item.s3_url };
            }
            return item;
          })
        );
        
        const normalized = itemsWithThumbnails.map(normalizeItem);
        console.log('[fetchNotes] Normalized items:', normalized.length);
        // Only apply this result if no newer fetchNotes call has been issued since -
        // prevents a slower, stale request (e.g. a previously selected filter tab) from
        // overwriting the result of a request made after it.
        if (fetchId === latestFetchIdRef.current) {
          setNotes(normalized);
        }
        return normalized;
      }
      return [];
    },
    [api]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // CREATE - Add new item
  // ═══════════════════════════════════════════════════════════════════════════════

/**
   * Create a new textual note
   */
  const createNote = useCallback(
    async (subject: string, description: string, links: QuickNoteLink[] = []) => {
      const noteTitle = subject.trim() || (links.length > 0 ? links[0].url : 'Untitled Note');

      const linkData = links.length > 0 ? {
        link_url: links[0].url,
        link_label: links[0].label,
        links: links
      } : {
        link_url: undefined,
        link_label: undefined,
        links: []
      };

      const response = await api.post<QuickItem>(
        '/items',
        {
          content_type: 'note',
          title: noteTitle,
          description,
          ...linkData
        },
        { showToast: true }
      );

      if (response?.success && response.data) {
        const normalized = normalizeItem(response.data);
        setNotes(prev => [normalized, ...prev]);
        return normalized as Note;
      }
      return null;
    },
    [api]
  );

  /**
   * Create a new link/bookmark
   */
  const createLink = useCallback(
    async (title: string, linkUrl: string, linkLabel?: string) => {
      const normalizedUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://')
        ? linkUrl
        : `https://${linkUrl}`;

      const response = await api.post<QuickItem>(
        '/items',
        {
          content_type: 'link',
          title: title || normalizedUrl,
          link_url: normalizedUrl,
          link_label: linkLabel || title || normalizedUrl,
        },
        { showToast: true }
      );

      if (response?.success && response.data) {
        const normalized = normalizeItem(response.data);
        setNotes(prev => [normalized, ...prev]);
        return normalized as LinkItem;
      }
      return null;
    },
    [api]
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // UPDATE - Modify existing item
  // ═��═════════════════════════════════════════════════════════════════════

const updateNote = useCallback(
    async (
      itemId: string,
      title: string,
      description: string,
      links: QuickNoteLink[] = []
    ) => {
      // Prepare link data - support both legacy single link and multiple links
      const linkData = links.length > 0 ? {
        link_url: links[0].url,
        link_label: links[0].label,
        links: links
      } : {
        link_url: null,
        link_label: null,
        links: []
      };

      const response = await api.put<QuickItem>(
        `/items/${itemId}`,
        {
          content_type: 'note',
          title,
          description,
          ...linkData
        },
        { showToast: true }
      );

      if (response?.success && response.data) {
        const normalized = normalizeItem(response.data);
        setNotes(prev =>
          prev.map(item => (item.id === itemId ? normalized : item))
        );
        return normalized as Note;
      }
      return null;
    },
    [api]
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // DELETE - Remove item (soft delete)
  // ═══════════════════════════════════════════════════════════════════════════════

  const deleteNote = useCallback(
    async (itemId: string) => {
      const response = await api.delete(
        `/items/${itemId}`,
        { showToast: true }
      );

      if (response?.success) {
        setNotes(prev => prev.filter(item => item.id !== itemId));
        return true;
      }
      return false;
    },
    [api]
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // FILE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Upload file to S3 and create database record
   */
  const uploadFile = useCallback(
    async (file: File, itemId?: string, title?: string) => {
      try {
        const targetItemId = itemId || 'general';
        
        // Upload to S3
        const result = await uploadFileToS3(file, 'note', targetItemId, {
          onProgress: (progress) => {
            console.log(`Upload progress: ${progress}%`);
          },
          title,
        });

        if (result.attachment) {
          // Use the complete S3 URL if available, otherwise fall back to the key
          const urlForStorage = result.s3Url || result.key;
          
          // Create database record via API
          const response = await api.post<QuickItem>(
            '/items',
            {
              content_type: 'file',
              title: title || result.fileName,
              file_name: result.fileName,
              file_type: result.fileType,
              file_size: result.fileSize,
              storageKey: result.key,
              s3_url: urlForStorage, // Store the complete URL for persistence
            },
            { showToast: true }
          );

if (response?.success && response.data) {
             // Fetch preview URL for images
             let thumbnail: string | undefined = undefined;
             console.log('[useNotes] Checking if image, fileType:', result.fileType);
             if (result.fileType === 'image') {
               try {
                 console.log('[useNotes] Fetching download URL for item:', response.data.id);
                 // Check cache first
                 let downloadUrlPromise = downloadUrlCache.get(response.data.id);
                 if (!downloadUrlPromise) {
                   downloadUrlPromise = (async () => {
                     try {
                       const downloadRes = await api.get(
                         `/items/${response.data.id}/download`,
                         { showToast: false }
                       ) as any;
                       const url = downloadRes?.data?.downloadUrl || downloadRes?.downloadUrl;
                       console.log('[useNotes] Download URL raw response:', JSON.stringify(downloadRes));
                       console.log('[useNotes] Extracted downloadUrl:', url);
                       if (!url) {
                         console.warn('[useNotes] WARNING: No download URL returned, trying s3_url as fallback');
                       }
                       return url || result.s3Url || null;
                     } catch (e) {
                       console.error('[useNotes] Failed to get preview URL:', e);
                       return null;
                     } finally {
                       setTimeout(() => downloadUrlCache.delete(response.data.id), 30000);
                     }
                   })();
                   downloadUrlCache.set(response.data.id, downloadUrlPromise);
                 }
                 const downloadUrl = await downloadUrlPromise;
                 if (downloadUrl) {
                   thumbnail = downloadUrl;
                   console.log('[useNotes] Got thumbnail URL:', thumbnail);
                 }
               } catch (e) {
                 console.error('[useNotes] Failed to get preview URL:', e);
               }
             }

            // Use the complete S3 URL if available for thumbnail, otherwise use the fetched download URL
            const thumbnailUrl = result.s3Url || thumbnail;
            
            const normalized = normalizeItem({
              ...response.data,
              name: result.fileName,
              fileType: result.fileType,
              size: result.fileSize,
              s3_url: thumbnailUrl || result.key,
              thumbnail: thumbnailUrl || result.key,
            });
            console.log('[useNotes] Normalized file item:', JSON.stringify(normalized));
            setNotes(prev => [normalized, ...prev]);
            return normalized as FileItem;
          }
        }
        return null;
      } catch (error) {
        console.error('Upload error:', error);
        return null;
      }
    },
    [api]
  );

  /**
   * Download file from S3
   */
  const downloadFile = useCallback(
    async (itemId: string) => {
      const response = await api.get(
        `/items/${itemId}/download`,
        { showToast: false }
      );

      // Handle both { downloadUrl } and { data: { downloadUrl } } response formats
      if (response?.success) {
        const downloadUrl = response.data?.downloadUrl || response.downloadUrl;
        if (downloadUrl) {
          return { downloadUrl };
        }
      }
      return null;
    },
    [api]
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  // Return API
  // ═══════════════════════════════════════════════════════════════════════

  return useMemo(
    () => ({
      // State
      notes,
      loading: api.loading,
      error: api.error,

      // Methods
      fetchNotes,
      createNote,
      createLink,
      updateNote,
      deleteNote,
      uploadFile,
      downloadFile,
    }),
    [
      notes,
      api.loading,
      api.error,
      fetchNotes,
      createNote,
      createLink,
      updateNote,
      deleteNote,
      uploadFile,
      downloadFile,
    ]
  );
};
