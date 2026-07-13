// Complaints Controller - Route handlers for complaint endpoints

const {
  createComplaint,
  getUserComplaints,
  getComplaintDetail,
  updateComplaintStatus,
  searchComplaints,
  getComplaintsByCategory,
  getComplaintStats,
  validateComplaintCreation,
} = require('../services/complaintsService');

/**
 * POST /api/voice/complaints
 * Create new complaint
 */
async function createNewComplaint(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Validate input
    const validation = validateComplaintCreation(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const complaint = await createComplaint(req.body, req.user.id, req.app.locals);

    return res.status(201).json({
      success: true,
      data: complaint,
      message: 'Complaint created successfully',
    });
  } catch (error) {
    console.error('[COMPLAINTS] Create complaint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/voice/complaints
 * Get all complaints for current user with filters
 */
async function listComplaints(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const filters = {
      status: req.query.status,
      category: req.query.category,
      from_date: req.query.from_date,
      to_date: req.query.to_date,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const complaints = await getUserComplaints(req.user.id, filters, req.app.locals);

    return res.status(200).json({
      success: true,
      data: complaints,
      count: complaints.length,
      message: 'Complaints retrieved successfully',
    });
  } catch (error) {
    console.error('[COMPLAINTS] List complaints error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/voice/complaints/:id
 * Get complaint by ID with all messages and details
 */
async function getComplaint(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Valid complaint ID required'],
      });
    }

    const complaint = await getComplaintDetail(parseInt(id), req.user.id, req.app.locals);

    return res.status(200).json({
      success: true,
      data: complaint,
      message: 'Complaint retrieved successfully',
    });
  } catch (error) {
    console.error('[COMPLAINTS] Get complaint error:', error);

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message,
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * PUT /api/voice/complaints/:id
 * Update complaint status
 */
async function updateStatus(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Valid complaint ID required'],
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Status is required'],
      });
    }

    const complaint = await updateComplaintStatus(
      parseInt(id),
      status,
      req.user.id,
      req.app.locals
    );

    return res.status(200).json({
      success: true,
      data: complaint,
      message: 'Complaint status updated successfully',
    });
  } catch (error) {
    console.error('[COMPLAINTS] Update status error:', error);

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message,
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message,
      });
    }

    if (error.message.includes('Invalid status')) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/voice/complaints/search
 * Search complaints by query
 */
async function search(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Search query must be at least 2 characters'],
      });
    }

    const complaints = await searchComplaints(query, req.user.id, req.app.locals);

    return res.status(200).json({
      success: true,
      data: complaints,
      count: complaints.length,
      message: 'Search completed successfully',
    });
  } catch (error) {
    console.error('[COMPLAINTS] Search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/voice/complaints/category/:category
 * Get complaints by category
 */
async function byCategory(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Category is required'],
      });
    }

    const complaints = await getComplaintsByCategory(category, req.user.id, req.app.locals);

    return res.status(200).json({
      success: true,
      data: complaints,
      count: complaints.length,
      message: 'Complaints retrieved successfully',
    });
  } catch (error) {
    console.error('[COMPLAINTS] Get by category error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/voice/complaints/stats
 * Get complaint statistics
 */
async function stats(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const statistics = await getComplaintStats(req.user.id, req.app.locals);

    return res.status(200).json({
      success: true,
      data: statistics,
      message: 'Statistics retrieved successfully',
    });
  } catch (error) {
    console.error('[COMPLAINTS] Get stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

module.exports = {
  createNewComplaint,
  listComplaints,
  getComplaint,
  updateStatus,
  search,
  byCategory,
  stats,
};
