// Messages Controller - Route handlers for message endpoints

const {
  addMessage,
  getComplaintMessages,
  getMessage,
  searchMessages,
  getRecentMessages,
  getMessageCount,
  getMessageThread,
  validateMessage,
} = require('../services/messagesService');

/**
 * POST /api/voice/messages/:complaintId/reply
 * Add message/reply to complaint
 */
async function createMessage(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { complaintId } = req.params;

    if (!complaintId || isNaN(complaintId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Valid complaint ID required'],
      });
    }

    // Validate message data
    const validation = validateMessage(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const message = await addMessage(
      parseInt(complaintId),
      req.body,
      req.user.id,
      req.app.locals
    );

    return res.status(201).json({
      success: true,
      data: message,
      message: 'Message created successfully',
    });
  } catch (error) {
    console.error('[MESSAGES] Create message error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message,
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
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
 * GET /api/voice/messages/:complaintId
 * Get all messages for complaint
 */
async function listMessages(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { complaintId } = req.params;

    if (!complaintId || isNaN(complaintId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Valid complaint ID required'],
      });
    }

    const messages = await getComplaintMessages(
      parseInt(complaintId),
      req.user.id,
      req.app.locals
    );

    return res.status(200).json({
      success: true,
      data: messages,
      count: messages.length,
      message: 'Messages retrieved successfully',
    });
  } catch (error) {
    console.error('[MESSAGES] List messages error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message,
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
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
 * GET /api/voice/messages/:id/detail
 * Get single message by ID
 */
async function getMessageDetail(req, res) {
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
        details: ['Valid message ID required'],
      });
    }

    const message = await getMessage(parseInt(id), req.user.id, req.app.locals);

    return res.status(200).json({
      success: true,
      data: message,
      message: 'Message retrieved successfully',
    });
  } catch (error) {
    console.error('[MESSAGES] Get message error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message,
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
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
 * GET /api/voice/messages/search?query=
 * Search messages
 */
async function searchMessagesHandler(req, res) {
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

    const messages = await searchMessages(query, req.user.id, req.app.locals);

    return res.status(200).json({
      success: true,
      data: messages,
      count: messages.length,
      message: 'Search completed successfully',
    });
  } catch (error) {
    console.error('[MESSAGES] Search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/voice/messages/:complaintId/recent
 * Get recent messages from complaint thread
 */
async function getRecent(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { complaintId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    if (!complaintId || isNaN(complaintId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Valid complaint ID required'],
      });
    }

    const messages = await getRecentMessages(
      parseInt(complaintId),
      limit,
      req.user.id,
      req.app.locals
    );

    return res.status(200).json({
      success: true,
      data: messages,
      count: messages.length,
      message: 'Recent messages retrieved successfully',
    });
  } catch (error) {
    console.error('[MESSAGES] Get recent error:', error);

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
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
 * GET /api/voice/messages/:complaintId/count
 * Get message count for complaint
 */
async function getCount(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { complaintId } = req.params;

    if (!complaintId || isNaN(complaintId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Valid complaint ID required'],
      });
    }

    const count = await getMessageCount(parseInt(complaintId), req.app.locals);

    return res.status(200).json({
      success: true,
      data: { count },
      message: 'Message count retrieved successfully',
    });
  } catch (error) {
    console.error('[MESSAGES] Get count error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/voice/messages/:complaintId/thread?page=1&pageSize=20
 * Get message thread with pagination
 */
async function getThread(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { complaintId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;

    if (!complaintId || isNaN(complaintId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Valid complaint ID required'],
      });
    }

    const result = await getMessageThread(
      parseInt(complaintId),
      page,
      pageSize,
      req.user.id,
      req.app.locals
    );

    return res.status(200).json({
      success: true,
      data: result.messages,
      pagination: result.pagination,
      message: 'Thread retrieved successfully',
    });
  } catch (error) {
    console.error('[MESSAGES] Get thread error:', error);

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
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

module.exports = {
  createMessage,
  listMessages,
  getMessageDetail,
  searchMessagesHandler,
  getRecent,
  getCount,
  getThread,
};
