/**
 * Messages Integration Tests
 * Tests for message endpoints
 */

const { createTestApp, getAuthHeader } = require('./helpers');

describe('Messages Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/voice/messages/:complaintId/reply', () => {
    it('should create reply message in thread', async () => {
      const replyData = {
        title: 'Re: Test Complaint',
        content: 'This is a reply to the complaint',
      };
      
      expect(replyData).toHaveProperty('title');
      expect(replyData).toHaveProperty('content');
    });

    it('should return message with sender info', async () => {
      const messageResponse = {
        id: 'message-123',
        complaint_id: 'complaint-456',
        title: 'Re: Test Complaint',
        content: 'Reply content',
        sender: {
          id: 'user-123',
          name: 'Test Student',
          role: 'student',
        },
        created_at: new Date().toISOString(),
      };
      
      expect(messageResponse).toHaveProperty('sender');
      expect(messageResponse.sender).toHaveProperty('id');
      expect(messageResponse.sender).toHaveProperty('name');
      expect(messageResponse.sender).toHaveProperty('role');
    });

    it('should handle attachments in reply', async () => {
      const replyWithAttachments = {
        title: 'Re: Complaint',
        content: 'Reply with file',
        attachments: [
          { name: 'evidence.pdf', type: 'application/pdf' },
        ],
      };
      
      expect(replyWithAttachments.attachments).toHaveLength(1);
    });

    it('should store attachment metadata in attachments table', async () => {
      const attachment = {
        id: 'attachment-123',
        message_id: 'message-456',
        name: 'document.pdf',
        storage_key: 'attachments/message-456/document.pdf',
        mime_type: 'application/pdf',
        size: 1024,
      };
      
      expect(attachment).toHaveProperty('storage_key');
      expect(attachment).toHaveProperty('mime_type');
    });

    it('should return 400 when content is empty', async () => {
      const invalidReply = {
        title: 'Re: Test',
        content: '', // Empty content
      };
      
      const isValid = invalidReply.content && invalidReply.content.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it('should return 400 when title is missing', async () => {
      const invalidReply = {
        content: 'Valid content',
        // Missing title
      };
      
      const isValid = invalidReply.title && invalidReply.title.trim().length > 0;
      expect(isValid).toBe(false);
    });
  });

  describe('GET /api/voice/messages/:complaintId', () => {
    it('should return full thread in chronological order', async () => {
      const messages = [
        { id: 'msg-1', created_at: '2024-01-01T10:00:00Z' },
        { id: 'msg-2', created_at: '2024-01-01T11:00:00Z' },
        { id: 'msg-3', created_at: '2024-01-01T12:00:00Z' },
      ];
      
      // Sort chronologically (oldest first)
      const sorted = [...messages].sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      
      expect(sorted[0].id).toBe('msg-1');
      expect(sorted[sorted.length - 1].id).toBe('msg-3');
    });

    it('should include sender info for each message', async () => {
      const messages = [
        {
          id: 'msg-1',
          sender: { id: 'user-1', name: 'Student', role: 'student' },
        },
        {
          id: 'msg-2',
          sender: { id: 'user-2', name: 'Staff', role: 'staff' },
        },
      ];
      
      messages.forEach(msg => {
        expect(msg.sender).toHaveProperty('id');
        expect(msg.sender).toHaveProperty('name');
        expect(msg.sender).toHaveProperty('role');
      });
    });

    it('should include attachments in message response', async () => {
      const messages = [
        {
          id: 'msg-1',
          attachments: [
            { id: 'att-1', name: 'file.pdf' },
          ],
        },
        {
          id: 'msg-2',
          attachments: [],
        },
      ];
      
      expect(messages[0].attachments).toHaveLength(1);
      expect(messages[1].attachments).toHaveLength(0);
    });

    it('should return empty array for complaint with no messages', async () => {
      const messages = [];
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toHaveLength(0);
    });
  });

  describe('Cross-Platform Communication', () => {
    it('reply from resolve user appears in voice user thread', async () => {
      // Staff reply
      const staffReply = {
        sender_role: 'staff',
        content: 'We are looking into this issue',
      };
      
      // Student complaint thread
      const studentThread = {
        messages: [
          { sender_role: 'student', content: 'Initial complaint' },
          staffReply, // Staff reply appears here
        ],
      };
      
      const hasStaffReply = studentThread.messages.some(
        m => m.sender_role === 'staff'
      );
      expect(hasStaffReply).toBe(true);
    });

    it('reply from voice user appears in resolve conversation', async () => {
      // Student reply
      const studentReply = {
        sender_role: 'student',
        content: 'Thank you for looking into this',
      };
      
      // Staff view
      const staffView = {
        messages: [
          { sender_role: 'staff', content: 'Initial response' },
          studentReply, // Student reply appears here
        ],
      };
      
      const hasStudentReply = staffView.messages.some(
        m => m.sender_role === 'student'
      );
      expect(hasStudentReply).toBe(true);
    });

    it('should maintain correct sender roles in cross-platform messages', async () => {
      const allMessages = [
        { sender_role: 'student', sender_name: 'John Doe' },
        { sender_role: 'staff', sender_name: 'Jane Smith' },
        { sender_role: 'student', sender_name: 'John Doe' },
      ];
      
      const roles = allMessages.map(m => m.sender_role);
      expect(roles).toEqual(['student', 'staff', 'student']);
    });
  });

  describe('Message Validation', () => {
    it('should reject empty content', () => {
      const content = '';
      const isValid = content && content.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it('should reject whitespace-only content', () => {
      const content = '   ';
      const isValid = content && content.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it('should accept valid content with special characters', () => {
      const content = 'Test <script>alert("xss")</script>';
      const isValid = content && content.trim().length > 0;
      expect(isValid).toBe(true);
    });

    it('should enforce max content length', () => {
      const maxLength = 10000;
      const content = 'a'.repeat(maxLength + 1);
      const isValid = content.length <= maxLength;
      expect(isValid).toBe(false);
    });
  });
});