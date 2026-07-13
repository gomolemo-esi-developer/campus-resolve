// S3 Storage Service - Presigned URL generation for client-side upload/download

const crypto = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const BUCKET = process.env.AWS_S3_BUCKET;
const REGION = process.env.AWS_REGION || 'us-east-2';

/**
 * Get the public S3 URL (non-presigned) for direct access
 * @param {string} key - S3 object key
 * @returns {string} public URL
 */
function getPublicUrl(key) {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

let s3Client = null;

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({ region: REGION });
  }
  return s3Client;
}

/**
 * Generate a presigned PUT URL for client-side upload
 * @param {string} key - S3 object key (e.g. "attachments/complaints/{complaintId}/{uuid}.pdf")
 * @param {string} contentType - MIME type
 * @param {number} expiresIn - seconds (default 300)
 * @returns {Promise<{uploadUrl: string, key: string}>}
 */
async function generateUploadUrl(key, contentType, expiresIn = 300) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn });

  return { uploadUrl, key };
}

/**
 * Generate a presigned GET URL for download
 * @param {string} key - S3 object key
 * @param {number} expiresIn - seconds (default 3600)
 * @returns {Promise<string>}
 */
async function generateDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: 'attachment',
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

/**
 * Delete an object from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
async function deleteObject(key) {
  if (!key) {
    console.warn('[S3Storage] No key provided for deletion, skipping');
    return;
  }
  
  if (!BUCKET) {
    console.error('[S3Storage] AWS_S3_BUCKET not configured, cannot delete');
    return;
  }
  
  try {
    console.log('[S3Storage] Deleting object with key:', key, 'from bucket:', BUCKET);
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    await getS3Client().send(command);
    console.log('[S3Storage] Successfully deleted object:', key);
  } catch (error) {
    console.error('[S3Storage] Failed to delete object:', key, 'Error:', error.message);
    // Don't throw - S3 deletion failure should not block DB deletion
  }
}

/**
 * Build a namespaced S3 key
 * @param {'complaint'|'note'} context - what the attachment belongs to
 * @param {string} contextId - complaint or note ID
 * @param {string} fileName - original file name
 * @returns {string} key like "attachments/complaints/{id}/{uuid}-{fileName}"
 */
function buildObjectKey(context, contextId, fileName) {
  const uuid = crypto.randomUUID();

  if (context === 'complaint') {
    return `attachments/complaints/${contextId}/${uuid}-${fileName}`;
  }
  if (context === 'note') {
    return `attachments/notes/${contextId}/${uuid}-${fileName}`;
  }
  // Handle profile images for staff and students
  if (context === 'staff' || context === 'student') {
    return `attachments/profiles/${context}/${contextId}/${uuid}-${fileName}`;
  }

  // Fallback for any other context
  return `attachments/${context}/${contextId}/${uuid}-${fileName}`;
}

module.exports = {
  generateUploadUrl,
  generateDownloadUrl,
  deleteObject,
  buildObjectKey,
  getPublicUrl,
};
