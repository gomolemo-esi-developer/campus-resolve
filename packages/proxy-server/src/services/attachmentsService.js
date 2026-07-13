// Attachments Service - Business logic for file upload and storage
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Save attachment metadata to database
 * @param {number} messageId - Message ID
 * @param {Object} fileData - File data
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Created attachment record
 */
async function createAttachment(messageId, fileData, models) {
  try {
    const { Attachment, Message } = models;

    // Verify message exists
    const message = await Message.findByPk(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    const attachment = await Attachment.create({
      message_id: messageId,
      file_name: fileData.file_name,
      file_path: fileData.file_path,
      file_size: fileData.file_size,
      file_type: fileData.file_type,
      mime_type: fileData.mime_type,
      storage_key: fileData.storage_key,
    });

    return {
      id: attachment.id,
      file_name: attachment.file_name,
      file_size: attachment.file_size,
      file_type: attachment.file_type,
      created_at: attachment.created_at,
    };
  } catch (error) {
    throw new Error(`Failed to create attachment: ${error.message}`);
  }
}

/**
 * Get attachments for message
 * @param {number} messageId - Message ID
 * @param {number} userId - User ID (for permission check)
 * @param {Object} models - Database models
 * @returns {Promise<Array>} List of attachments
 */
async function getMessageAttachments(messageId, userId, models) {
  try {
    const { Attachment, Message, Complaint } = models;

    // Verify access
    const message = await Message.findByPk(messageId, {
      include: [{ model: Complaint, as: 'complaint' }],
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Check access (must be complaint filer or assigned staff)
    if (
      message.complaint.filed_by !== userId &&
      message.complaint.assigned_to !== userId
    ) {
      throw new Error('Unauthorized');
    }

    const attachments = await Attachment.findAll({
      where: { message_id: messageId },
      attributes: [
        'id',
        'file_name',
        'file_size',
        'file_type',
        'storage_key',
        'created_at',
      ],
    });

    return attachments;
  } catch (error) {
    throw new Error(`Failed to fetch attachments: ${error.message}`);
  }
}

/**
 * Get attachment by ID with permission check
 * @param {number} attachmentId - Attachment ID
 * @param {number} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Object>} Attachment details
 */
async function getAttachment(attachmentId, userId, models) {
  try {
    const { Attachment, Message, Complaint } = models;

    const attachment = await Attachment.findByPk(attachmentId, {
      include: [
        {
          model: Message,
          as: 'message',
          include: [{ model: Complaint, as: 'complaint' }],
        },
      ],
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Check access
    const complaint = attachment.message.complaint;
    if (complaint.filed_by !== userId && complaint.assigned_to !== userId) {
      throw new Error('Unauthorized');
    }

    return attachment;
  } catch (error) {
    throw new Error(`Failed to fetch attachment: ${error.message}`);
  }
}

/**
 * Delete attachment from database and storage
 * @param {number} attachmentId - Attachment ID
 * @param {number} userId - User ID
 * @param {Object} models - Database models
 * @param {string} uploadDir - Upload directory path
 * @returns {Promise<boolean>} Success flag
 */
async function deleteAttachment(attachmentId, userId, models, uploadDir) {
  try {
    const { Attachment, Message, Complaint } = models;

    const attachment = await Attachment.findByPk(attachmentId, {
      include: [
        {
          model: Message,
          as: 'message',
          include: [{ model: Complaint, as: 'complaint' }],
        },
      ],
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    // Check access (only message sender or staff can delete)
    const complaint = attachment.message.complaint;
    if (complaint.filed_by !== userId && complaint.assigned_to !== userId) {
      throw new Error('Unauthorized');
    }

    // Delete file from storage
    if (attachment.file_path && uploadDir) {
      const filePath = path.join(uploadDir, attachment.file_path);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn(`Failed to delete file: ${filePath}`, err);
        // Continue even if file deletion fails
      }
    }

    // Delete attachment record
    await attachment.destroy();

    return true;
  } catch (error) {
    throw new Error(`Failed to delete attachment: ${error.message}`);
  }
}

/**
 * Get attachments for complaint
 * @param {number} complaintId - Complaint ID
 * @param {number} userId - User ID
 * @param {Object} models - Database models
 * @returns {Promise<Array>} All attachments in complaint thread
 */
async function getComplaintAttachments(complaintId, userId, models) {
  try {
    const { Attachment, Message, Complaint } = models;

    // Verify access
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    if (complaint.filed_by !== userId && complaint.assigned_to !== userId) {
      throw new Error('Unauthorized');
    }

    const attachments = await Attachment.findAll({
      include: [
        {
          model: Message,
          as: 'message',
          where: { complaint_id: complaintId },
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return attachments;
  } catch (error) {
    throw new Error(`Failed to fetch attachments: ${error.message}`);
  }
}

/**
 * Generate unique storage key for file
 * @param {string} originalFileName - Original file name
 * @returns {string} Storage key
 */
function generateStorageKey(originalFileName) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalFileName);
  const name = path.basename(originalFileName, ext);
  return `${timestamp}-${random}${ext}`;
}

/**
 * Validate file upload
 * @param {Object} file - File object from request
 * @returns {Object} Validation result
 */
function validateFileUpload(file) {
  const errors = [];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }

  if (file.size > maxFileSize) {
    errors.push(`File size exceeds 10MB limit`);
  }

  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    errors.push(`File type not allowed: ${file.mimetype}`);
  }

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    errors.push(`File extension not allowed: ${ext}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get file type from mimetype
 * @param {string} mimetype - MIME type
 * @returns {string} File type category
 */
function getFileType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'pdf';
  if (
    mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    return 'document';
  }
  return 'file';
}

module.exports = {
  createAttachment,
  getMessageAttachments,
  getAttachment,
  deleteAttachment,
  getComplaintAttachments,
  generateStorageKey,
  validateFileUpload,
  getFileType,
};
