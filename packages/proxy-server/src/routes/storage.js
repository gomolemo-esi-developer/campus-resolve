// Storage Routes - S3 presigned URL upload/download
const express = require('express');
const {
  getUploadUrl,
  confirmUpload,
  getDownloadUrl,
  getDownloadUrlByKey,
  deleteFile,
} = require('../controllers/storageController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * All storage routes require authentication
 */
router.use(authMiddleware);

/**
 * POST /api/storage/upload-url
 * Generate a presigned S3 upload URL
 * Requires: Authorization header with Bearer token
 * Body: { fileName, contentType, context, contextId }
 */
router.post('/upload-url', getUploadUrl);

/**
 * POST /api/storage/confirm-upload
 * Confirm upload and record attachment metadata
 * Requires: Authorization header with Bearer token
 * Body: { key, fileName, fileSize, fileType, mimeType, context, contextId, messageId? }
 */
router.post('/confirm-upload', confirmUpload);

/**
 * GET /api/storage/download-url/:attachmentId
 * Generate a presigned S3 download URL
 * Requires: Authorization header with Bearer token
 * Params: { attachmentId }
 */
router.get('/download-url/:attachmentId', getDownloadUrl);

/**
 * GET /api/storage/download-url/key/:storageKey
 * Generate a presigned S3 download URL using storage key directly
 * Requires: Authorization header with Bearer token
 * Params: { storageKey }
 */
router.get('/download-url/key/:storageKey', getDownloadUrlByKey);

/**
 * DELETE /api/storage/:attachmentId
 * Delete file from S3 and database
 * Requires: Authorization header with Bearer token
 * Params: { attachmentId }
 */
router.delete('/:attachmentId', deleteFile);

module.exports = router;
