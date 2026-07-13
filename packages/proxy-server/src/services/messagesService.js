// Messages Service - Business logic for message operations
const { Op } = require('sequelize');

/**
 * Add message/reply to complaint
 * @param {number} complaintId - Complaint ID
 * @param {Object} messageData - Message details
 * @param {number} userId - User ID (sender)
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Created message
 */
async function addMessage(complaintId, messageData, userId, models) {
  try {
    const { Message, Complaint } = models;

    // Verify complaint exists and user has access
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Check access (filed by user or assigned to user)
    if (complaint.filed_by !== userId && complaint.assigned_to !== userId) {
      throw new Error('Unauthorized to add message');
    }

    const message = await Message.create({
      complaint_id: complaintId,
      sender_id: userId,
      content: messageData.content,
      subject: messageData.subject,
      message_type: messageData.type || 'reply',
    });

    return {
      id: message.id,
      complaint_id: message.complaint_id,
      sender_id: message.sender_id,
      content: message.content,
      subject: message.subject,
      created_at: message.created_at,
    };
  } catch (error) {
    throw new Error(`Failed to add message: ${error.message}`);
  }
}

/**
 * Get all messages for a complaint
 * @param {number} complaintId - Complaint ID
 * @param {number} userId - User ID (for permission check)
 * @param {Object} models - Database models
 * @returns {Promise<Array>} List of messages with sender info
 */
async function getComplaintMessages(complaintId, userId, models) {
  try {
    const { Message, Complaint, User } = models;

    // Verify complaint and access
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    if (complaint.filed_by !== userId && complaint.assigned_to !== userId) {
      throw new Error('Unauthorized to view messages');
    }

    const messages = await Message.findAll({
      where: { complaint_id: complaintId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    return messages;
  } catch (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }
}

/**
 * Get single message by ID
 * @param {number} messageId - Message ID
 * @param {number} userId - User ID (for permission check)
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Message details
 */
async function getMessage(messageId, userId, models) {
  try {
    const { Message, User, Complaint } = models;

    const message = await Message.findByPk(messageId, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
        {
          model: Complaint,
          as: 'complaint',
        },
      ],
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Check access
    if (message.complaint.filed_by !== userId && message.complaint.assigned_to !== userId) {
      throw new Error('Unauthorized to view message');
    }

    return message;
  } catch (error) {
    throw new Error(`Failed to fetch message: ${error.message}`);
  }
}

/**
 * Search messages in complaints
 * @param {string} searchQuery - Search query
 * @param {number} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Array>} Matching messages
 */
async function searchMessages(searchQuery, userId, models) {
  try {
    const { Message, Complaint } = models;

    const messages = await Message.findAll({
      include: [
        {
          model: Complaint,
          as: 'complaint',
          where: {
            [Op.or]: [
              { filed_by: userId },
              { assigned_to: userId },
            ],
          },
        },
      ],
      where: {
        [Op.or]: [
          { content: { [Op.iLike]: `%${searchQuery}%` } },
          { subject: { [Op.iLike]: `%${searchQuery}%` } },
        ],
      },
      order: [['created_at', 'DESC']],
    });

    return messages;
  } catch (error) {
    throw new Error(`Failed to search messages: ${error.message}`);
  }
}

/**
 * Get recent messages (thread view)
 * @param {number} complaintId - Complaint ID
 * @param {number} limit - Number of messages to return
 * @param {number} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Array>} Recent messages
 */
async function getRecentMessages(complaintId, limit = 10, userId, models) {
  try {
    const { Message, Complaint, User } = models;

    // Verify access
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    if (complaint.filed_by !== userId && complaint.assigned_to !== userId) {
      throw new Error('Unauthorized');
    }

    const messages = await Message.findAll({
      where: { complaint_id: complaintId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'role'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: Math.min(limit, 50),
    });

    return messages.reverse(); // Return in chronological order
  } catch (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }
}

/**
 * Get message count for complaint
 * @param {number} complaintId - Complaint ID
 * @param {Object} models - Database models
 * @returns {Promise<number>} Message count
 */
async function getMessageCount(complaintId, models) {
  try {
    const { Message } = models;

    const count = await Message.count({
      where: { complaint_id: complaintId },
    });

    return count;
  } catch (error) {
    throw new Error(`Failed to count messages: ${error.message}`);
  }
}

/**
 * Get message thread with pagination
 * @param {number} complaintId - Complaint ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Messages per page
 * @param {number} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Paginated messages
 */
async function getMessageThread(complaintId, page = 1, pageSize = 20, userId, models) {
  try {
    const { Message, Complaint, User } = models;

    // Verify access
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    if (complaint.filed_by !== userId && complaint.assigned_to !== userId) {
      throw new Error('Unauthorized');
    }

    const offset = (page - 1) * pageSize;

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { complaint_id: complaintId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
      ],
      order: [['created_at', 'ASC']],
      limit: pageSize,
      offset: offset,
    });

    return {
      messages,
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages: Math.ceil(count / pageSize),
      },
    };
  } catch (error) {
    throw new Error(`Failed to fetch thread: ${error.message}`);
  }
}

/**
 * Validate message data
 * @param {Object} data - Message data
 * @returns {Object} Validation result
 */
function validateMessage(data) {
  const errors = [];

  if (!data.content || typeof data.content !== 'string') {
    errors.push('Content is required and must be a string');
  } else if (data.content.length < 1) {
    errors.push('Content cannot be empty');
  }

  if (data.subject && typeof data.subject !== 'string') {
    errors.push('Subject must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  addMessage,
  getComplaintMessages,
  getMessage,
  searchMessages,
  getRecentMessages,
  getMessageCount,
  getMessageThread,
  validateMessage,
};
