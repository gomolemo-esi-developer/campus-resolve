// Attachments Controller - Route handlers for file upload/download endpoints

const {
  createAttachment,
  getMessageAttachments,
  getAttachment,
  deleteAttachment,
  getComplaintAttachments,
  generateStorageKey,
  validateFileUpload,
  getFileType,
} = require('../services/attachmentsService');

const path = require('path');
const fs = require('fs').promises;

/**
 * POST /api/voice/messages/:messageId/attachments
 * Upload attachment to message
 */
async function uploadAttachment(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { messageId } = req.params;

    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Valid message ID required'],
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['No file provided'],
      });
    }

    // Validate file
    const validation = validateFileUpload(req.file);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    // Generate storage key
    const storageKey = generateStorageKey(req.file.originalname);

    // Create attachment record
    const attachment = await createAttachment(
      parseInt(messageId),
      {
        file_name: req.file.originalname,
        file_path: path.join('messages', messageId.toString(), storageKey),
        file_size: req.file.size,
        file_type: getFileType(req.file.mimetype),
        mime_type: req.file.mimetype,
        storage_key: storageKey,
      },
      req.app.locals
    );

    return res.status(201).json({
      success: true,
      data: attachment,
      message: 'Attachment uploaded successfully',
    });
  } catch (error) {
    console.error('[ATTACHMENTS] Upload error:', error);

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
 * GET /api/voice/messages/:messageId/attachments
 * Get all attachments for message
 */
async function listMessageAttachments(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { messageId } = req.params;

    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Valid message ID required'],
      });
    }

    const attachments = await getMessageAttachments(
      parseInt(messageId),
      req.user.id,
      req.app.locals
    );

    return res.status(200).json({
      success: true,
      data: attachments,
      count: attachments.length,
      message: 'Attachments retrieved successfully',
    });
  } catch (error) {
    console.error('[ATTACHMENTS] List error:', error);

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
 * GET /api/voice/complaints/:complaintId/attachments
 * Get all attachments for complaint thread
 */
async function listComplaintAttachments(req, res) {
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

    const attachments = await getComplaintAttachments(
      parseInt(complaintId),
      req.user.id,
      req.app.locals
    );

    return res.status(200).json({
      success: true,
      data: attachments,
      count: attachments.length,
      message: 'Attachments retrieved successfully',
    });
  } catch (error) {
    console.error('[ATTACHMENTS] List complaint attachments error:', error);

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
 * GET /api/voice/attachments/:attachmentId/download
 * Download attachment
 */
async function downloadAttachment(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { attachmentId } = req.params;

    if (!attachmentId || isNaN(attachmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Valid attachment ID required'],
      });
    }

    const attachment = await getAttachment(parseInt(attachmentId), req.user.id, req.app.locals);

    // In production, implement actual file download
    // For now, return attachment details
    return res.status(200).json({
      success: true,
      data: {
        id: attachment.id,
        file_name: attachment.file_name,
        file_size: attachment.file_size,
        file_type: attachment.file_type,
        message: 'Use storage_key to download file',
      },
    });
  } catch (error) {
    console.error('[ATTACHMENTS] Download error:', error);

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
 * DELETE /api/voice/attachments/:attachmentId
 * Delete attachment
 */
async function removeAttachment(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { attachmentId } = req.params;

    if (!attachmentId || isNaN(attachmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Valid attachment ID required'],
      });
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const success = await deleteAttachment(
      parseInt(attachmentId),
      req.user.id,
      req.app.locals,
      uploadDir
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete attachment',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('[ATTACHMENTS] Delete error:', error);

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

module.exports = {
  uploadAttachment,
  listMessageAttachments,
  listComplaintAttachments,
  downloadAttachment,
  removeAttachment,
};
