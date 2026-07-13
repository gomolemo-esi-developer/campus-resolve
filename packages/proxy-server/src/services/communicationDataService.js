const { createClient } = require('@supabase/supabase-js');
const { isEnabled } = require('./featureFlagService');
const { publishEvent } = require('./eventPublisherService');
const ComplaintTypesService = require('./complaintTypesService');
const ParticipantsService = require('./participantsService');
const ResolveConversationsService = require('./resolveConversationsService');
const QuickNotesService = require('./quickNotesService');

const STATUS_VALUES = ['open', 'in_progress', 'escalated', 'resolved', 'closed'];

function formatDate(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function mapAttachmentType(value) {
  if (!value) return 'document';
  if (value.includes('image')) return 'image';
  if (value.includes('pdf')) return 'pdf';
  if (value.includes('excel')) return 'excel';
  if (value.includes('word')) return 'word';
  return value;
}

function parseAttachmentSize(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

class CommunicationDataService {
  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY;

    this.enabled = Boolean(supabaseUrl && supabaseKey);

    if (!this.enabled) {
      this.client = null;
      return;
    }

    this.client = createClient(supabaseUrl, supabaseKey);

    // Initialize modular sub-services
    this._complaintTypesService = new ComplaintTypesService(this.client);
    this._participantsService = new ParticipantsService(this.client);
    this._resolveConversationsService = new ResolveConversationsService(this.client, this);
    this._quickNotesService = new QuickNotesService(
      this.client,
      (authUser, defaultRole) => this._getOrCreateProfile(authUser, defaultRole)
    );
  }

  isEnabled() {
    return this.enabled && Boolean(this.client);
  }

  _ensureEnabled() {
    if (!this.isEnabled()) {
      throw new Error('Supabase communication service is not enabled');
    }
  }

  async _getOrCreateProfile(authUser, defaultRole = 'student') {
    this._ensureEnabled();

    const cognitoSub = authUser.id;

    let { data: profile, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('cognito_sub', cognitoSub)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (profile) return profile;

    const payload = {
      cognito_sub: cognitoSub,
      role: authUser.role || defaultRole,
      email: authUser.email || `${cognitoSub}@local.campus`,
      first_name: authUser.firstName || null,
      last_name: authUser.lastName || null,
    };

    const { data: created, error: createError } = await this.client
      .from('profiles')
      .insert(payload)
      .select('*')
      .single();

    if (createError) {
      throw createError;
    }

    return created;
  }

  /**
   * Populate a new `profiles` row at signup-claim time from a matched
   * admin-created students/staff record, instead of relying on
   * _getOrCreateProfile's blank auto-insert on first authenticated request.
   */
  async createProfileFromClaim({ cognitoSub, role, email, portal, record }) {
    this._ensureEnabled();

    const base = {
      cognito_sub: cognitoSub,
      role,
      email: record.email || email,
      first_name: record.first_name || null,
      last_name: record.last_name || null,
      id_number: record.id_number || null,
      title: record.title || null,
      initials: record.initials || null,
      campus: record.campus || null,
      course: record.course || null,
      faculty: record.faculty || null,
      residence: record.residence || null,
      extracurricular: record.extracurricular || null,
      phone: record.phone || null,
    };

    const payload =
      portal === 'voice'
        ? {
            ...base,
            student_number: record.student_id || null,
            department: record.department || null,
            modules: record.modules || null,
          }
        : {
            ...base,
            staff_number: record.staff_id || null,
            location: record.location || null,
            office_location: record.office_location || null,
            department_nonacademic: record.department_nonacademic || null,
            professional_entries: record.professional_entries || null,
          };

    const { data, error } = await this.client
      .from('profiles')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  async getComplaintTypes() {
    this._ensureEnabled();
    return this._complaintTypesService.getComplaintTypes();
  }

_normalizeAttachmentPayload(attachment = {}) {
    const mimeType = attachment.mimeType || attachment.mime_type || null;
    const fileTypeRaw =
      attachment.fileType || attachment.file_type || attachment.type || mimeType || 'document';
    const fileType = String(fileTypeRaw).toLowerCase();

    const storageKey = attachment.storageKey || attachment.storage_key || null;
    
    // Determine URL - prefer s3_url but fall back to storage_key for valid S3 paths
    let url = null;
    if (attachment.s3_url && !attachment.s3_url.includes('?')) {
      // Only use s3_url if it's not a presigned URL (no query params)
      url = attachment.s3_url;
    } else if (storageKey && (storageKey.startsWith('attachments/') || storageKey.startsWith('mock/'))) {
      // Use storage_key if it's a valid S3 key path
      url = storageKey;
    } else if (attachment.url && !attachment.url.startsWith('blob:') && !attachment.url.startsWith('data:')) {
      url = attachment.url;
    } else if (attachment.file_path && !attachment.file_path.startsWith('blob:') && !attachment.file_path.startsWith('data:')) {
      url = attachment.file_path;
    }

    return {
      file_name: attachment.name || attachment.file_name || 'attachment',
      file_path: url,
      file_size: parseAttachmentSize(
        attachment.sizeBytes ?? attachment.file_size ?? attachment.size
      ),
      file_type: fileType,
      mime_type: mimeType,
      storage_key: storageKey,
      created_at: new Date().toISOString(),
    };
  }

async _insertMessageAttachments(messageId, attachments = []) {
    if (!Array.isArray(attachments) || attachments.length === 0) {
      return [];
    }

    const rows = attachments.map((attachment) => {
      const normalized = this._normalizeAttachmentPayload(attachment);
      console.log('[ATTACHMENTS] Normalized attachment:', JSON.stringify({ ...normalized, complaint_message_id: messageId }));
      return {
        ...normalized,
        complaint_message_id: messageId,
      };
    });

    const { data, error } = await this.client
      .from('attachments')
      .insert(rows)
      .select('*');

    if (error) {
      console.error('[ATTACHMENTS] Insert error:', error.message, error.details, error.hint);
      throw error;
    }

    return (data || []).map((att) => ({
        id: att.id,
        name: att.file_name,
        size: att.file_size,
        type: mapAttachmentType(att.file_type || att.mime_type || 'document'),
        url: att.file_path || null,
        storageKey: att.storage_key || null,
      }));
  }

  _mapComplaintRow(row, profileSub) {
    return {
      id: row.id,
      filed_by: profileSub,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.status,
      current_level: row.current_level,
      priority: row.priority || 'normal',
      assigned_to: row.assigned_to || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async createComplaint(authUser, payload) {
    const profile = await this._getOrCreateProfile(authUser, 'student');

    let complaintTypeId = null;
    if (payload.category) {
      const { data: complaintType } = await this.client
        .from('complaint_types')
        .select('id')
        .eq('key', payload.category)
        .maybeSingle();
      complaintTypeId = complaintType?.id || null;
    }

    const complaintInsert = {
      filed_by: profile.id,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      complaint_type_id: complaintTypeId,
      status: 'open',
      current_level: 1,
      priority: payload.priority || 'normal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: complaint, error } = await this.client
      .from('complaints')
      .insert(complaintInsert)
      .select('*')
      .single();

    if (error) throw error;

    const { data: initialMessage, error: messageError } = await this.client
      .from('complaint_messages')
      .insert({
        complaint_id: complaint.id,
        sender_id: profile.id,
        subject: payload.title,
        content: payload.description,
        message_type: 'initial',
        is_internal: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (messageError) throw messageError;

    if (Array.isArray(payload.attachments) && payload.attachments.length > 0) {
      await this._insertMessageAttachments(initialMessage.id, payload.attachments);
    }

    await this._participantsService.upsertParticipant(
      complaint.id,
      profile.id,
      profile.role || 'student'
    );

    // Publish event for realtime notification
    publishEvent(`complaint:${complaint.id}`, 'complaint.created', {
      complaintId: complaint.id,
      title: complaint.title,
      category: complaint.category,
      filedBy: profile.cognito_sub,
    });

    return this._mapComplaintRow(complaint, profile.cognito_sub);
  }

  async listComplaints(authUser, filters = {}) {
    const profile = await this._getOrCreateProfile(authUser, 'student');

    let query = this.client
      .from('complaints')
      .select('*')
      .eq('filed_by', profile.id)
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.from_date) query = query.gte('created_at', filters.from_date);
    if (filters.to_date) query = query.lte('created_at', filters.to_date);

    const limit = Number(filters.limit || 50);
    const offset = Number(filters.offset || 0);
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row) => this._mapComplaintRow(row, profile.cognito_sub));
  }

  async getComplaintById(authUser, complaintId) {
    const profile = await this._getOrCreateProfile(authUser, 'student');

    const { data: complaint, error } = await this.client
      .from('complaints')
      .select('*')
      .eq('id', complaintId)
      .maybeSingle();

    if (error) throw error;
    if (!complaint) throw new Error('Complaint not found');

    const { data: participant } = await this.client
      .from('complaint_participants')
      .select('id')
      .eq('complaint_id', complaintId)
      .eq('profile_id', profile.id)
      .maybeSingle();

    const isOwner = complaint.filed_by === profile.id;
    if (!isOwner && !participant) {
      throw new Error('Unauthorized to view this complaint');
    }

    const { data: messages, error: messagesError } = await this.client
      .from('complaint_messages')
      .select('*, profiles:sender_id(cognito_sub, first_name, last_name, role)')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    const messageIds = (messages || []).map((m) => m.id);
    let attachmentMap = new Map();
    if (messageIds.length > 0) {
      const { data: atts } = await this.client
        .from('attachments')
        .select('*')
        .in('complaint_message_id', messageIds);

attachmentMap = new Map();
       (atts || []).forEach((att) => {
         const existing = attachmentMap.get(att.complaint_message_id) || [];
         existing.push({
           id: att.id,
           name: att.file_name,
           size: att.file_size,
           type: mapAttachmentType(att.file_type || att.mime_type || 'document'),
           url: att.file_path || null,
           storageKey: att.storage_key || null,
         });
         attachmentMap.set(att.complaint_message_id, existing);
       });
    }

    const mappedMessages = (messages || []).map((m) => {
      const senderName = `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.trim();
      return {
        id: m.id,
        complaint_id: m.complaint_id,
        sender_id: m.profiles?.cognito_sub || m.sender_id,
        sender_name: senderName || 'Unknown Sender',
        content: m.content,
        subject: m.subject || undefined,
        message_type: m.message_type,
        created_at: m.created_at,
        attachments: attachmentMap.get(m.id) || [],
      };
    });

    const initialMessage = mappedMessages.find((m) => m.message_type === 'initial');
    const responses = mappedMessages
      .filter((m) => m.message_type !== 'initial')
      .map((m) => ({
        sender: m.sender_id === profile.cognito_sub ? 'user' : 'staff',
        text: m.subject || '',
        content: m.content,
        attachments: m.attachments || [],
        time: formatTime(m.created_at),
        date: formatDate(m.created_at),
      }));

    return {
      ...this._mapComplaintRow(complaint, profile.cognito_sub),
      professor: mappedMessages.find((m) => m.sender_id !== profile.cognito_sub)?.sender_name || '',
      level: String(complaint.current_level || 1),
      fullText: initialMessage?.content || complaint.description,
      date: formatDate(complaint.created_at),
      time: formatTime(complaint.created_at),
      attachments: initialMessage?.attachments || [],
      responses,
      messages: mappedMessages,
    };
  }

  async updateComplaintStatus(authUser, complaintId, status) {
    if (!STATUS_VALUES.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const profile = await this._getOrCreateProfile(authUser, 'student');

    const { data: complaint, error: findError } = await this.client
      .from('complaints')
      .select('*')
      .eq('id', complaintId)
      .maybeSingle();
    if (findError) throw findError;
    if (!complaint) throw new Error('Complaint not found');

    const { data: participant } = await this.client
      .from('complaint_participants')
      .select('id')
      .eq('complaint_id', complaintId)
      .eq('profile_id', profile.id)
      .maybeSingle();

    const canUpdate = complaint.filed_by === profile.id || complaint.assigned_to === profile.id || Boolean(participant);
    if (!canUpdate) throw new Error('Unauthorized to update this complaint');

    const { data, error } = await this.client
      .from('complaints')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', complaintId)
      .select('*')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      status: data.status,
      updated_at: data.updated_at,
    };
  }

  async getComplaintStats(authUser) {
    const profile = await this._getOrCreateProfile(authUser, 'student');

    const { data, error } = await this.client
      .from('complaints')
      .select('status')
      .eq('filed_by', profile.id);

    if (error) throw error;

    const stats = { total: 0, open: 0, in_progress: 0, escalated: 0, resolved: 0, closed: 0 };
    (data || []).forEach((row) => {
      stats.total += 1;
      if (stats[row.status] !== undefined) {
        stats[row.status] += 1;
      }
    });

    return stats;
  }

  async searchComplaints(authUser, query) {
    const profile = await this._getOrCreateProfile(authUser, 'student');

    const { data, error } = await this.client
      .from('complaints')
      .select('*')
      .eq('filed_by', profile.id)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => this._mapComplaintRow(row, profile.cognito_sub));
  }

  async getComplaintsByCategory(authUser, category) {
    return this.listComplaints(authUser, { category, limit: 100, offset: 0 });
  }

  async addReply(authUser, complaintId, payload) {
    const profile = await this._getOrCreateProfile(authUser, authUser.role || 'student');

    const { data: complaint, error: complaintError } = await this.client
      .from('complaints')
      .select('*')
      .eq('id', complaintId)
      .maybeSingle();

    if (complaintError) throw complaintError;
    if (!complaint) throw new Error('Complaint not found');

    await this._participantsService.upsertParticipant(
      complaintId,
      profile.id,
      profile.role || 'student'
    );

    const messageType = profile.role && profile.role.includes('admin') ? 'staff' : profile.role === 'staff' ? 'staff' : 'student';

    const { data, error } = await this.client
      .from('complaint_messages')
      .insert({
        complaint_id: complaintId,
        sender_id: profile.id,
        subject: payload.subject || null,
        content: payload.content,
        message_type: messageType,
        is_internal: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;

const attachments = await this._insertMessageAttachments(data.id, payload.attachments || []);

     // Publish event for realtime notification
     publishEvent(`complaint:${complaintId}`, 'complaint.message', {
       complaint_id: complaintId,
       sender_type: 'staff',
       content: data.content,
       sender_id: profile.cognito_sub,
       created_at: data.created_at,
     });

     return {
      id: data.id,
      complaint_id: data.complaint_id,
      sender_id: profile.cognito_sub,
      sender_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || authUser.email || 'Unknown Sender',
      content: data.content,
      subject: data.subject || undefined,
      message_type: data.message_type,
      created_at: data.created_at,
      attachments,
    };
  }

  async getThread(authUser, complaintId) {
    const complaint = await this.getComplaintById(authUser, complaintId);
    return complaint.messages || [];
  }

  async listDirectConversations(authUser) {
    return this._resolveConversationsService.listDirectConversations(authUser);
  }

  async getDirectConversation(authUser, conversationId) {
    return this._resolveConversationsService.getDirectConversation(authUser, conversationId);
  }

  async addDirectMessage(authUser, conversationId, payload) {
    return this._resolveConversationsService.addDirectMessage(authUser, conversationId, payload);
  }

  async listQuickNotes(authUser, opts = {}) {
    return this._quickNotesService.listQuickNotes(authUser, opts);
  }

  async getQuickNote(authUser, noteId) {
    return this._quickNotesService.getQuickNote(authUser, noteId);
  }

  async createQuickNote(authUser, payload) {
    return this._quickNotesService.createQuickNote(authUser, payload);
  }

  async updateQuickNote(authUser, noteId, payload) {
    return this._quickNotesService.updateQuickNote(authUser, noteId, payload);
  }

  async deleteQuickNote(authUser, noteId) {
    return this._quickNotesService.deleteQuickNote(authUser, noteId);
  }

  // ============================================================================
  // UNIFIED ITEM CRUD (Single Table Architecture)
  // ============================================================================

  /**
   * Create a new item (note, file, or link) in the unified quick_items table
   */
  async createItem(authUser, payload) {
    return this._quickNotesService.createItem(authUser, payload);
  }

  /**
   * List all items with optional filtering
   */
  async listItems(authUser, options = {}) {
    return this._quickNotesService.listItems(authUser, options);
  }

  /**
   * Get a single item by ID
   */
  async getItem(authUser, itemId) {
    return this._quickNotesService.getItem(authUser, itemId);
  }

  /**
   * Update an existing item
   */
  async updateItem(authUser, itemId, payload) {
    return this._quickNotesService.updateItem(authUser, itemId, payload);
  }

  /**
   * Delete (soft) an item
   */
  async deleteItem(authUser, itemId) {
    return this._quickNotesService.deleteItem(authUser, itemId);
  }

  // ============================================================================
  // LEGACY METHODS (Backward Compatibility)
  // ============================================================================

  async createQuickNoteAttachment(authUser, payload) {
    return this._quickNotesService.createFileItem(authUser, payload);
  }

  async getQuickNoteDownload(authUser, noteId) {
    return this._quickNotesService.getQuickNoteDownload(authUser, noteId);
  }

  async createComplaintAttachment(authUser, messageId, fileData) {
    this._ensureEnabled();
    const profile = await this._getOrCreateProfile(authUser, 'student');
    const normalized = this._normalizeAttachmentPayload(fileData);
    normalized.complaint_message_id = messageId;

    const { data, error } = await this.client
      .from('attachments')
      .insert(normalized)
      .select('*')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      message_id: messageId,
      file_name: data.file_name,
      file_type: mapAttachmentType(data.file_type || data.mime_type || 'document'),
      file_size: data.file_size,
      storage_key: data.storage_key,
      created_at: data.created_at,
    };
  }

  async getMessageAttachments(authUser, messageId) {
    this._ensureEnabled();
    const { data, error } = await this.client
      .from('attachments')
      .select('*')
      .eq('complaint_message_id', messageId);

    if (error) throw error;

    return (data || []).map((att) => ({
      id: att.id,
      message_id: att.complaint_message_id,
      file_name: att.file_name,
      file_type: mapAttachmentType(att.file_type || att.mime_type || 'document'),
      file_size: att.file_size,
      created_at: att.created_at,
    }));
  }

  async getComplaintAttachments(authUser, complaintId) {
    this._ensureEnabled();
    const profile = await this._getOrCreateProfile(authUser, 'student');

    const { data: messages, error: msgError } = await this.client
      .from('complaint_messages')
      .select('id')
      .eq('complaint_id', complaintId);

    if (msgError) throw msgError;
    const messageIds = (messages || []).map((m) => m.id);
    if (messageIds.length === 0) return [];

    const { data, error } = await this.client
      .from('attachments')
      .select('*')
      .in('complaint_message_id', messageIds);

    if (error) throw error;

    return (data || []).map((att) => ({
      id: att.id,
      complaint_id: complaintId,
      file_name: att.file_name,
      file_type: mapAttachmentType(att.file_type || att.mime_type || 'document'),
      file_size: att.file_size,
      created_at: att.created_at,
    }));
  }

  async getAttachmentById(authUser, attachmentId) {
    this._ensureEnabled();
    const { data, error } = await this.client
      .from('attachments')
      .select('*')
      .eq('id', attachmentId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Attachment not found');

    return {
      id: data.id,
      fileName: data.file_name,
      fileType: mapAttachmentType(data.file_type || data.mime_type || 'document'),
      fileSize: data.file_size,
      storageKey: data.storage_key,
      createdAt: data.created_at,
    };
  }

  async deleteAttachment(authUser, attachmentId) {
    this._ensureEnabled();
    const { error } = await this.client
      .from('attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) throw error;
    return { id: attachmentId };
  }

  // ============================================================================
  // STAFF COMPLAINT METHODS (Campus Resolve)
  // ============================================================================

  /**
   * List complaints assigned to a staff member (or unassigned open complaints)
   */
  async listAssignedComplaints(authUser, filters = {}) {
    this._ensureEnabled();
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');

    let query = this.client
      .from('complaints')
      .select(`*, profiles:filed_by(cognito_sub, first_name, last_name, email)`)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    // Show complaints assigned to this staff member OR unassigned complaints
    query = query.or(`assigned_to.eq.${profile.id},assigned_to.is.null`);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category) query = query.eq('category', filters.category);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.status,
      current_level: String(row.current_level || 1),
      priority: row.priority || 'normal',
      filed_by: row.profiles?.cognito_sub || row.filed_by,
      student_name: `${row.profiles?.first_name || ''} ${row.profiles?.last_name || ''}`.trim() || 'Unknown',
      student_email: row.profiles?.email || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  /**
   * List all open complaints (for escalation/reassignment)
   */
  async listOpenComplaints(filters = {}) {
    this._ensureEnabled();

    let query = this.client
      .from('complaints')
      .select(`*, profiles:filed_by(cognito_sub, first_name, last_name, email)`)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.priority) query = query.eq('priority', filters.priority);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.status,
      current_level: String(row.current_level || 1),
      priority: row.priority || 'normal',
      filed_by: row.profiles?.cognito_sub || row.filed_by,
      student_name: `${row.profiles?.first_name || ''} ${row.profiles?.last_name || ''}`.trim() || 'Unknown',
      student_email: row.profiles?.email || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  /**
   * Get a specific complaint for staff (includes student info)
   */
  async getComplaint(authUser, complaintId) {
    this._ensureEnabled();
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');

    const { data: complaint, error } = await this.client
      .from('complaints')
      .select(`*, profiles:filed_by(cognito_sub, first_name, last_name, email)`)
      .eq('id', complaintId)
      .maybeSingle();

    if (error) throw error;
    if (!complaint) throw new Error('Complaint not found');

    const { data: messages, error: messagesError } = await this.client
      .from('complaint_messages')
      .select('*, profiles:sender_id(cognito_sub, first_name, last_name, role)')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    const messageIds = (messages || []).map((m) => m.id);
    let attachmentMap = new Map();
    if (messageIds.length > 0) {
      const { data: atts } = await this.client
        .from('attachments')
        .select('*')
        .in('complaint_message_id', messageIds);

(atts || []).forEach((att) => {
         const existing = attachmentMap.get(att.complaint_message_id) || [];
         existing.push({
           id: att.id,
           name: att.file_name,
           size: att.file_size,
           type: mapAttachmentType(att.file_type || att.mime_type || 'document'),
           url: att.file_path || null,
           storageKey: att.storage_key || null,
         });
         attachmentMap.set(att.complaint_message_id, existing);
       });
    }

    return {
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      status: complaint.status,
      current_level: String(complaint.current_level || 1),
      priority: complaint.priority || 'normal',
      filed_by: complaint.profiles?.cognito_sub || complaint.filed_by,
      assigned_to: complaint.assigned_to,
      student_name: `${complaint.profiles?.first_name || ''} ${complaint.profiles?.last_name || ''}`.trim() || 'Unknown',
      student_email: complaint.profiles?.email || '',
      created_at: complaint.created_at,
      updated_at: complaint.updated_at,
      messages: (messages || []).map((m) => ({
        id: m.id,
        content: m.content,
        sender_id: m.profiles?.cognito_sub || m.sender_id,
        sender_name: `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.trim() || 'Unknown',
        sender_type: m.message_type === 'staff' || m.profiles?.role === 'admin' || m.profiles?.role === 'admin-resolve' || m.profiles?.role === 'staff' ? 'staff' : 'student',
        created_at: m.created_at,
        subject: m.subject || undefined,
        attachments: attachmentMap.get(m.id) || [],
      })),
    };
  }

  /**
   * Update complaint status (staff version)
   */
  async updateComplaint(authUser, complaintId, updates) {
    this._ensureEnabled();
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');

    const { data, error } = await this.client
      .from('complaints')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', complaintId)
      .select('*')
      .single();

    if (error) throw error;
    return {
      id: data.id,
      status: data.status,
      assigned_to: data.assigned_to,
      updated_at: data.updated_at,
    };
  }

  /**
   * Assign complaint to the current staff member
   */
  async assignComplaint(authUser, complaintId) {
    this._ensureEnabled();
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');

    const { data, error } = await this.client
      .from('complaints')
      .update({ assigned_to: profile.id, status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', complaintId)
      .select('*')
      .single();

    if (error) throw error;
    return {
      id: data.id,
      assigned_to: data.assigned_to,
      status: data.status,
    };
  }

  /**
   * Add a message to a complaint from staff
   */
  async addComplaintMessage(authUser, complaintId, payload) {
    this._ensureEnabled();
    console.log('[COMPLAINTS MSG] Processing for complaintId:', complaintId, 'userId:', authUser?.id);
    const profile = await this._getOrCreateProfile(authUser, 'admin-resolve');
    console.log('[COMPLAINTS MSG] Profile found:', profile?.id, profile?.role);

    try {
      await this._participantsService.upsertParticipant(
        complaintId,
        profile.id,
        profile.role || 'admin-resolve'
      );
      console.log('[COMPLAINTS MSG] Participant upserted');
    } catch (partErr) {
      console.error('[COMPLAINTS MSG] Participant error:', partErr.message || partErr);
    }

    const { data, error } = await this.client
      .from('complaint_messages')
      .insert({
        complaint_id: complaintId,
        sender_id: profile.id,
        subject: payload.subject || null,
        content: payload.content,
        message_type: 'staff',
        is_internal: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('[COMPLAINTS MSG] complaint_messages insert error:', error.message, error.details, error.hint);
      throw error;
    }

    await this.client
      .from('complaints')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', complaintId);

    const attachments = await this._insertMessageAttachments(data.id, payload.attachments || []);

    return {
      id: data.id,
      complaint_id: data.complaint_id,
      sender_id: profile.cognito_sub,
      sender_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || authUser.email || 'Unknown',
      sender_type: 'staff',
      content: data.content,
      subject: data.subject || undefined,
      message_type: data.message_type,
      created_at: data.created_at,
      attachments,
    };
  }
}

module.exports = new CommunicationDataService();
