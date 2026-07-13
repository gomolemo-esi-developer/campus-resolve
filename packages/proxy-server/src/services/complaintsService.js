// Complaints Service - Business logic for complaint operations
const { Op } = require('sequelize');

/**
 * Create new complaint
 * @param {Object} complaintData - Complaint details
 * @param {number} userId - User ID (filer)
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Created complaint
 */
async function createComplaint(complaintData, userId, models) {
  try {
    const { Complaint, Message } = models;

    const complaint = await Complaint.create({
      filed_by: userId,
      title: complaintData.title,
      description: complaintData.description,
      category: complaintData.category,
      status: 'open', // Default status
      current_level: 1,
      assigned_to: complaintData.assigned_to || null,
    });

    // Create initial message if provided
    if (complaintData.initialMessage) {
      await Message.create({
        complaint_id: complaint.id,
        sender_id: userId,
        content: complaintData.initialMessage,
        message_type: 'initial',
      });
    }

    return {
      id: complaint.id,
      title: complaint.title,
      category: complaint.category,
      status: complaint.status,
      current_level: complaint.current_level,
      created_at: complaint.created_at,
    };
  } catch (error) {
    throw new Error(`Failed to create complaint: ${error.message}`);
  }
}

/**
 * Get all complaints for a user
 * @param {number} userId - User ID
 * @param {Object} filters - Filter options
 * @param {Object} models - Database models
 * @returns {Promise<Array>} List of complaints
 */
async function getUserComplaints(userId, filters = {}, models) {
  try {
    const { Complaint } = models;

    const where = { filed_by: userId };

    // Apply status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Apply category filter
    if (filters.category) {
      where.category = filters.category;
    }

    // Apply date range filter
    if (filters.from_date || filters.to_date) {
      where.created_at = {};
      if (filters.from_date) {
        where.created_at[Op.gte] = new Date(filters.from_date);
      }
      if (filters.to_date) {
        where.created_at[Op.lte] = new Date(filters.to_date);
      }
    }

    const complaints = await Complaint.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    });

    return complaints;
  } catch (error) {
    throw new Error(`Failed to fetch complaints: ${error.message}`);
  }
}

/**
 * Get complaint by ID with full details
 * @param {number} complaintId - Complaint ID
 * @param {number} userId - User ID (for permission check)
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Complaint details with messages
 */
async function getComplaintDetail(complaintId, userId, models) {
  try {
    const { Complaint, Message, User } = models;

    const complaint = await Complaint.findByPk(complaintId, {
      include: [
        {
          model: Message,
          as: 'messages',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
            },
          ],
          order: [['created_at', 'ASC']],
        },
        {
          model: User,
          as: 'filer',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
      ],
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Permission check: user can only view their own complaints
    if (complaint.filed_by !== userId) {
      throw new Error('Unauthorized to view this complaint');
    }

    return complaint;
  } catch (error) {
    throw new Error(`Failed to fetch complaint: ${error.message}`);
  }
}

/**
 * Update complaint status
 * @param {number} complaintId - Complaint ID
 * @param {string} newStatus - New status
 * @param {number} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Updated complaint
 */
async function updateComplaintStatus(complaintId, newStatus, userId, models) {
  try {
    const { Complaint } = models;

    const complaint = await Complaint.findByPk(complaintId);

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Check permissions
    if (complaint.filed_by !== userId && complaint.assigned_to !== userId) {
      throw new Error('Unauthorized to update this complaint');
    }

    // Validate status
    const validStatuses = ['open', 'in_progress', 'escalated', 'resolved', 'closed'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    await complaint.update({ status: newStatus });

    return {
      id: complaint.id,
      status: complaint.status,
      updated_at: complaint.updated_at,
    };
  } catch (error) {
    throw new Error(`Failed to update complaint: ${error.message}`);
  }
}

/**
 * Search complaints
 * @param {string} searchQuery - Search query
 * @param {number} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Array>} Matching complaints
 */
async function searchComplaints(searchQuery, userId, models) {
  try {
    const { Complaint } = models;

    const complaints = await Complaint.findAll({
      where: {
        filed_by: userId,
        [Op.or]: [
          { title: { [Op.iLike]: `%${searchQuery}%` } },
          { description: { [Op.iLike]: `%${searchQuery}%` } },
        ],
      },
      order: [['created_at', 'DESC']],
    });

    return complaints;
  } catch (error) {
    throw new Error(`Failed to search complaints: ${error.message}`);
  }
}

/**
 * Get complaints by category
 * @param {string} category - Category name
 * @param {number} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Array>} Complaints in category
 */
async function getComplaintsByCategory(category, userId, models) {
  try {
    const { Complaint } = models;

    const complaints = await Complaint.findAll({
      where: {
        filed_by: userId,
        category: category,
      },
      order: [['created_at', 'DESC']],
    });

    return complaints;
  } catch (error) {
    throw new Error(`Failed to fetch complaints: ${error.message}`);
  }
}

/**
 * Get complaint statistics
 * @param {number} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Statistics
 */
async function getComplaintStats(userId, models) {
  try {
    const { Complaint } = models;

    const total = await Complaint.count({ where: { filed_by: userId } });
    const open = await Complaint.count({
      where: { filed_by: userId, status: 'open' },
    });
    const inProgress = await Complaint.count({
      where: { filed_by: userId, status: 'in_progress' },
    });
    const resolved = await Complaint.count({
      where: { filed_by: userId, status: 'resolved' },
    });

    return {
      total,
      open,
      in_progress: inProgress,
      resolved,
      closed: total - open - inProgress - resolved,
    };
  } catch (error) {
    throw new Error(`Failed to fetch statistics: ${error.message}`);
  }
}

/**
 * Validate complaint creation data
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
function validateComplaintCreation(data) {
  const errors = [];

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required and must be a string');
  } else if (data.title.length < 5) {
    errors.push('Title must be at least 5 characters');
  }

  if (!data.description || typeof data.description !== 'string') {
    errors.push('Description is required and must be a string');
  } else if (data.description.length < 20) {
    errors.push('Description must be at least 20 characters');
  }

  if (!data.category || typeof data.category !== 'string') {
    errors.push('Category is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  createComplaint,
  getUserComplaints,
  getComplaintDetail,
  updateComplaintStatus,
  searchComplaints,
  getComplaintsByCategory,
  getComplaintStats,
  validateComplaintCreation,
};
