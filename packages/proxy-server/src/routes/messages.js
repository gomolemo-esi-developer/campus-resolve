// Messages Routes
const express = require('express');
const {
  createMessage,
  listMessages,
  getMessageDetail,
  searchMessagesHandler,
  getRecent,
  getCount,
  getThread,
} = require('../controllers/messagesController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * All message routes require authentication
 */
router.use(authMiddleware);

/**
 * POST /api/voice/messages/:complaintId/reply
 * Add message/reply to complaint
 * Requires: Authorization header with Bearer token
 * Params: { complaintId: number }
 * Body: { content: string, subject?: string, type?: 'reply' | 'escalation' }
 */
router.post('/:complaintId/reply', createMessage);

/**
 * GET /api/voice/messages/:complaintId
 * Get all messages for complaint
 * Requires: Authorization header with Bearer token
 * Params: { complaintId: number }
 */
router.get('/:complaintId', listMessages);

/**
 * GET /api/voice/messages/:complaintId/thread?page=1&pageSize=20
 * Get message thread with pagination
 * Requires: Authorization header with Bearer token
 * Params: { complaintId: number }
 * Query: { page?: number, pageSize?: number }
 */
router.get('/:complaintId/thread', getThread);

/**
 * GET /api/voice/messages/:complaintId/recent?limit=10
 * Get recent messages from complaint thread
 * Requires: Authorization header with Bearer token
 * Params: { complaintId: number }
 * Query: { limit?: number }
 */
router.get('/:complaintId/recent', getRecent);

/**
 * GET /api/voice/messages/:complaintId/count
 * Get message count for complaint
 * Requires: Authorization header with Bearer token
 * Params: { complaintId: number }
 */
router.get('/:complaintId/count', getCount);

/**
 * GET /api/voice/messages/:id/detail
 * Get single message by ID
 * Requires: Authorization header with Bearer token
 * Params: { id: number }
 */
router.get('/:id/detail', getMessageDetail);

/**
 * GET /api/voice/messages/search?query=
 * Search messages
 * Requires: Authorization header with Bearer token
 * Query: { query: string (min 2 chars) }
 */
router.get('/search', searchMessagesHandler);

module.exports = router;
