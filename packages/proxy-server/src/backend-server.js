/**
 * Campus Voice Backend Server
 * Handles all API routes for profile, complaints, messages, and attachments
 * 
 * Port: 8085
 * Routes: /api/voice/*
 */

require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const communicationDataService = require('./services/communicationDataService');
const s3StorageService = require('./services/s3StorageService');
const { isEnabled } = require('./services/featureFlagService');
const StudentProfileService = require('./services/studentProfileService');
const app = express();

const PORT = 8085;

// Initialize StudentProfileService
let studentProfileService;
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    studentProfileService = new StudentProfileService(supabase);
    console.log('[STUDENT PROFILE] Service initialized');
  }
} catch (e) {
  console.log('[STUDENT PROFILE] Service not available:', e.message);
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS - Allow requests from frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8082', 'http://localhost:8083', 'http://localhost:8084', 'http://localhost:5173'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Cookie parsing
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// AUTHENTICATION
// ============================================================================
const { authMiddleware: verifyAuth } = require('./middleware/auth');

// Use real auth middleware from middleware/auth.js
function authMiddleware(req, res, next) {
  return verifyAuth(req, res, next);
}

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================
// Regular authentication (fallback)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// AWS Cognito integration for sign-up, sign-in, token refresh, etc.
const cognitoAuthRoutes = require('./routes/cognitoAuth');
app.use('/api/auth/cognito', cognitoAuthRoutes);

// ============================================================================
// PROFILE ENDPOINT (Read-only Student Data, sourced from the `students` table)
// ============================================================================

// GET /api/voice/profile - Get current user's student profile (read-only, mirrors Admin Student Data)
app.get('/api/voice/profile', authMiddleware, async (req, res) => {
  if (!studentProfileService) {
    return res.status(503).json({
      success: false,
      error: 'Service unavailable',
      message: 'Student profile service is not initialized',
    });
  }

  try {
    const data = await studentProfileService.getProfile(req.user);
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

// GET /api/voice/complaint-types - List available complaint types
app.get('/api/voice/complaint-types', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const complaintTypes = await communicationDataService.getComplaintTypes();
      return res.json({
        success: true,
        data: complaintTypes,
        count: complaintTypes.length,
        message: 'Complaint types retrieved successfully',
      });
    } catch (error) {
      console.error('[VOICE COMPLAINT TYPES] Supabase fallback to mock due to error:', error.message);
    }
  }

  const fallbackTypes = [
    { id: 'ct-1', key: 'student-services', label: 'Student Services', description: 'Student administration and services related complaints', isActive: true },
    { id: 'ct-2', key: 'campus-facilities', label: 'Campus Facilities', description: 'Residence, lecture hall, infrastructure and facilities complaints', isActive: true },
    { id: 'ct-3', key: 'course-complaint', label: 'Course Complaint', description: 'Course delivery, content and academic support complaints', isActive: true },
    { id: 'ct-4', key: 'timetable', label: 'Timetable Issue', description: 'Scheduling and timetable conflict complaints', isActive: true },
    { id: 'ct-5', key: 'lecture-hall-lab', label: 'Lecture Hall | Lab Issue', description: 'Lecture venue and lab environment complaints', isActive: true },
    { id: 'ct-6', key: 'report-lecturer', label: 'Report Lecturer', description: 'Lecturer conduct or delivery complaints', isActive: true },
  ];

  return res.json({
    success: true,
    data: fallbackTypes,
    count: fallbackTypes.length,
    message: 'Complaint types retrieved successfully',
  });
});

// ============================================================================
// MOCK RESPONSES - COMPLAINTS ENDPOINTS
// ============================================================================

// POST /api/voice/complaints - Create new complaint
app.post('/api/voice/complaints', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const created = await communicationDataService.createComplaint(req.user, req.body);
      return res.status(201).json({
        success: true,
        data: created,
        message: 'Complaint created successfully',
      });
    } catch (error) {
      console.error('[VOICE COMPLAINTS] Create fallback to mock due to error:', error.message);
    }
  }

  const { title, description, category } = req.body;

  // Validate input
  const errors = [];
  if (!title || title.trim().length < 5) {
    errors.push('Title must be at least 5 characters');
  }
  if (!description || description.trim().length < 20) {
    errors.push('Description must be at least 20 characters');
  }
  if (!category) {
    errors.push('Category is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
    });
  }

  const complaintId = 'comp-' + Date.now();

  res.status(201).json({
    success: true,
    data: {
      id: complaintId,
      filed_by: req.user.id,
      title,
      description,
      category,
      status: 'open',
      current_level: 1,
      created_at: new Date().toISOString(),
    },
    message: 'Complaint created successfully',
  });
});

// GET /api/voice/complaints - List complaints with filters
app.get('/api/voice/complaints', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const { status, category, from_date, to_date, limit = 50, offset = 0 } = req.query;
      const complaints = await communicationDataService.listComplaints(req.user, {
        status,
        category,
        from_date,
        to_date,
        limit,
        offset,
      });

      return res.json({
        success: true,
        data: complaints,
        count: complaints.length,
        pagination: {
          total: complaints.length,
          limit: parseInt(String(limit), 10),
          offset: parseInt(String(offset), 10),
        },
        message: 'Complaints retrieved successfully',
      });
    } catch (error) {
      console.error('[VOICE COMPLAINTS] List fallback to mock due to error:', error.message);
    }
  }

  const { status, category, limit = 50, offset = 0 } = req.query;

  const allComplaints = [
    {
      id: 'comp-001',
      filed_by: req.user.id,
      title: 'Course Material Not Available',
      description: 'The course materials for Financial Accounting were not provided on time.',
      category: 'course-complaint',
      status: 'open',
      current_level: 1,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'comp-002',
      filed_by: req.user.id,
      title: 'Lecture Hall Temperature Issue',
      description: 'The lecture hall in building A is extremely cold during classes.',
      category: 'campus-facilities',
      status: 'in_progress',
      current_level: 2,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'comp-003',
      filed_by: req.user.id,
      title: 'Library Seating Problem',
      description: 'Not enough seating available during peak hours in the library.',
      category: 'campus-facilities',
      status: 'resolved',
      current_level: 1,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  let filtered = allComplaints;

  if (status && status !== 'All') {
    filtered = filtered.filter(c => c.status === status);
  }

  if (category) {
    filtered = filtered.filter(c => c.category === category);
  }

  const paginated = filtered.slice(offset, offset + parseInt(limit));

  res.json({
    success: true,
    data: paginated,
    count: paginated.length,
    pagination: {
      total: filtered.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    },
    message: 'Complaints retrieved successfully',
  });
});

// GET /api/voice/complaints/:id - Get complaint details with messages
app.get('/api/voice/complaints/:id', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.getComplaintById(req.user, req.params.id);
      return res.json({
        success: true,
        data,
        message: 'Complaint details retrieved successfully',
      });
    } catch (error) {
      if (String(error.message || '').toLowerCase().includes('not found')) {
        return res.status(404).json({ success: false, error: 'Not found', message: error.message });
      }
      if (String(error.message || '').toLowerCase().includes('unauthorized')) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: error.message });
      }
      console.error('[VOICE COMPLAINTS] Detail fallback to mock due to error:', error.message);
    }
  }

  const { id } = req.params;

  res.json({
    success: true,
    data: {
      id,
      filed_by: req.user.id,
      title: 'Course Material Not Available',
      description: 'The course materials for Financial Accounting were not provided on time.',
      category: 'course-complaint',
      status: 'open',
      current_level: 1,
      created_at: new Date().toISOString(),
      messages: [
        {
          id: 'msg-1',
          complaint_id: id,
          sender_id: req.user.id,
          sender_name: 'John Doe',
          content: 'The course materials for Financial Accounting were not provided on time.',
          message_type: 'initial',
          created_at: new Date().toISOString(),
        },
        {
          id: 'msg-2',
          complaint_id: id,
          sender_id: 'staff-001',
          sender_name: 'Dr. Smith',
          content: 'Thank you for reporting this issue. We are looking into it.',
          message_type: 'reply',
          created_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
    message: 'Complaint details retrieved successfully',
  });
});

// PUT /api/voice/complaints/:id - Update complaint status
app.put('/api/voice/complaints/:id', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const updated = await communicationDataService.updateComplaintStatus(
        req.user,
        req.params.id,
        req.body.status
      );
      return res.json({
        success: true,
        data: updated,
        message: 'Complaint status updated successfully',
      });
    } catch (error) {
      if (String(error.message || '').toLowerCase().includes('invalid status')) {
        return res.status(400).json({ success: false, error: 'Validation failed', details: [error.message] });
      }
      if (String(error.message || '').toLowerCase().includes('not found')) {
        return res.status(404).json({ success: false, error: 'Not found', message: error.message });
      }
      if (String(error.message || '').toLowerCase().includes('unauthorized')) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: error.message });
      }
      console.error('[VOICE COMPLAINTS] Update fallback to mock due to error:', error.message);
    }
  }

  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['open', 'in_progress', 'escalated', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: [`Status must be one of: ${validStatuses.join(', ')}`],
    });
  }

  res.json({
    success: true,
    data: {
      id,
      status,
      updated_at: new Date().toISOString(),
    },
    message: 'Complaint status updated successfully',
  });
});

// GET /api/voice/complaints/stats - Get statistics
app.get('/api/voice/complaints/stats', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const stats = await communicationDataService.getComplaintStats(req.user);
      return res.json({
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully',
      });
    } catch (error) {
      console.error('[VOICE COMPLAINTS] Stats fallback to mock due to error:', error.message);
    }
  }

  res.json({
    success: true,
    data: {
      total: 15,
      open: 5,
      in_progress: 4,
      escalated: 1,
      resolved: 3,
      closed: 2,
    },
    message: 'Statistics retrieved successfully',
  });
});

// GET /api/voice/complaints/search - Search complaints
app.get('/api/voice/complaints/search', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    const { query } = req.query;
    if (!query || String(query).trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Search query must be at least 2 characters'],
      });
    }

    try {
      const results = await communicationDataService.searchComplaints(req.user, String(query));
      return res.json({
        success: true,
        data: results,
        count: results.length,
        message: 'Search results retrieved successfully',
      });
    } catch (error) {
      console.error('[VOICE COMPLAINTS] Search fallback to mock due to error:', error.message);
    }
  }

  const { query } = req.query;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: ['Search query must be at least 2 characters'],
    });
  }

  res.json({
    success: true,
    data: [
      {
        id: 'comp-001',
        title: 'Course Material Not Available',
        description: 'The course materials were not provided.',
        category: 'course-complaint',
        status: 'open',
      },
    ],
    count: 1,
    message: 'Search results retrieved successfully',
  });
});

// GET /api/voice/complaints/category/:category - Get by category
app.get('/api/voice/complaints/category/:category', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const items = await communicationDataService.getComplaintsByCategory(req.user, req.params.category);
      return res.json({
        success: true,
        data: items,
        count: items.length,
        message: 'Complaints by category retrieved successfully',
      });
    } catch (error) {
      console.error('[VOICE COMPLAINTS] Category fallback to mock due to error:', error.message);
    }
  }

  const { category } = req.params;

  res.json({
    success: true,
    data: [
      {
        id: 'comp-002',
        title: 'Lecture Hall Temperature Issue',
        description: 'The lecture hall in building A is extremely cold.',
        category,
        status: 'in_progress',
      },
    ],
    count: 1,
    message: 'Complaints by category retrieved successfully',
  });
});

// ============================================================================
// MOCK RESPONSES - MESSAGES ENDPOINTS
// ============================================================================

// POST /api/voice/messages/:complaintId/reply - Add reply
app.post('/api/voice/messages/:complaintId/reply', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    const { complaintId } = req.params;
    const { content, subject, attachments } = req.body;

    if (!content || String(content).trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Content is required'],
      });
    }

    try {
      const message = await communicationDataService.addReply(req.user, complaintId, {
        content: String(content),
        subject: subject ? String(subject) : undefined,
        attachments: Array.isArray(attachments) ? attachments : [],
      });

      return res.status(201).json({
        success: true,
        data: message,
        message: 'Message added successfully',
      });
    } catch (error) {
      if (String(error.message || '').toLowerCase().includes('not found')) {
        return res.status(404).json({ success: false, error: 'Not found', message: error.message });
      }
      if (String(error.message || '').toLowerCase().includes('unauthorized')) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: error.message });
      }
      console.error('[VOICE MESSAGES] Reply fallback to mock due to error:', error.message);
    }
  }

  const { complaintId } = req.params;
  const { content, subject } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: ['Content is required'],
    });
  }

  res.status(201).json({
    success: true,
    data: {
      id: 'msg-' + Date.now(),
      complaint_id: complaintId,
      sender_id: req.user.id,
      sender_name: req.user.firstName + ' ' + req.user.lastName,
      content,
      subject,
      message_type: 'reply',
      created_at: new Date().toISOString(),
    },
    message: 'Message added successfully',
  });
});

// GET /api/voice/messages/:complaintId - Get all messages
app.get('/api/voice/messages/:complaintId', authMiddleware, async (req, res) => {
  if (isEnabled('FEATURE_COMPLAINTS_SUPABASE') && communicationDataService.isEnabled()) {
    try {
      const messages = await communicationDataService.getThread(req.user, req.params.complaintId);
      return res.json({
        success: true,
        data: messages,
        count: messages.length,
        message: 'Messages retrieved successfully',
      });
    } catch (error) {
      if (String(error.message || '').toLowerCase().includes('not found')) {
        return res.status(404).json({ success: false, error: 'Not found', message: error.message });
      }
      if (String(error.message || '').toLowerCase().includes('unauthorized')) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: error.message });
      }
      console.error('[VOICE MESSAGES] Thread fallback to mock due to error:', error.message);
    }
  }

  const { complaintId } = req.params;

  res.json({
    success: true,
    data: [
      {
        id: 'msg-1',
        complaint_id: complaintId,
        sender_id: req.user.id,
        sender_name: 'John Doe',
        content: 'Initial complaint message',
        message_type: 'initial',
        created_at: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        complaint_id: complaintId,
        sender_id: 'staff-001',
        sender_name: 'Dr. Smith',
        content: 'Reply from staff member',
        message_type: 'reply',
        created_at: new Date().toISOString(),
      },
    ],
    count: 2,
    message: 'Messages retrieved successfully',
  });
});

// GET /api/voice/messages/:complaintId/thread - Get paginated thread
app.get('/api/voice/messages/:complaintId/thread', authMiddleware, (req, res) => {
  const { complaintId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;

  res.json({
    success: true,
    data: [
      {
        id: 'msg-1',
        complaint_id: complaintId,
        content: 'Initial complaint',
        message_type: 'initial',
        created_at: new Date().toISOString(),
      },
    ],
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total: 2,
    },
    message: 'Thread retrieved successfully',
  });
});

// GET /api/voice/messages/:complaintId/recent - Get recent messages
app.get('/api/voice/messages/:complaintId/recent', authMiddleware, (req, res) => {
  const { complaintId } = req.params;
  const { limit = 10 } = req.query;

  res.json({
    success: true,
    data: [
      {
        id: 'msg-1',
        complaint_id: complaintId,
        content: 'Recent message',
        created_at: new Date().toISOString(),
      },
    ],
    count: 1,
    message: 'Recent messages retrieved successfully',
  });
});

// GET /api/voice/messages/:complaintId/count - Get message count
app.get('/api/voice/messages/:complaintId/count', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      count: 5,
    },
    message: 'Message count retrieved successfully',
  });
});

// GET /api/voice/messages/:id/detail - Get single message
app.get('/api/voice/messages/:id/detail', authMiddleware, (req, res) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      id,
      complaint_id: 'comp-001',
      sender_id: req.user.id,
      sender_name: 'John Doe',
      content: 'Detailed message content',
      message_type: 'reply',
      created_at: new Date().toISOString(),
    },
    message: 'Message details retrieved successfully',
  });
});

// GET /api/voice/messages/search - Search messages
app.get('/api/voice/messages/search', authMiddleware, (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: ['Search query must be at least 2 characters'],
    });
  }

  res.json({
    success: true,
    data: [
      {
        id: 'msg-1',
        complaint_id: 'comp-001',
        content: 'Message matching search query',
        created_at: new Date().toISOString(),
      },
    ],
    count: 1,
    message: 'Search results retrieved successfully',
  });
});

// ============================================================================
// STORAGE ROUTES (S3 presigned URL pipeline)
// ============================================================================
const storageRoutes = require('./routes/storage');
app.use('/api/storage', storageRoutes);

// ============================================================================
// MOCK RESPONSES - ATTACHMENTS ENDPOINTS
// ============================================================================

// POST /api/voice/messages/:messageId/attachments - Upload file
app.post('/api/voice/messages/:messageId/attachments', authMiddleware, async (req, res) => {
  const { messageId } = req.params;

  if (isEnabled('FEATURE_ATTACHMENTS_S3') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.createComplaintAttachment(req.user, messageId, req.body);
      return res.status(201).json({
        success: true,
        data,
        message: 'File uploaded successfully',
      });
    } catch (error) {
      console.error('[VOICE ATTACHMENTS] Upload fallback to mock due to error:', error.message);
    }
  }

  res.status(201).json({
    success: true,
    data: {
      id: 'att-' + Date.now(),
      message_id: messageId,
      file_name: 'document.pdf',
      file_type: 'pdf',
      file_size: 2048,
      storage_key: 'uploads/doc-' + Date.now(),
      created_at: new Date().toISOString(),
    },
    message: 'File uploaded successfully',
  });
});

// GET /api/voice/messages/:messageId/attachments - List message attachments
app.get('/api/voice/messages/:messageId/attachments', authMiddleware, async (req, res) => {
  const { messageId } = req.params;

  if (isEnabled('FEATURE_ATTACHMENTS_S3') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.getMessageAttachments(req.user, messageId);
      return res.json({
        success: true,
        data,
        count: data.length,
        message: 'Message attachments retrieved successfully',
      });
    } catch (error) {
      console.error('[VOICE ATTACHMENTS] List message attachments fallback to mock due to error:', error.message);
    }
  }

  res.json({
    success: true,
    data: [
      {
        id: 'att-1',
        message_id: messageId,
        file_name: 'document.pdf',
        file_type: 'pdf',
        file_size: 2048,
        created_at: new Date().toISOString(),
      },
    ],
    count: 1,
    message: 'Message attachments retrieved successfully',
  });
});

// GET /api/voice/complaints/:complaintId/attachments - List complaint attachments
app.get('/api/voice/complaints/:complaintId/attachments', authMiddleware, async (req, res) => {
  const { complaintId } = req.params;

  if (isEnabled('FEATURE_ATTACHMENTS_S3') && communicationDataService.isEnabled()) {
    try {
      const data = await communicationDataService.getComplaintAttachments(req.user, complaintId);
      return res.json({
        success: true,
        data,
        count: data.length,
        message: 'Complaint attachments retrieved successfully',
      });
    } catch (error) {
      console.error('[VOICE ATTACHMENTS] List complaint attachments fallback to mock due to error:', error.message);
    }
  }

  res.json({
    success: true,
    data: [
      {
        id: 'att-1',
        complaint_id: complaintId,
        file_name: 'issue-screenshot.png',
        file_type: 'image',
        file_size: 4096,
        created_at: new Date().toISOString(),
      },
    ],
    count: 1,
    message: 'Complaint attachments retrieved successfully',
  });
});

// GET /api/voice/attachments/:attachmentId/download - Download file
app.get('/api/voice/attachments/:attachmentId/download', authMiddleware, async (req, res) => {
  const { attachmentId } = req.params;

  if (isEnabled('FEATURE_ATTACHMENTS_S3') && communicationDataService.isEnabled()) {
    try {
      const attachment = await communicationDataService.getAttachmentById(req.user, attachmentId);
      const downloadUrl = await s3StorageService.generateDownloadUrl(attachment.storage_key);
      return res.json({
        success: true,
        data: {
          id: attachment.id,
          file_name: attachment.file_name,
          file_url: downloadUrl,
          file_size: attachment.file_size,
        },
        message: 'Download link generated successfully',
      });
    } catch (error) {
      console.error('[VOICE ATTACHMENTS] Download fallback to mock due to error:', error.message);
    }
  }

  res.json({
    success: true,
    data: {
      id: attachmentId,
      file_name: 'document.pdf',
      file_url: '/uploads/' + attachmentId,
      file_size: 2048,
    },
    message: 'Download link generated successfully',
  });
});

// DELETE /api/voice/attachments/:attachmentId - Delete attachment
app.delete('/api/voice/attachments/:attachmentId', authMiddleware, async (req, res) => {
  const { attachmentId } = req.params;

  if (isEnabled('FEATURE_ATTACHMENTS_S3') && communicationDataService.isEnabled()) {
    try {
      const attachment = await communicationDataService.getAttachmentById(req.user, attachmentId);
      await s3StorageService.deleteObject(attachment.storage_key);
      await communicationDataService.deleteAttachment(req.user, attachmentId);
      return res.json({
        success: true,
        message: 'Attachment deleted successfully',
      });
    } catch (error) {
      console.error('[VOICE ATTACHMENTS] Delete fallback to mock due to error:', error.message);
    }
  }

  res.json({
    success: true,
    message: 'Attachment deleted successfully',
  });
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
    timestamp: new Date().toISOString(),
    service: 'Campus Voice Backend API',
  });
});

// ============================================================================
// 404 Handler
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} does not exist`,
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Campus Voice Backend Server                           ║
╠════════════════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}                           ║
║                                                        ║
║  API Routes:                                           ║
║  ├─ GET    /api/voice/profile                         ║
║  ├─ GET    /api/voice/complaints                      ║
║  ├─ POST   /api/voice/complaints                      ║
║  ├─ GET    /api/voice/messages/:id                    ║
║  ├─ POST   /api/voice/messages/:id/reply              ║
║  ├─ POST   /api/voice/attachments/:id                 ║
║  └─ ...and 19 more endpoints                          ║
║                                                        ║
║  Status: ✅ READY                                      ║
║  Auth: Cognito JWT verification required               ║
║  CORS: Enabled for localhost:3000,8082,5173          ║
╚════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => {
  console.log('\n[Backend] Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
