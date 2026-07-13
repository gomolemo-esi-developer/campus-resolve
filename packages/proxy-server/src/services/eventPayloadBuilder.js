/**
 * Event Payload Builder
 * 
 * Helper functions to build normalized event payloads for real-time notifications.
 */

/**
 * Build a complaint event payload
 * 
 * @param {object} complaint - The complaint object
 * @returns {object} - The normalized event payload
 */
function buildComplaintEvent(complaint) {
  return {
    id: complaint.id,
    title: complaint.title,
    category: complaint.category,
    status: complaint.status,
    createdAt: complaint.created_at,
    updatedAt: complaint.updated_at,
    createdBy: complaint.user_id,
  };
}

/**
 * Build a message event payload
 * 
 * @param {object} message - The message object
 * @param {string} complaintId - The complaint ID
 * @returns {object} - The normalized event payload
 */
function buildMessageEvent(message, complaintId) {
  return {
    id: message.id,
    complaintId,
    content: message.content,
    title: message.title,
    senderId: message.sender_id,
    senderRole: message.sender_role,
    createdAt: message.created_at,
    hasAttachments: message.attachments && message.attachments.length > 0,
  };
}

/**
 * Build a note event payload
 * 
 * @param {object} note - The quick note object
 * @returns {object} - The normalized event payload
 */
function buildNoteEvent(note) {
  return {
    id: note.id,
    subject: note.subject,
    description: note.description,
    type: note.type,
    userId: note.user_id,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

/**
 * Build a profile event payload
 * 
 * @param {object} profile - The profile object
 * @returns {object} - The normalized event payload
 */
function buildProfileEvent(profile) {
  return {
    id: profile.id,
    userId: profile.user_id,
    role: profile.role,
    firstName: profile.first_name,
    lastName: profile.last_name,
    updatedAt: profile.updated_at,
  };
}

/**
 * Build an attachment event payload
 * 
 * @param {object} attachment - The attachment object
 * @param {string} relatedId - The related complaint or note ID
 * @param {string} type - The type ('complaint' or 'note')
 * @returns {object} - The normalized event payload
 */
function buildAttachmentEvent(attachment, relatedId, type) {
  return {
    id: attachment.id,
    name: attachment.name,
    type: attachment.type,
    size: attachment.size,
    relatedId,
    relatedType: type,
    createdAt: attachment.created_at,
  };
}

/**
 * Build a status change event payload
 * 
 * @param {object} complaint - The complaint object
 * @param {string} oldStatus - The previous status
 * @param {string} newStatus - The new status
 * @param {string} changedBy - The user who changed the status
 * @returns {object} - The normalized event payload
 */
function buildStatusChangeEvent(complaint, oldStatus, newStatus, changedBy) {
  return {
    id: complaint.id,
    title: complaint.title,
    oldStatus,
    newStatus,
    changedBy,
    changedAt: new Date().toISOString(),
  };
}

module.exports = {
  buildComplaintEvent,
  buildMessageEvent,
  buildNoteEvent,
  buildProfileEvent,
  buildAttachmentEvent,
  buildStatusChangeEvent,
};