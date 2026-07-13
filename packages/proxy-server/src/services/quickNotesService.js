/**
 * QuickNotes Service - Campus Resolve
 * Unified single-table architecture for all note content types:
 * - notes (textual content)
 * - files (attachments)
 * - links (URLs)
 * 
 * Uses unified 'quick_items' table with content_type discriminator
 */

function mapFileType(value) {
  if (!value) return 'document';
  if (value.includes('image')) return 'image';
  if (value.includes('pdf')) return 'pdf';
  if (value.includes('excel')) return 'excel';
  if (value.includes('word')) return 'word';
  return value;
}

class QuickNotesService {
  constructor(supabase, getOrCreateProfile) {
    this.client = supabase;
    this._getOrCreateProfile = getOrCreateProfile;
    this.TABLE = 'quick_items'; // Unified single table
  }

  /**
   * Map content type specific fields for database insertion
   */
  _mapContentFields(content_type, fields) {
    switch (content_type) {
      case 'file':
        return {
          file_name: fields.file_name,
          file_type: fields.file_type,
          file_size: fields.file_size,
          mime_type: fields.mime_type,
          storage_key: fields.storage_key || fields.storageKey, // Handle both camelCase and snake_case
          s3_url: fields.s3_url
        };
      case 'link':
        return {
          link_url: fields.link_url,
          link_label: fields.link_label
        };
case 'note':
      default:
        // Include link fields for notes that have embedded links (backward compatible)
        // Also support multiple links via links JSONB column
        return {
          link_url: fields.link_url || null,
          link_label: fields.link_label || null,
          links: fields.links || null
        };
    }
  }

  /**
   * Normalize database row to unified item format
   */
  _normalizeItem(row) {
    const base = {
      id: row.id,
      content_type: row.content_type,
      title: row.title,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      is_pinned: row.is_pinned || false
    };

    // Add type-specific fields
    switch (row.content_type) {
      case 'file':
        return {
          ...base,
          type: 'file',
          name: row.file_name,
          file_name: row.file_name,
          file_type: row.file_type,
          file_size: row.file_size,
          mime_type: row.mime_type,
          storage_key: row.storage_key,
          s3_url: row.s3_url
        };
      case 'link':
        return {
          ...base,
          type: 'link',
          link_url: row.link_url,
          link_label: row.link_label
        };
case 'note':
      default:
        return {
          ...base,
          type: 'note',
          subject: row.title || row.subject || '',
          description: row.description || '',
          link_url: row.link_url || null,
          link_label: row.link_label || null,
          links: row.links || null
        };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CREATE - Add new item (note, file, or link)
  // ═══════════════════════════════════════════════════════════════════════════════

  async createItem(authUser, payload) {
    console.log('[QuickNotes] createItem called with payload:', JSON.stringify(payload, null, 2));
    
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');
    const { content_type, title, description, link_url, link_label } = payload;
    
    console.log('[QuickNotes] Extracted - content_type:', content_type, 'title:', title, 'link_url:', link_url, 'link_label:', link_label);
    
    const mappedFields = this._mapContentFields(content_type, payload);
    console.log('[QuickNotes] Mapped fields:', JSON.stringify(mappedFields, null, 2));
    
    const insertData = {
      created_by: profile.id,
      content_type, // 'note', 'file', or 'link'
      title,
      description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...mappedFields
    };
    
    console.log('[QuickNotes] Full insertData:', JSON.stringify(insertData, null, 2));
    
    const { data, error } = await this.client
      .from(this.TABLE)
      .insert(insertData)
      .select('*')
      .single();
    
    if (error) {
      console.error('[QuickNotes] Insert error:', error.message);
      throw error;
    }
    console.log('[QuickNotes] Insert success, data:', JSON.stringify(data, null, 2));
    return this._normalizeItem(data);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // READ - Get all items or single item
  // ═══════════════════════════════════════════════════════════════════════════════

  async listItems(authUser, { search, content_type } = {}) {
    console.log('[QuickNotes] listItems called for user:', authUser?.id);
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');
    console.log('[QuickNotes] Profile found:', profile?.id);
    
    let query = this.client
      .from(this.TABLE)
      .select('*')
      .eq('created_by', profile.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (content_type && content_type !== 'all') {
      query = query.eq('content_type', content_type);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('[QuickNotes] listItems error:', error.message);
      throw error;
    }
    
    console.log('[QuickNotes] listItems returned:', data?.length || 0, 'items');
    return (data || []).map(row => this._normalizeItem(row));
  }

  async getItem(authUser, itemId) {
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');
    
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('id', itemId)
      .eq('created_by', profile.id)
      .eq('is_deleted', false)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Item not found');
    
    return this._normalizeItem(data);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UPDATE - Modify existing item
  // ═══════════════════════════════════════════════════════════════════════

  async updateItem(authUser, itemId, payload) {
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');
    
    // Get existing item to check content_type
    const existing = await this.getItem(authUser, itemId);
    const content_type = payload.content_type || existing.content_type;
    
    const updateData = {
      title: payload.title,
      description: payload.description,
      updated_at: new Date().toISOString(),
      ...this._mapContentFields(content_type, payload)
    };
    
    const { data, error } = await this.client
      .from(this.TABLE)
      .update(updateData)
      .eq('id', itemId)
      .eq('created_by', profile.id)
      .select('*')
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Item not found');
    
    return this._normalizeItem(data);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DELETE - Soft delete item
  // ═══════════════════════════════════════════════════════════════════════════════

  async deleteItem(authUser, itemId) {
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');
    
    // Try to get existing item to check if it's a file with storage_key
    // Fetch without is_deleted filter to handle previously failed deletions
    let storage_key = null;
    let content_type = null;
    try {
      const { data: itemData, error: fetchError } = await this.client
        .from(this.TABLE)
        .select('storage_key, content_type')
        .eq('id', itemId)
        .eq('created_by', profile.id)
        .maybeSingle();
      
      if (fetchError) {
        console.error('[QuickNotes] Error fetching item for deletion:', fetchError.message);
      } else if (itemData) {
        console.log('[QuickNotes] Deletion check - content_type:', itemData.content_type, 'storage_key:', itemData.storage_key);
        if (itemData.content_type === 'file' && itemData.storage_key) {
          storage_key = itemData.storage_key;
          content_type = itemData.content_type;
        }
      }
    } catch (getError) {
      console.error('[QuickNotes] Could not fetch item for S3 cleanup:', getError.message);
    }
    
    // If we found a storage_key, try to delete the S3 object
    // S3 cleanup is best-effort - continue with DB deletion even if it fails
    if (storage_key) {
      try {
        const s3StorageService = require('./s3StorageService');
        console.log('[QuickNotes] Attempting S3 deletion for key:', storage_key);
        await s3StorageService.deleteObject(storage_key);
        console.log(`[QuickNotes] Deleted S3 object: ${storage_key}`);
      } catch (s3Error) {
        console.error('[QuickNotes] S3 deletion failed:', s3Error.message);
      }
    } else {
      console.log('[QuickNotes] No storage_key found - skipping S3 deletion');
    }
    
    // Perform soft delete in database
    console.log('[QuickNotes] Performing DB soft delete for item:', itemId);
    const { data, error } = await this.client
      .from(this.TABLE)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('created_by', profile.id)
      .select('id')
      .maybeSingle();
    
    if (error) {
      console.error('[QuickNotes] DB deletion error:', error.message);
      throw error;
    }
    if (!data) {
      console.error('[QuickNotes] DB deletion - item not found:', itemId);
      throw new Error('Item not found');
    }
    
    console.log('[QuickNotes] DB soft delete completed for item:', itemId);
    return { id: data.id, deleted: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // FILE UPLOAD - Create file record after S3 upload
  // ═══════════════════════════════════════════════════════════════════════════════

  async createFileItem(authUser, payload) {
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');
    
    const insertData = {
      created_by: profile.id,
      content_type: 'file',
      title: payload.title || payload.file_name,
      description: payload.description || null,
      file_name: payload.file_name,
      file_type: mapFileType(payload.file_type || payload.mime_type || 'document'),
      file_size: payload.file_size || 0,
      mime_type: payload.mimeType,
      storage_key: payload.storageKey,
      s3_url: payload.s3Url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await this.client
      .from(this.TABLE)
      .insert(insertData)
      .select('*')
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      type: 'file',
      name: data.file_name,
      fileType: data.file_type,
      size: data.file_size,
      createdAt: data.created_at
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DOWNLOAD - Get file download info
  // ═══════════════════════════════════════════════════════════════════════════════

  async getFileDownload(authUser, itemId) {
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');
    
    console.log('[QuickNotes] getFileDownload called for itemId:', itemId);
    console.log('[QuickNotes] profile.id:', profile.id);
    
    const { data, error } = await this.client
      .from(this.TABLE)
      .select('*')
      .eq('id', itemId)
      .eq('created_by', profile.id)
      .eq('content_type', 'file')
      .maybeSingle();
    
    if (error) {
      console.error('[QuickNotes] getFileDownload error:', error.message);
      throw error;
    }
    if (!data) {
      console.error('[QuickNotes] getFileDownload - file not found');
      throw new Error('File not found');
    }
    
    console.log('[QuickNotes] getFileDownload - found data:', JSON.stringify(data, null, 2));
    
    // Use storage_key for presigned URL if available, otherwise fall back to s3_url
    const urlForDownload = data.storage_key || data.s3_url;
    console.log('[QuickNotes] getFileDownload - urlForDownload:', urlForDownload);
    
    // If we have a storage_key, generate a presigned URL
    let downloadUrl = urlForDownload;
    if (data.storage_key) {
      try {
        const s3StorageService = require('./s3StorageService');
        downloadUrl = await s3StorageService.generateDownloadUrl(data.storage_key);
        console.log('[QuickNotes] getFileDownload - generated presigned URL');
      } catch (s3Error) {
        console.error('[QuickNotes] getFileDownload - S3 URL generation failed:', s3Error.message);
        // Fall back to s3_url
        downloadUrl = data.s3_url;
      }
    }
    
    return {
      fileName: data.file_name,
      fileType: data.file_type,
      downloadUrl: downloadUrl,
      size: data.file_size
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LEGACY METHODS - For backward compatibility
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * @deprecated Use listItems instead
   */
  async listQuickNotes(authUser, options) {
    return this.listItems(authUser, options);
  }

  /**
   * @deprecated Use createItem instead
   */
  async createQuickNote(authUser, payload) {
    return this.createItem(authUser, { ...payload, content_type: 'note' });
  }

  /**
   * @deprecated Use updateItem instead
   */
  async updateQuickNote(authUser, noteId, payload) {
    return this.updateItem(authUser, noteId, { ...payload, content_type: 'note' });
  }

  /**
   * @deprecated Use deleteItem instead
   */
  async deleteQuickNote(authUser, noteId) {
    return this.deleteItem(authUser, noteId);
  }
}

module.exports = QuickNotesService;
