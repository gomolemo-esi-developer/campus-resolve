// Storage Controller - Route handlers for S3 presigned URL upload/download

const {
  generateUploadUrl,
  generateDownloadUrl,
  deleteObject,
  buildObjectKey,
} = require('../services/s3StorageService');
const supabaseService = require('../services/supabaseService');

const allowedMimeTypes = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/heic',
  'image/heif',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain',
  'text/csv',
];

/**
 * POST /api/storage/upload-url
 * Body: { fileName, contentType, context: 'complaint'|'note', contextId }
 * Returns: { uploadUrl, key, expiresIn }
 */
async function getUploadUrl(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { fileName, contentType, context, contextId } = req.body;

    console.log('[STORAGE] upload-url request:', { fileName, contentType, context, contextId, user: req.user });

    if (!fileName || !contentType || !context || !contextId) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['fileName, contentType, context, and contextId are required'],
      });
    }

  if (!['complaint', 'note', 'staff', 'student'].includes(context)) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: ['context must be "complaint", "note", "staff", or "student"'],
    });
  }

    if (!allowedMimeTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: [`File type not allowed: ${contentType}`],
      });
    }

    const key = buildObjectKey(context, contextId, fileName);
    const expiresIn = 300;
    const { uploadUrl } = await generateUploadUrl(key, contentType, expiresIn);

    return res.status(200).json({
      success: true,
      data: { uploadUrl, key, expiresIn },
      message: 'Upload URL generated successfully',
    });
  } catch (error) {
    console.error('[STORAGE] Upload URL error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * POST /api/storage/confirm-upload
 * Body: { key, fileName, fileSize, fileType, mimeType, context, contextId, messageId? }
 * Records the attachment metadata in the DB
 * Returns: { attachment }
 */
async function confirmUpload(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

  const { key, fileName, fileSize, fileType, mimeType, context, contextId, messageId } = req.body;

  if (!key || !fileName || !fileSize || !fileType || !mimeType || !context || !contextId) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: ['key, fileName, fileSize, fileType, mimeType, context, and contextId are required'],
    });
  }

  // Profile images for staff/students: no attachment record needed
  if (context === 'staff' || context === 'student') {
    try {
      // Generate a presigned GET URL (valid for 7 days) for immediate display
      const presignedUrl = await generateDownloadUrl(key, 604800);
      return res.status(201).json({
        success: true,
        data: { key, s3Url: presignedUrl },
        message: 'Profile image uploaded successfully',
      });
    } catch (err) {
      console.error('[STORAGE] Error generating presigned URL for profile image:', err);
      // Still acknowledge upload success even if presign fails
      return res.status(201).json({
        success: true,
        data: { key },
        message: 'Profile image uploaded',
      });
    }
  }

  if (!['complaint', 'note'].includes(context)) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: ['context must be "complaint" or "note"'],
    });
  }

  const record = {
    file_name: fileName,
    file_path: key,
    file_size: fileSize,
    file_type: fileType,
    mime_type: mimeType,
    storage_key: key,
  };

  if (messageId) {
    record.complaint_message_id = messageId;
  }

if (context === 'note') {
    // Only set note_id if contextId is a valid UUID
    // Skip for 'general' placeholder used when no specific note is associated
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(contextId)) {
      record.note_id = contextId;
    }
    // If contextId is 'general' or not a valid UUID, we don't set note_id
    // The file will still be recorded in attachments but not linked to a specific note
  }

   const attachment = await supabaseService.create('attachments', record);

   // Generate presigned URL for immediate use (image previews, downloads)
   let s3Url = null;
   try {
     s3Url = await generateDownloadUrl(key);
   } catch (s3Error) {
     console.error('[STORAGE] Failed to generate presigned URL for confirm-upload:', s3Error.message);
   }

   return res.status(201).json({
     success: true,
     data: {
       ...attachment,
       s3Url,
     },
     message: 'Attachment recorded successfully',
   });
 } catch (error) {
   console.error('[STORAGE] Confirm upload error:', error);
   return res.status(500).json({
     success: false,
     error: 'Internal server error',
     message: error.message,
   });
 }
}

/**
 * GET /api/storage/download-url/:attachmentId
 * Looks up attachment by ID, returns presigned download URL
 * Returns: { downloadUrl, fileName, fileSize }
 */
async function getDownloadUrl(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { attachmentId } = req.params;

    if (!attachmentId) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Attachment ID is required'],
      });
    }

    let attachment;
    let isQuickItem = false;
    
    // Try attachments table first
    try {
      attachment = await supabaseService.findById('attachments', attachmentId);
    } catch (dbError) {
      // Fall back to quick_items for file items
      try {
        const quickItem = await supabaseService.findById('quick_items', attachmentId);
        if (quickItem && quickItem.content_type === 'file') {
          attachment = {
            id: quickItem.id,
            file_name: quickItem.file_name || quickItem.title || 'Unknown file',
            file_size: quickItem.file_size || 0,
            storage_key: quickItem.storage_key,
            file_type: quickItem.file_type,
          };
          isQuickItem = true;
        }
      } catch (quickError) {
        // Both lookups failed - check for mock data in dev mode
        if (req.user?.source === 'dev-mode') {
          const mockAttachments = {
            'att-1': { id: 'att-1', file_name: 'document.pdf', file_size: 2048, file_type: 'pdf' },
            'att-2': { id: 'att-2', file_name: 'issue-screenshot.png', file_size: 4096, file_type: 'image' },
          };
          const mockQuickItems = {
            '0b2457d1-6249-408f-bc70-9837013810f9': { id: '0b2457d1-6249-408f-bc70-9837013810f9', file_name: 'test-document.pdf', file_size: 1024, file_type: 'pdf', storage_key: 'mock/test-document.pdf' },
            'item-3': { id: 'item-3', file_name: 'Complaint_Statistics_March.pdf', file_size: 2048000, file_type: 'pdf', storage_key: 'mock-storage-key/item-3/Complaint_Statistics_March.pdf' },
          };
          attachment = mockAttachments[attachmentId] || mockQuickItems[attachmentId];
          if (attachment) {
            isQuickItem = !!mockQuickItems[attachmentId];
          }
        }
        if (!attachment) {
          throw dbError;
        }
      }
    }

    // Check storage key for valid S3 path
    let s3Key = attachment.storage_key || attachment.file_path;
    if (!s3Key || typeof s3Key !== 'string' || s3Key.startsWith('blob:') || s3Key.startsWith('data:')) {
      // Try to find in quick_items (file items) if no storage_key
      try {
        const quickItem = await supabaseService.findById('quick_items', attachmentId);
        if (quickItem && quickItem.content_type === 'file' && quickItem.storage_key) {
          attachment = {
            id: quickItem.id,
            file_name: quickItem.file_name || quickItem.title || 'Unknown file',
            file_size: quickItem.file_size || 0,
            storage_key: quickItem.storage_key,
            file_type: quickItem.file_type,
          };
          s3Key = quickItem.storage_key;
        }
      } catch (quickError) {
        // quick_items lookup failed, continue
      }
    }

    // If still no valid storage key, check for mock in dev mode
    if (!s3Key || typeof s3Key !== 'string' || s3Key.startsWith('blob:') || s3Key.startsWith('data:')) {
      if (req.user?.source === 'dev-mode') {
        return res.status(200).json({
          success: true,
          data: {
            downloadUrl: `/api/storage/mock-download/${attachmentId}/${encodeURIComponent(attachment.file_name || 'file')}`,
            fileName: attachment.file_name || 'Unknown file',
            fileSize: attachment.file_size || 0,
          },
          message: 'Download URL generated successfully (mock mode)',
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Attachment has no valid storage key or file path',
      });
    }

    const downloadUrl = await generateDownloadUrl(s3Key);

    return res.status(200).json({
      success: true,
      data: {
        downloadUrl,
        fileName: attachment.file_name,
        fileSize: attachment.file_size,
      },
      message: 'Download URL generated successfully',
    });
  } catch (error) {
    console.error('[STORAGE] Download URL error:', error);

    if (error.message && error.message.includes('not found')) {
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
 * DELETE /api/storage/:attachmentId
 * Deletes from S3 + DB
 */
async function deleteFile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { attachmentId } = req.params;

    if (!attachmentId) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Attachment ID is required'],
      });
    }

    const attachment = await supabaseService.findById('attachments', attachmentId);

    await deleteObject(attachment.storage_key);
    await supabaseService.delete('attachments', attachmentId);

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('[STORAGE] Delete error:', error);

    if (error.message && error.message.includes('not found')) {
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
 * GET /api/storage/download-url/key/:storageKey
 * Generate a presigned S3 download URL using storage key directly
 * Returns: { downloadUrl }
 */
async function getDownloadUrlByKey(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    const { storageKey } = req.params;

    if (!storageKey) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Storage key is required'],
      });
    }

    // Handle mock mode - storage keys starting with 'mock/' or 'mock-storage-key/'
    if (req.user?.source === 'dev-mode' && (storageKey.startsWith('mock/') || storageKey.startsWith('mock-storage-key/'))) {
      return res.status(200).json({
        success: true,
        data: { downloadUrl: `/api/storage/mock-download/key/${encodeURIComponent(storageKey)}` },
        message: 'Download URL generated successfully (mock mode)',
      });
    }

    const downloadUrl = await generateDownloadUrl(decodeURIComponent(storageKey));

    return res.status(200).json({
      success: true,
      data: { downloadUrl },
      message: 'Download URL generated successfully',
    });
  } catch (error) {
    console.error('[STORAGE] Download URL by key error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

module.exports = {
  getUploadUrl,
  confirmUpload,
  getDownloadUrl,
  getDownloadUrlByKey,
  deleteFile,
};
