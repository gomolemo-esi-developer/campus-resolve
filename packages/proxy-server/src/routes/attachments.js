// Attachments Routes
const express = require('express');
const multer = require('multer');
const {
  uploadAttachment,
  listMessageAttachments,
  listComplaintAttachments,
  downloadAttachment,
  removeAttachment,
} = require('../controllers/attachmentsController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory before processing
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Basic file type validation at multer level
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`), false);
    }
  },
});

/**
 * All attachment routes require authentication
 */
router.use(authMiddleware);

/**
 * POST /api/voice/messages/:messageId/attachments
 * Upload attachment to message
 * Requires: Authorization header with Bearer token
 * Params: { messageId: number }
 * Body: FormData with 'file' field
 */
router.post('/:messageId/attachments', upload.single('file'), uploadAttachment);

/**
 * GET /api/voice/messages/:messageId/attachments
 * Get all attachments for message
 * Requires: Authorization header with Bearer token
 * Params: { messageId: number }
 */
router.get('/:messageId/attachments', listMessageAttachments);

/**
 * GET /api/voice/complaints/:complaintId/attachments
 * Get all attachments for complaint thread
 * Requires: Authorization header with Bearer token
 * Params: { complaintId: number }
 */
router.get('/complaints/:complaintId/attachments', listComplaintAttachments);

/**
 * GET /api/voice/attachments/:attachmentId/download
 * Download attachment
 * Requires: Authorization header with Bearer token
 * Params: { attachmentId: number }
 */
router.get('/attachments/:attachmentId/download', downloadAttachment);

/**
 * DELETE /api/voice/attachments/:attachmentId
 * Delete attachment
 * Requires: Authorization header with Bearer token
 * Params: { attachmentId: number }
 */
router.delete('/attachments/:attachmentId', removeAttachment);

module.exports = router;
