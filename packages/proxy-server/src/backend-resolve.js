/**
 * Campus Resolve Backend Server
 * Handles all API routes for direct messages, profile, and notes
 *
 * Port: 8086
 * Routes: /api/resolve/*
 */

require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const communicationDataService = require('./services/communicationDataService');
const { isEnabled } = require('./services/featureFlagService');
const StaffProfileService = require('./services/staffProfileService');
const app = express();

// Initialize StaffProfileService
let staffProfileService;
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    staffProfileService = new StaffProfileService(supabase);
    console.log('[STAFF PROFILE] Service initialized');
  }
} catch (e) {
  console.log('[STAFF PROFILE] Service not available:', e.message);
}

const PORT = 8086;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS - Allow requests from frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8082', 'http://localhost:8083', 'http://localhost:5173'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting for profile endpoints
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const cognitoAuthRoutes = require('./routes/cognitoAuth');
app.use('/api/auth/cognito', cognitoAuthRoutes);

// ============================================================================
// AUTHENTICATION
// ============================================================================
const { authMiddleware: verifyAuth } = require('./middleware/auth');

// Use real auth middleware from middleware/auth.js
function authMiddleware(req, res, next) {
  return verifyAuth(req, res, next);
}

// ============================================================================
// MOCK DATA
// ============================================================================

// Mock conversations storage
const conversations = {
  'direct': [
    {
      id: 'conv-direct-1',
      sender: 'John Doe',
      type: 'direct',
      subject: 'Complaint Response',
      date: '5 March 2025',
      time: '13:00',
      relativeTime: '3 hours ago',
      priority: 'high',
      preview: 'Thank you for submitting your complaint...',
      unread: false,
      complaintId: 'complaint-123',
      complaintTitle: 'Inadequate library facilities',
      messages: [
        {
          id: 'msg-4',
          subject: 'Complaint: Inadequate library facilities',
          date: '3 March 2025',
          time: '09:00',
          content: 'The library is overcrowded during peak hours and lacks sufficient study spaces.',
          isSent: false,
          attachments: undefined,
        },
        {
          id: 'msg-5',
          subject: 'RE: Complaint Response',
          date: '5 March 2025',
          time: '13:00',
          content: 'Thank you for submitting your complaint. We have escalated this to the library management team who will investigate further.',
          isSent: true,
          attachments: undefined,
        },
      ],
    },
    {
      id: 'conv-direct-2',
      sender: 'Sarah Johnson',
      type: 'direct',
      subject: 'Follow-up on accommodation request',
      date: '2 March 2025',
      time: '15:30',
      relativeTime: '3 days ago',
      priority: 'normal',
      preview: 'Have you received my accommodation request?',
      unread: false,
      complaintId: 'complaint-456',
      complaintTitle: 'Student accommodation issues',
      messages: [
        {
          id: 'msg-6',
          subject: 'Accommodation Request',
          date: '28 Feb 2025',
          time: '10:00',
          content: 'I am requesting accommodation for next semester due to medical reasons.',
          isSent: false,
          attachments: undefined,
        },
      ],
    },
  ],
};

// Mock notes storage
const notes = [
  {
    id: 'note-1',
    type: 'note',
    subject: 'Escalation follow-up',
    description: 'Follow up with complainant on library facility improvements scheduled for Q2.',
    createdAt: new Date('2025-03-05T14:00:00'),
    updatedAt: new Date('2025-03-05T14:00:00'),
  },
  {
    id: 'note-2',
    type: 'note',
    subject: 'Action items',
    description: 'Contact facilities manager regarding the broken air conditioning in lecture hall B.',
    createdAt: new Date('2025-03-04T11:30:00'),
    updatedAt: new Date('2025-03-04T11:30:00'),
  },
  {
    id: 'note-3',
    type: 'file',
    name: 'Complaint_Statistics_March.pdf',
    fileType: 'pdf',
    createdAt: new Date('2025-03-03T09:00:00'),
    size: 2048000,
    storage_key: 'mock-storage-key/note-3/Complaint_Statistics_March.pdf',
  },
];

// ============================================================================
// DIRECT MESSAGE ENDPOINTS (Staff/Admin Resolve Communications)
// ============================================================================

// GET /api/resolve/direct/conversations - Get all direct conversations
app.get('/api/resolve/direct/conversations', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.listDirectConversations(req.user);
      return res.json({
        success: true,
        data,
        count: data.length,
        message: 'Direct conversations retrieved successfully',
      });
    } catch (error) {
      console.error('[DIRECT] Supabase fallback to mock due to error:', error.message);
    }
  }

  try {
    const { filter, search } = req.query;

    let conversationsList = conversations['direct'].map(conv => ({
      id: conv.id,
      sender: conv.sender,
      type: conv.type,
      subject: conv.subject,
      date: conv.date,
      time: conv.time,
      relativeTime: conv.relativeTime,
      priority: conv.priority,
      preview: conv.preview,
      unread: conv.unread,
      complaintId: conv.complaintId,
      complaintTitle: conv.complaintTitle,
      messageCount: conv.messages.length,
    }));

    // Filter by priority if specified
    if (filter && filter !== 'all') {
      conversationsList = conversationsList.filter(c => c.priority === filter);
    }

    // Search by sender or subject
    if (search) {
      const searchLower = search.toLowerCase();
      conversationsList = conversationsList.filter(c =>
        c.sender.toLowerCase().includes(searchLower) ||
        c.subject.toLowerCase().includes(searchLower) ||
        c.complaintTitle.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: conversationsList,
      count: conversationsList.length,
      message: 'Direct conversations retrieved successfully',
    });
  } catch (error) {
    console.error('[DIRECT] Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/resolve/direct/conversations/:conversationId - Get specific direct conversation
app.get('/api/resolve/direct/conversations/:conversationId', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const conversation = await communicationDataService.getDirectConversation(
        req.user,
        req.params.conversationId
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Conversation not found',
        });
      }

      return res.json({
        success: true,
        data: conversation,
        message: 'Conversation retrieved successfully',
      });
    } catch (error) {
      console.error('[DIRECT] Conversation detail fallback to mock due to error:', error.message);
    }
  }

  try {
    const { conversationId } = req.params;
    const conversation = conversations['direct'].find(c => c.id === conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      data: conversation,
      message: 'Conversation retrieved successfully',
    });
  } catch (error) {
    console.error('[DIRECT] Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// POST /api/resolve/direct/conversations - Create new direct message conversation
app.post('/api/resolve/direct/conversations', authMiddleware, (req, res) => {
  try {
    const { studentId, subject, content, complaintId, complaintTitle, attachments } = req.body;

    if (!studentId || !subject || !content) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [
          !studentId && 'StudentId is required',
          !subject && 'Subject is required',
          !content && 'Content is required',
        ].filter(Boolean),
      });
    }

    const now = new Date();
    const newConversation = {
      id: 'conv-direct-' + Date.now(),
      sender: 'John Doe',
      type: 'direct',
      subject: subject,
      date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
      relativeTime: 'Just now',
      priority: 'normal',
      preview: content.substring(0, 50) + '...',
      unread: false,
      complaintId: complaintId || null,
      complaintTitle: complaintTitle || null,
      messages: [
        {
          id: 'msg-' + Date.now(),
          subject: subject,
          date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
          time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
          content: content,
          isSent: true,
          attachments: attachments && attachments.length > 0 ? attachments : undefined,
        },
      ],
    };

    conversations['direct'].unshift(newConversation);

    res.status(201).json({
      success: true,
      data: newConversation,
      message: 'Conversation created successfully',
    });
  } catch (error) {
    console.error('[DIRECT] Create conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// POST /api/resolve/direct/conversations/:conversationId/messages - Add message to direct conversation
app.post('/api/resolve/direct/conversations/:conversationId/messages', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const { conversationId } = req.params;
      const { subject, content, attachments } = req.body;

      if (!content || !String(content).trim()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: ['Content is required'],
        });
      }

      const created = await communicationDataService.addDirectMessage(req.user, conversationId, {
        subject,
        content,
        attachments,
      });

      return res.status(201).json({
        success: true,
        data: created,
        message: 'Message added successfully',
      });
    } catch (error) {
      if (String(error.message || '').toLowerCase().includes('not found')) {
        return res.status(404).json({ success: false, error: 'Not found', message: error.message });
      }
      console.error('[DIRECT] Add message fallback to mock due to error:', error);
    }
  }

  // Mock response - only reached if feature flag disabled or Supabase error occurred

  try {
    const { conversationId } = req.params;
    const { subject, content, attachments } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Content is required'],
      });
    }

    const conversation = conversations['direct'].find(c => c.id === conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Conversation not found',
      });
    }

    const now = new Date();
    const newMessage = {
      id: 'msg-' + Date.now(),
      subject: subject || conversation.subject,
      date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
      content: content,
      isSent: true,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    };

    conversation.messages.push(newMessage);
    conversation.date = newMessage.date;
    conversation.time = newMessage.time;
    conversation.relativeTime = 'Just now';
    conversation.preview = content.substring(0, 50) + '...';

    res.status(201).json({
      success: true,
      data: newMessage,
      message: 'Message added successfully',
    });
  } catch (error) {
    console.error('[DIRECT] Add message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// PROFILE ENDPOINT (Read-only Staff Data, sourced from the `staff` table)
// ============================================================================

// GET /api/resolve/profile - Get current user's staff profile (read-only, mirrors Admin Staff Data)
app.get('/api/resolve/profile', profileLimiter, authMiddleware, async (req, res) => {
  if (!staffProfileService) {
    return res.status(503).json({
      success: false,
      error: 'Service unavailable',
      message: 'Staff profile service is not initialized',
    });
  }

  try {
    const data = await staffProfileService.getProfile(req.user);
    return res.json({
      success: true,
      data,
      message: 'Profile retrieved successfully',
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    console.error('[PROFILE] Get profile error:', error.message);
    return res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'Not found' : 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// NOTES ENDPOINTS (Quick Notes with Attachments)
// ============================================================================

// GET /api/resolve/notes - Get all notes
app.get('/api/resolve/notes', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.listQuickNotes(req.user, {
        search: req.query.search,
        type: req.query.type,
      });
      return res.json({
        success: true,
        data,
        count: data.length,
        message: 'Notes retrieved successfully',
      });
    } catch (error) {
      console.error('[NOTES] Supabase fallback to mock due to error:', error.message);
    }
  }

  try {
    const { search, type } = req.query;

    let notesList = [...notes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Filter by type
    if (type && type !== 'all') {
      notesList = notesList.filter(n => n.type === type);
    }

    // Search by subject or description
    if (search) {
      const searchLower = search.toLowerCase();
      notesList = notesList.filter(n => {
        if (n.type === 'note') {
          return n.subject.toLowerCase().includes(searchLower) ||
            n.description.toLowerCase().includes(searchLower);
        }
        return n.name.toLowerCase().includes(searchLower);
      });
    }

    res.json({
      success: true,
      data: notesList,
      count: notesList.length,
      message: 'Notes retrieved successfully',
    });
  } catch (error) {
    console.error('[NOTES] Get notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/resolve/notes/:noteId - Get specific note
app.get('/api/resolve/notes/:noteId', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.getQuickNote(req.user, req.params.noteId);
      if (!data) {
        return res.status(404).json({ success: false, error: 'Not found', message: 'Note not found' });
      }
      return res.json({
        success: true,
        data,
        message: 'Note retrieved successfully',
      });
    } catch (error) {
      console.error('[NOTES] Detail fallback to mock due to error:', error.message);
    }
  }

  try {
    const { noteId } = req.params;
    const note = notes.find(n => n.id === noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Note not found',
      });
    }

    res.json({
      success: true,
      data: note,
      message: 'Note retrieved successfully',
    });
  } catch (error) {
    console.error('[NOTES] Get note error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// POST /api/resolve/notes - Create new note
app.post('/api/resolve/notes', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const { subject, description, links = [] } = req.body;
      if (!subject || !description) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: [!subject && 'Subject is required', !description && 'Description is required'].filter(Boolean),
        });
      }

      const data = await communicationDataService.createQuickNote(req.user, {
        subject,
        description,
        links,
      });

      return res.status(201).json({
        success: true,
        data,
        message: 'Note created successfully',
      });
    } catch (error) {
      console.error('[NOTES] Create fallback to mock due to error:', error.message);
    }
  }

  try {
    const { subject, description } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [
          !subject && 'Subject is required',
          !description && 'Description is required',
        ].filter(Boolean),
      });
    }

    const newNote = {
      id: 'note-' + Date.now(),
      type: 'note',
      subject: subject,
      description: description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    notes.unshift(newNote);

    res.status(201).json({
      success: true,
      data: newNote,
      message: 'Note created successfully',
    });
  } catch (error) {
    console.error('[NOTES] Create note error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /api/resolve/notes/:noteId - Update note
app.put('/api/resolve/notes/:noteId', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const { subject, description, links } = req.body;
      const data = await communicationDataService.updateQuickNote(req.user, req.params.noteId, {
        subject,
        description,
        links,
      });

      return res.json({
        success: true,
        data,
        message: 'Note updated successfully',
      });
    } catch (error) {
      if (String(error.message || '').toLowerCase().includes('not found')) {
        return res.status(404).json({ success: false, error: 'Not found', message: error.message });
      }
      console.error('[NOTES] Update fallback to mock due to error:', error.message);
    }
  }

  try {
    const { noteId } = req.params;
    const { subject, description } = req.body;

    const note = notes.find(n => n.id === noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Note not found',
      });
    }

    if (note.type !== 'note') {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation',
        message: 'Cannot update file attachments. Use attachment endpoints instead.',
      });
    }

    if (subject) note.subject = subject;
    if (description) note.description = description;
    note.updatedAt = new Date();

    res.json({
      success: true,
      data: note,
      message: 'Note updated successfully',
    });
  } catch (error) {
    console.error('[NOTES] Update note error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /api/resolve/notes/:noteId - Delete note or file
app.delete('/api/resolve/notes/:noteId', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const deleted = await communicationDataService.deleteQuickNote(req.user, req.params.noteId);
      return res.json({
        success: true,
        data: {
          id: deleted.id,
          message: `${deleted.type === 'note' ? 'Note' : 'File'} deleted successfully`,
        },
      });
    } catch (error) {
      if (String(error.message || '').toLowerCase().includes('not found')) {
        return res.status(404).json({ success: false, error: 'Not found', message: error.message });
      }
      console.error('[NOTES] Delete fallback to mock due to error:', error.message);
    }
  }

  try {
    const { noteId } = req.params;
    const noteIndex = notes.findIndex(n => n.id === noteId);

    if (noteIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Note not found',
      });
    }

    const deletedNote = notes.splice(noteIndex, 1)[0];

    res.json({
      success: true,
      data: {
        id: deletedNote.id,
        message: `${deletedNote.type === 'note' ? 'Note' : 'File'} deleted successfully`,
      },
    });
  } catch (error) {
    console.error('[NOTES] Delete note error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// ============================================================================
// STORAGE ROUTES (S3 presigned URL pipeline)
// ============================================================================
const storageRoutes = require('./routes/storage');
app.use('/api/storage', storageRoutes);

// POST /api/resolve/notes/attachments - Attach file to note section
app.post('/api/resolve/notes/attachments', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const { name, fileType, size, noteId } = req.body;
      if (!name || !fileType) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: [!name && 'File name is required', !fileType && 'File type is required'].filter(Boolean),
        });
      }

      const data = await communicationDataService.createQuickNoteAttachment(req.user, {
        name,
        fileType,
        size,
        noteId,
      });

      return res.status(201).json({
        success: true,
        data,
        message: 'File attached successfully',
      });
    } catch (error) {
      console.error('[NOTES] Attachment fallback to mock due to error:', error.message);
    }
  }

  try {
    const { name, fileType, size } = req.body;

    if (!name || !fileType) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [
          !name && 'File name is required',
          !fileType && 'File type is required',
        ].filter(Boolean),
      });
    }

    const validFileTypes = ['pdf', 'image', 'excel', 'word', 'document'];
    if (!validFileTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [`File type must be one of: ${validFileTypes.join(', ')}`],
      });
    }

    const newFile = {
      id: 'file-' + Date.now(),
      type: 'file',
      name: name,
      fileType: fileType,
      size: size || 0,
      createdAt: new Date(),
    };

    notes.unshift(newFile);

    res.status(201).json({
      success: true,
      data: newFile,
      message: 'File attached successfully',
    });
  } catch (error) {
    console.error('[NOTES] Attach file error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /api/resolve/notes/:noteId/download - Download file
app.get('/api/resolve/notes/:noteId/download', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.getQuickNoteDownload(req.user, req.params.noteId);
      return res.json({
        success: true,
        data,
        message: 'File download ready',
      });
    } catch (error) {
      if (String(error.message || '').toLowerCase().includes('not found')) {
        return res.status(404).json({ success: false, error: 'Not found', message: 'File not found' });
      }
      console.error('[NOTES] Download fallback to mock due to error:', error.message);
    }
  }

  try {
    const { noteId } = req.params;
    const note = notes.find(n => n.id === noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'File not found',
      });
    }

    if (note.type !== 'file') {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation',
        message: 'Only files can be downloaded',
      });
    }

    // Mock download response
    res.json({
      success: true,
      data: {
        fileName: note.name,
        fileType: note.fileType,
        downloadUrl: `/api/resolve/files/${noteId}/${note.name}`,
        size: note.size,
      },
      message: 'File download ready',
    });
  } catch (error) {
    console.error('[NOTES] Download file error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// Mock file download endpoint - serves placeholder content for testing
app.get('/api/storage/mock-download/:attachmentId/:fileName', authMiddleware, (req, res) => {
  const { fileName } = req.params;
  // Return a simple text placeholder for mock downloads
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(`Mock file content: ${fileName}\n\nThis is placeholder content for testing purposes.`);
});

// Mock download by storage key endpoint
app.get('/api/storage/mock-download/key/:storageKey', authMiddleware, (req, res) => {
  const { storageKey } = req.params;
  // Return a simple text placeholder for mock downloads
  const fileName = storageKey.split('/').pop() || 'file';
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(`Mock file content: ${fileName}\n\nThis is placeholder content for testing purposes.`);
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Campus Resolve Backend',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});



console.log('[ITEMS] Starting items route registration...');

// In-memory mock storage for items (pre-populated with sample data)
const items = [
  {
    id: 'item-1',
    content_type: 'note',
    title: 'Escalation follow-up',
    description: 'Follow up with complainant on library facility improvements scheduled for Q2.',
    created_by: 'admin-001',
    created_at: new Date('2025-03-05T14:00:00').toISOString(),
    updated_at: new Date('2025-03-05T14:00:00').toISOString(),
    is_deleted: false,
    is_pinned: false,
  },
  {
    id: 'item-2',
    content_type: 'note',
    title: 'Action items',
    description: 'Contact facilities manager regarding the broken air conditioning in lecture hall B.',
    created_by: 'admin-001',
    created_at: new Date('2025-03-04T11:30:00').toISOString(),
    updated_at: new Date('2025-03-04T11:30:00').toISOString(),
    is_deleted: false,
    is_pinned: false,
  },
  {
    id: 'item-3',
    content_type: 'file',
    title: 'Complaint Statistics March 2025',
    file_name: 'Complaint_Statistics_March.pdf',
    file_type: 'pdf',
    file_size: 2048000,
    storage_key: 'mock-storage-key/item-3/Complaint_Statistics_March.pdf',
    created_by: 'admin-001',
    created_at: new Date('2025-03-03T09:00:00').toISOString(),
    updated_at: new Date('2025-03-03T09:00:00').toISOString(),
    is_deleted: false,
    is_pinned: false,
  },
];

// DEBUG: Log when items route is accessed
console.log('[ITEMS DEBUG] Route /api/resolve/items registered!');
console.log('[ITEMS DEBUG] Server file loaded at:', new Date().toISOString());
console.log(`[ITEMS DEBUG] Mock items pre-populated: ${items.length} items`);

// GET /api/resolve/items - Get all items (notes, files, links)
app.get('/api/resolve/items', authMiddleware, async (req, res) => {
  console.log('[ITEMS DEBUG] GET /api/resolve/items called!');
  console.log('[ITEMS DEBUG] User:', req.user?.id, 'Source:', req.user?.source);
  const { search, content_type } = req.query;

  // Try Supabase first
  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.listItems(req.user, {
        search,
        content_type,
      });
      console.log('[ITEMS DEBUG] Supabase returned:', data?.length || 0, 'items');
      
      // If no data found for dev mode user, fall back to mock data
      if (data.length === 0 && req.user?.source === 'dev-mode') {
        console.log('[ITEMS DEBUG] No data in Supabase, using mock data for dev mode');
        const mockItems = [...items];
        return res.json({
          success: true,
          data: mockItems,
          count: mockItems.length,
          message: 'Items retrieved successfully (dev mock mode)',
        });
      }
      
      return res.json({
        success: true,
        data,
        count: data.length,
        message: 'Items retrieved successfully',
      });
    } catch (error) {
      console.error('[ITEMS] Supabase fallback to mock:', error.message);
      console.error('[ITEMS] Full error:', error);
    }
  }

  // Fallback to mock data
  try {
    let itemsList = [...items];
    
    // In dev mode without auth, return all mock items
    // In production, filter by user
    if (req.user?.source !== 'dev-mode') {
      itemsList = itemsList.filter(item => item.created_by === req.user?.id);
    }
    
    // Sort by date (handle both created_at and createdAt)
    itemsList = itemsList.sort((a, b) => 
      new Date(b.created_at || b.createdAt).getTime() - 
      new Date(a.created_at || a.createdAt).getTime()
    );

    // Filter by content_type
    if (content_type && content_type !== 'all') {
      itemsList = itemsList.filter(i => i.content_type === content_type);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      itemsList = itemsList.filter(i => 
        i.title?.toLowerCase().includes(searchLower) || 
        i.description?.toLowerCase().includes(searchLower)
      );
    }

    console.log('[ITEMS DEBUG] Mock mode returning:', itemsList.length, 'items');
    res.json({
      success: true,
      data: itemsList,
      count: itemsList.length,
      message: 'Items retrieved successfully (mock mode)',
    });
  } catch (error) {
    console.error('[ITEMS] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve items', message: error.message });
  }
});

// GET /api/resolve/items/:id - Get single item
app.get('/api/resolve/items/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const item = await communicationDataService.getItem(req.user, id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }
      return res.json({ success: true, data: item, message: 'Item retrieved successfully' });
    } catch (error) {
      console.error('[ITEMS] Supabase error:', error.message);
    }
  }

  // Fallback to mock
  const item = items.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }
  res.json({ success: true, data: item, message: 'Item retrieved successfully (mock mode)' });
});

// POST /api/resolve/items - Create new item (note, file, or link)
app.post('/api/resolve/items', authMiddleware, async (req, res) => {
  console.log('[ITEMS] POST /api/resolve/items called');
  console.log('[ITEMS] Request body:', JSON.stringify(req.body, null, 2));
  
  const { content_type, title, description, link_url, link_label, file_name, file_type, file_size, storageKey, s3_url } = req.body;

  console.log('[ITEMS] FEATURE_QUICKNOTES_SUPABASE:', isEnabled('FEATURE_QUICKNOTES_SUPABASE'));
  console.log('[ITEMS] communicationDataService.isEnabled():', communicationDataService.isEnabled());

  if (!content_type || !title) {
    console.log('[ITEMS] Missing required fields - title:', title, 'content_type:', content_type);
    return res.status(400).json({ success: false, error: 'Missing required fields', message: 'content_type and title are required' });
  }

  const newItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content_type,
    title,
    description: description || '',
    createdBy: req.user?.id || req.user?.sub,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDeleted: false,
  };

  // Add link-specific fields for notes
  if (content_type === 'note') {
    console.log('[ITEMS] Processing note with link_url:', link_url, 'link_label:', link_label);
    newItem.link_url = link_url || null;
    newItem.link_label = link_label || null;
  }

  // Add link-specific fields for links
  if (content_type === 'link') {
    newItem.link_url = link_url || '';
    newItem.link_label = link_label || title;
  }

  // Add file-specific fields
  if (content_type === 'file') {
    newItem.file_name = file_name || '';
    newItem.file_type = file_type || '';
    newItem.file_size = file_size || 0;
    newItem.storageKey = storageKey || '';
    newItem.s3_url = s3_url || '';
  }

  console.log('[ITEMS] newItem to insert:', JSON.stringify(newItem, null, 2));

  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    console.log('[ITEMS] Using Supabase path');
    try {
      const created = await communicationDataService.createItem(req.user, newItem);
      console.log('[ITEMS] Supabase created result:', JSON.stringify(created, null, 2));
      return res.json({ success: true, data: created, message: 'Item created successfully' });
    } catch (error) {
      console.error('[ITEMS] Supabase error:', error.message);
    }
  } else {
    console.log('[ITEMS] Using mock path');
  }

  // Fallback to mock
  items.push(newItem);
  console.log('[ITEMS] Mock item added, total items:', items.length);
  res.json({ success: true, data: newItem, message: 'Item created successfully (mock mode)' });
});

// PUT /api/resolve/items/:id - Update item
app.put('/api/resolve/items/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const updated = await communicationDataService.updateItem(req.user, id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }
      return res.json({ success: true, data: updated, message: 'Item updated successfully' });
    } catch (error) {
      console.error('[ITEMS] Supabase error:', error.message);
    }
  }

  // Fallback to mock
  const index = items.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }

  items[index] = {
    ...items[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  res.json({ success: true, data: items[index], message: 'Item updated successfully (mock mode)' });
});

// DELETE /api/resolve/items/:id - Delete item (soft delete)
app.delete('/api/resolve/items/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  console.log('[ITEMS] DELETE endpoint called for item:', id);

  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    console.log('[ITEMS] Using Supabase for deletion');
    try {
      const result = await communicationDataService.deleteItem(req.user, id);
      console.log('[ITEMS] Supabase delete result:', result);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }
      return res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      console.error('[ITEMS] Supabase delete error:', error.message);
      return res.status(500).json({ success: false, error: 'Failed to delete item', details: [error.message] });
    }
  }

  // Fallback to mock
  console.log('[ITEMS] Using mock for deletion');
  const index = items.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }

  items[index].isDeleted = true;
  items[index].deletedAt = new Date().toISOString();

  res.json({ success: true, message: 'Item deleted successfully (mock mode)' });
});

// GET /api/resolve/items/:id/download - Download file
app.get('/api/resolve/items/:id/download', authMiddleware, async (req, res) => {
  const { id } = req.params;

  // Import s3StorageService for presigned URL generation
  const s3StorageService = require('./services/s3StorageService');

  console.log('[ITEMS] Download endpoint called for id:', id);

  if (isEnabled('FEATURE_QUICKNOTES_SUPABASE') && communicationDataService.isEnabled()) {
    console.log('[ITEMS] Using Supabase path for download');
    try {
      const item = await communicationDataService.getItem(req.user, id);
      console.log('[ITEMS] Download - getItem result:', JSON.stringify(item, null, 2));
      
      if (!item || item.content_type !== 'file') {
        return res.status(404).json({ success: false, error: 'File not found' });
      }

      const isBlobOrDataUrl = (url) => typeof url === 'string' && (url.startsWith('blob:') || url.startsWith('data:'));

      // Generate presigned URL for S3 download if we have a storage key
      if (item.storage_key && !isBlobOrDataUrl(item.storage_key)) {
        console.log('[ITEMS] Generating presigned URL for storage_key:', item.storage_key);
        const downloadUrl = await s3StorageService.generateDownloadUrl(item.storage_key);
        console.log('[ITEMS] Generated presigned URL:', downloadUrl);
        return res.json({ success: true, downloadUrl, message: 'Download URL generated' });
      }

      // Fallback to stored s3_url if no storage key
      if (item.s3_url && !isBlobOrDataUrl(item.s3_url)) {
        console.log('[ITEMS] No storage_key, using s3_url:', item.s3_url);
        return res.json({ success: true, downloadUrl: item.s3_url, message: 'Download URL generated' });
      }
      
      console.log('[ITEMS] No storage_key or s3_url found!');
    } catch (error) {
      console.error('[ITEMS] Download error:', error.message);
    }
  }

  // Fallback to mock
  const item = items.find(i => i.id === id && i.content_type === 'file');
  if (!item) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  res.json({ success: true, downloadUrl: item.s3_url || '', message: 'Download URL generated (mock mode)' });
});

// ============================================================================
// COMPLAINTS ENDPOINTS (Campus Voice ↔ Campus Resolve Two-Way Communication)
// ============================================================================

// GET /api/resolve/complaints/open - Get all open complaints (for escalation/reassignment)
app.get('/api/resolve/complaints/open', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.listOpenComplaints({
        category: req.query.category,
        priority: req.query.priority,
      });
      return res.json({
        success: true,
        data,
        count: data.length,
        message: 'Open complaints retrieved successfully',
      });
    } catch (error) {
      console.error('[COMPLAINTS] Open complaints fallback to mock:', error.message);
    }
  }

  res.json({
    success: true,
    data: [],
    count: 0,
    message: 'Open complaints retrieved (mock mode)',
  });
});

// GET /api/resolve/complaints/assigned - Get complaints assigned to current staff
app.get('/api/resolve/complaints/assigned', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.listAssignedComplaints(req.user);
      return res.json({
        success: true,
        data,
        count: data.length,
        message: 'Assigned complaints retrieved successfully',
      });
    } catch (error) {
      console.error('[COMPLAINTS] Assigned fallback to mock:', error.message);
    }
  }

  // Mock response
  res.json({
    success: true,
    data: [
      {
        id: 'compl-1',
        title: 'Library facilities complaint',
        description: 'Overcrowded library during peak hours',
        category: 'campus-facilities',
        status: 'open',
        current_level: '1',
        priority: 'normal',
        filed_by: 'student-123',
        student_name: 'John Doe',
        student_email: 'john.doe@university.edu',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      },
    ],
    count: 1,
    message: 'Assigned complaints retrieved (mock mode)',
  });
});

// GET /api/resolve/complaints/:id - Get specific complaint with messages
app.get('/api/resolve/complaints/:id', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.getComplaint(req.user, req.params.id);
      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Complaint not found',
        });
      }
      return res.json({
        success: true,
        data,
        message: 'Complaint retrieved successfully',
      });
    } catch (error) {
      console.error('[COMPLAINTS] Get fallback to mock:', error.message);
    }
  }

// Mock response
   res.json({
     success: true,
     data: {
       id: req.params.id,
       title: 'Sample Complaint',
       description: 'Sample description',
       category: 'campus-facilities',
       status: 'open',
       current_level: '1',
       priority: 'normal',
       filed_by: 'student-123',
       student_name: 'John Doe',
       student_email: 'john.doe@university.edu',
       created_at: new Date().toISOString(),
       updated_at: new Date().toISOString(),
       messages: [
         {
           id: 'msg-1',
           content: 'Initial complaint message from student',
           sender_id: 'student-123',
           sender_type: 'student',
           created_at: new Date().toISOString(),
           subject: req.params.id,
         },
       ],
     },
     message: 'Complaint retrieved (mock mode)',
   });
 });

// PUT /api/resolve/complaints/:id - Update complaint status
app.put('/api/resolve/complaints/:id', authMiddleware, async (req, res) => {
  const { status, assigned_to } = req.body;

  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.updateComplaint(req.user, req.params.id, {
        status,
        assigned_to,
      });
      return res.json({
        success: true,
        data,
        message: 'Complaint updated successfully',
      });
    } catch (error) {
      console.error('[COMPLAINTS] Update error:', error.message);
    }
  }

  // Mock response
  res.json({
    success: true,
    data: {
      id: req.params.id,
      status: status || 'in_progress',
    },
    message: 'Complaint updated (mock mode)',
  });
});

// PUT /api/resolve/complaints/:id/assign - Assign complaint to staff
app.put('/api/resolve/complaints/:id/assign', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.assignComplaint(req.user, req.params.id);
      return res.json({
        success: true,
        data,
        message: 'Complaint assigned successfully',
      });
    } catch (error) {
      console.error('[COMPLAINTS] Assign error:', error.message);
    }
  }

  res.json({
    success: true,
    data: { id: req.params.id },
    message: 'Complaint assigned (mock mode)',
  });
});

// POST /api/resolve/complaints/:id/messages - Add message to complaint
app.post('/api/resolve/complaints/:id/messages', authMiddleware, async (req, res) => {
  const { subject, content, attachments } = req.body;

  console.log('[COMPLAINTS MSG] Request body:', JSON.stringify({ subject, content: content?.substring(0, 50), attachmentsCount: attachments?.length }));

  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.addComplaintMessage(req.user, req.params.id, {
        subject,
        content,
        attachments,
      });
      console.log('[COMPLAINTS MSG] Success, message id:', data?.id);
      return res.status(201).json({
        success: true,
        data,
        message: 'Message added successfully',
      });
    } catch (error) {
      console.error('[COMPLAINTS MSG] Message error:', error.message);
      console.error('[COMPLAINTS MSG] Error stack:', error.stack);
      if (String(error.message || '').toLowerCase().includes('not found')) {
        return res.status(404).json({ success: false, error: 'Not found', message: error.message });
      }
      return res.status(500).json({ success: false, error: 'Server error', message: error.message, details: error.details || error.hint || undefined });
    }
  }

  // Mock fallback disabled - real implementation required
  return res.status(503).json({
    success: false,
    error: 'Service unavailable',
    message: 'Supabase complaints feature not configured. Set FEATURE_COMPLAINTS_SUPABASE=true and configure Supabase.',
  });
});

// ============================================================================
// 404 HANDLER - Must be AFTER all routes
// ============================================================================

app.use((req, res) => {
  console.log('[404 DEBUG] Unmatched request:', req.method, req.path);
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Endpoint not found: ${req.method} ${req.path}`,
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Campus Resolve Backend Server                        ║');
  console.log(`║  Server: http://localhost:${PORT}                         ║`);
  console.log('║  Status: ✅ READY                                      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('Available endpoints:');
  console.log('  POST   /api/resolve/direct/conversations');
  console.log('  GET    /api/resolve/direct/conversations');
  console.log('  GET    /api/resolve/direct/conversations/:id');
  console.log('  POST   /api/resolve/direct/conversations/:id/messages');
  console.log('  GET    /api/resolve/profile');
  console.log('  POST   /api/resolve/notes');
  console.log('  GET    /api/resolve/notes');
  console.log('  GET    /api/resolve/notes/:id');
  console.log('  PUT    /api/resolve/notes/:id');
  console.log('  DELETE /api/resolve/notes/:id');
  console.log('  POST   /api/resolve/notes/attachments');
  console.log('  GET    /api/resolve/notes/:id/download');
  console.log('  GET    /api/resolve/items');
  console.log('  GET    /api/resolve/items/:id');
  console.log('  POST   /api/resolve/items');
  console.log('  PUT    /api/resolve/items/:id');
  console.log('  DELETE /api/resolve/items/:id');
  console.log('  GET    /api/resolve/items/:id/download');
  console.log('  GET    /api/resolve/complaints/open');
  console.log('  GET    /api/resolve/complaints/assigned - Get complaints assigned to staff');
  console.log('  GET    /api/resolve/complaints/:id - Get specific complaint');
  console.log('  PUT    /api/resolve/complaints/:id - Update complaint status');
  console.log('  PUT    /api/resolve/complaints/:id/assign - Assign complaint to staff');
  console.log('  POST   /api/resolve/complaints/:id/messages - Add message to complaint');
});

module.exports = app;
