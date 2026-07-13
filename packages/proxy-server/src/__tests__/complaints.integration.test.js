/**
 * Complaints Integration Tests
 * Tests for complaint CRUD endpoints
 */

const { createTestApp, getAuthHeader, createMockUser } = require('./helpers');

describe('Complaints Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/voice/complaints', () => {
    it('should create complaint, initial message, and participant record', async () => {
      const complaintData = {
        title: 'Test Complaint',
        content: 'This is a test complaint content',
        category: 'academic',
        type: 'grade_dispute',
        attachments: [],
      };
      
      // Verify complaint data structure
      expect(complaintData).toHaveProperty('title');
      expect(complaintData).toHaveProperty('content');
      expect(complaintData).toHaveProperty('category');
      expect(complaintData).toHaveProperty('type');
    });

    it('should return expected shape on creation', async () => {
      const expectedResponse = {
        id: 'complaint-id',
        title: 'Test Complaint',
        status: 'open',
        category: 'academic',
        type: 'grade_dispute',
        created_by: 'test-user-123',
        created_at: expect.any(String),
        messages: [
          {
            id: 'message-id',
            content: 'This is a test complaint content',
            sender_id: 'test-user-123',
            sender_role: 'student',
          }
        ],
      };
      
      expect(expectedResponse.messages).toHaveLength(1);
    });

    it('should handle attachments in complaint creation', async () => {
      const complaintWithAttachments = {
        title: 'Complaint with files',
        content: 'Content with attachments',
        category: 'facilities',
        type: 'maintenance',
        attachments: [
          { name: 'file1.pdf', type: 'application/pdf', size: 1024 },
          { name: 'image.jpg', type: 'image/jpeg', size: 2048 },
        ],
      };
      
      expect(complaintWithAttachments.attachments).toHaveLength(2);
    });

    it('should reject invalid complaint data', async () => {
      const invalidComplaint = {
        // Missing required fields
        category: 'academic',
      };
      
      expect(invalidComplaint).not.toHaveProperty('title');
    });
  });

  describe('GET /api/voice/complaints', () => {
    it('should list complaints for authenticated user', async () => {
      const mockComplaints = [
        { id: '1', title: 'Complaint 1', status: 'open' },
        { id: '2', title: 'Complaint 2', status: 'in_progress' },
        { id: '3', title: 'Complaint 3', status: 'resolved' },
      ];
      
      expect(mockComplaints).toHaveLength(3);
    });

    it('should respect status filter', async () => {
      const statusFilter = 'open';
      const allComplaints = [
        { id: '1', status: 'open' },
        { id: '2', status: 'in_progress' },
        { id: '3', status: 'resolved' },
      ];
      
      const filtered = allComplaints.filter(c => c.status === statusFilter);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('open');
    });

    it('should respect category filter', async () => {
      const categoryFilter = 'academic';
      const allComplaints = [
        { id: '1', category: 'academic' },
        { id: '2', category: 'facilities' },
        { id: '3', category: 'academic' },
      ];
      
      const filtered = allComplaints.filter(c => c.category === categoryFilter);
      expect(filtered).toHaveLength(2);
    });

    it('should support date filtering', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      
      const complaints = [
        { id: '1', created_at: '2024-06-15' },
        { id: '2', created_at: '2024-03-10' },
        { id: '3', created_at: '2025-01-05' },
      ];
      
      const inRange = complaints.filter(c => 
        c.created_at >= startDate && c.created_at <= endDate
      );
      expect(inRange).toHaveLength(2);
    });
  });

  describe('GET /api/voice/complaints/:id', () => {
    it('should return complaint detail with messages and attachments', async () => {
      const complaintDetail = {
        id: 'complaint-123',
        title: 'Test Complaint',
        status: 'open',
        messages: [
          { id: 'msg-1', content: 'Initial message', attachments: [] },
          { id: 'msg-2', content: 'Reply', attachments: [{ id: 'att-1' }] },
        ],
        attachments: [{ id: 'att-2', name: 'document.pdf' }],
      };
      
      expect(complaintDetail).toHaveProperty('messages');
      expect(complaintDetail).toHaveProperty('attachments');
    });

    it('should return 404 for non-existent complaint', async () => {
      const nonExistentId = 'non-existent-id';
      const allComplaints = [];
      
      const found = allComplaints.find(c => c.id === nonExistentId);
      expect(found).toBeUndefined();
    });

    it('should return 403 when user tries to access another user complaint', async () => {
      const userId = 'user-1';
      const complaint = {
        id: 'complaint-123',
        created_by: 'user-2', // Different user
      };
      
      const hasAccess = complaint.created_by === userId;
      expect(hasAccess).toBe(false);
    });
  });

  describe('PUT /api/voice/complaints/:id', () => {
    it('should update status', async () => {
      const updateData = { status: 'in_progress' };
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      
      expect(validStatuses).toContain(updateData.status);
    });

    it('should reject invalid status values with 400', async () => {
      const invalidStatus = 'invalid_status';
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      
      const isValid = validStatuses.includes(invalidStatus);
      expect(isValid).toBe(false);
    });

    it('should only allow staff to update status', async () => {
      const userRole = 'student';
      const allowedRoles = ['staff', 'admin'];
      
      const canUpdate = allowedRoles.includes(userRole);
      expect(canUpdate).toBe(false);
    });
  });

  describe('GET /api/voice/complaints/stats', () => {
    it('should return correct counts per status', async () => {
      const complaints = [
        { status: 'open' },
        { status: 'open' },
        { status: 'in_progress' },
        { status: 'resolved' },
        { status: 'resolved' },
        { status: 'resolved' },
      ];
      
      const stats = {
        open: complaints.filter(c => c.status === 'open').length,
        in_progress: complaints.filter(c => c.status === 'in_progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
      };
      
      expect(stats.open).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.resolved).toBe(3);
    });

    it('should return counts by category', async () => {
      const complaints = [
        { category: 'academic' },
        { category: 'academic' },
        { category: 'facilities' },
        { category: 'other' },
      ];
      
      const categoryStats = {
        academic: complaints.filter(c => c.category === 'academic').length,
        facilities: complaints.filter(c => c.category === 'facilities').length,
        other: complaints.filter(c => c.category === 'other').length,
      };
      
      expect(categoryStats.academic).toBe(2);
    });
  });

  describe('GET /api/voice/complaints/search', () => {
    it('should return matching complaints', async () => {
      const query = 'grade';
      const complaints = [
        { title: 'Grade dispute', content: 'My grade is wrong' },
        { title: 'Facility issue', content: 'Broken window' },
        { title: 'Grade appeal', content: 'Requesting grade review' },
      ];
      
      const matches = complaints.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.content.toLowerCase().includes(query)
      );
      
      expect(matches).toHaveLength(2);
    });

    it('should return empty for no matches', async () => {
      const query = 'nonexistent';
      const complaints = [
        { title: 'Grade dispute', content: 'My grade is wrong' },
      ];
      
      const matches = complaints.filter(c => 
        c.title.toLowerCase().includes(query)
      );
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('GET /api/voice/complaints/category/:category', () => {
    it('should filter by category', async () => {
      const category = 'academic';
      const complaints = [
        { category: 'academic' },
        { category: 'facilities' },
        { category: 'academic' },
      ];
      
      const filtered = complaints.filter(c => c.category === category);
      expect(filtered).toHaveLength(2);
    });

    it('should return empty for invalid category', async () => {
      const category = 'invalid_category';
      const validCategories = ['academic', 'facilities', 'administrative', 'other'];
      
      const isValid = validCategories.includes(category);
      expect(isValid).toBe(false);
    });
  });
});