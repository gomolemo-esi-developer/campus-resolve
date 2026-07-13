/**
 * Campus Voice Hooks Export
 * All custom hooks for API operations and utilities
 */

// API Hooks
export { useApiClient } from './useApiClient';
export type { ApiResponse, ApiError } from './useApiClient';

export { useComplaints } from './useComplaints';
export type {
  Complaint,
  ComplaintType,
  ComplaintResponse,
  Message,
  Attachment,
} from './useComplaints';

export { useProfile } from './useProfile';
export type { StudentProfile } from './useProfile';

export { useMessages } from './useMessages';
export type { ComplaintMessage, MessageAttachment, AttachmentPayload } from './useMessages';

// Utility Hooks
export { useToast } from './use-toast';
export { useIsMobile } from './use-mobile';
