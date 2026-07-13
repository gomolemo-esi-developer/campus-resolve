// Complaints Routes
const express = require('express');
const {
  createNewComplaint,
  listComplaints,
  getComplaint,
  updateStatus,
  search,
  byCategory,
  stats,
} = require('../controllers/complaintsController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * All complaint routes require authentication
 */
router.use(authMiddleware);

/**
 * POST /api/voice/complaints
 * Create new complaint
 * Requires: Authorization header with Bearer token
 * Body: { title, description, category, assigned_to?, initialMessage? }
 */
router.post('/', createNewComplaint);

/**
 * GET /api/voice/complaints
 * Get all complaints for current user
 * Requires: Authorization header with Bearer token
 * Query: { status?, category?, from_date?, to_date?, limit?, offset? }
 */
router.get('/', listComplaints);

/**
 * GET /api/voice/complaints/stats
 * Get complaint statistics
 * Requires: Authorization header with Bearer token
 * Returns: { total, open, in_progress, resolved, closed }
 */
router.get('/stats', stats);

/**
 * GET /api/voice/complaints/search?query=
 * Search complaints by title or description
 * Requires: Authorization header with Bearer token
 * Query: { query: string (min 2 chars) }
 */
router.get('/search', search);

/**
 * GET /api/voice/complaints/category/:category
 * Get complaints by category
 * Requires: Authorization header with Bearer token
 * Params: { category: string }
 */
router.get('/category/:category', byCategory);

/**
 * GET /api/voice/complaints/:id
 * Get complaint by ID with all messages
 * Requires: Authorization header with Bearer token
 * Params: { id: number }
 */
router.get('/:id', getComplaint);

/**
 * PUT /api/voice/complaints/:id
 * Update complaint status
 * Requires: Authorization header with Bearer token
 * Params: { id: number }
 * Body: { status: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed' }
 */
router.put('/:id', updateStatus);

module.exports = router;
