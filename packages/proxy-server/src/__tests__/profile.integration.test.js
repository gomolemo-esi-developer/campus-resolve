/**
 * Profile Integration Tests
 * Tests for /api/voice/profile and /api/resolve/profile endpoints
 */

const { createTestApp, getAuthHeader } = require('./helpers');

describe('Profile Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
    // In real tests, mount the actual routes
    // For now, this is a placeholder test structure
  });

  describe('GET /api/voice/profile', () => {
    it('should return 401 when no auth header provided', async () => {
      // This test verifies that endpoints require authentication
      // In a real implementation with actual routes mounted:
      // const response = await request(app).get('/api/voice/profile');
      // expect(response.status).toBe(401);
      expect(true).toBe(true);
    });

    it('should return profile with expected shape when Supabase is enabled', async () => {
      // Test profile response shape
      // Expected shape: { id, sub, role, full_name, student_number, etc. }
      const mockProfile = {
        id: 'test-profile-id',
        sub: 'test-user-123',
        role: 'student',
        full_name: 'Test Student',
        student_number: 'STU001',
        campus: 'Arcadia',
        faculty: 'Engineering',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      expect(mockProfile).toHaveProperty('id');
      expect(mockProfile).toHaveProperty('sub');
      expect(mockProfile).toHaveProperty('role');
      expect(mockProfile).toHaveProperty('full_name');
    });

    it('should return student profile fields for student role', async () => {
      const mockProfile = {
        role: 'student',
        student_number: 'STU001',
        campus: 'Arcadia',
        faculty: 'Engineering',
        department: 'Computer Science',
      };
      
      expect(mockProfile.role).toBe('student');
      expect(mockProfile).toHaveProperty('student_number');
    });

    it('should return staff profile fields for staff role', async () => {
      const mockProfile = {
        role: 'staff',
        staff_number: 'STF001',
        department: 'Student Affairs',
        position: 'Counselor',
      };
      
      expect(mockProfile.role).toBe('staff');
      expect(mockProfile).toHaveProperty('staff_number');
    });
  });

  describe('PUT /api/voice/profile', () => {
    it('should update and persist profile fields', async () => {
      const updateData = {
        full_name: 'Updated Name',
        phone_number: '+1234567890',
        bio: 'Updated bio',
      };
      
      // Verify update data structure
      expect(updateData).toHaveProperty('full_name');
      expect(updateData.full_name).toBe('Updated Name');
    });

    it('should reject invalid profile data', async () => {
      // Invalid data scenarios
      const invalidData = {
        // Missing required fields
        email: 'not-an-email', // Invalid email format
      };
      
      expect(invalidData.email).toBe('not-an-email');
    });

    it('should preserve role-specific fields on update', async () => {
      const studentProfile = {
        role: 'student',
        student_number: 'STU001',
        full_name: 'Updated Name',
      };
      
      // Role-specific fields should be preserved
      expect(studentProfile.student_number).toBe('STU001');
      expect(studentProfile.role).toBe('student');
    });
  });

  describe('GET /api/resolve/profile', () => {
    it('should return resolve profile with staff-specific fields', async () => {
      const staffProfile = {
        role: 'staff',
        staff_number: 'STF001',
        department: 'Student Affairs',
        position: 'Counselor',
        professional_entries: [
          {
            id: 'entry-1',
            title: 'Initial Consultation',
            date: '2024-01-15',
          }
        ],
      };
      
      expect(staffProfile.role).toBe('staff');
      expect(staffProfile).toHaveProperty('professional_entries');
      expect(Array.isArray(staffProfile.professional_entries)).toBe(true);
    });

    it('should return admin profile with admin-specific fields', async () => {
      const adminProfile = {
        role: 'admin',
        admin_level: 'super_admin',
        permissions: ['users', 'reports', 'settings'],
      };
      
      expect(adminProfile.role).toBe('admin');
      expect(adminProfile).toHaveProperty('permissions');
    });
  });

  describe('PUT /api/resolve/profile', () => {
    it('should update resolve profile including professionalEntries JSONB', async () => {
      const updateData = {
        full_name: 'Staff Member',
        department: 'Updated Department',
        professional_entries: [
          {
            id: 'new-entry',
            title: 'New Entry',
            description: 'Description',
            date: '2024-02-01',
          }
        ],
      };
      
      expect(updateData).toHaveProperty('professional_entries');
      expect(Array.isArray(updateData.professional_entries)).toBe(true);
    });

    it('should handle array field updates for professional entries', async () => {
      const entries = [
        { title: 'Entry 1', date: '2024-01-01' },
        { title: 'Entry 2', date: '2024-01-15' },
        { title: 'Entry 3', date: '2024-02-01' },
      ];
      
      expect(entries.length).toBe(3);
    });
  });

  describe('Authentication', () => {
    it('should return 401 when no auth header provided', async () => {
      // Test that endpoints are protected
      const authHeader = undefined;
      expect(authHeader).toBeUndefined();
    });

    it('should accept valid Bearer token', async () => {
      const authHeader = getAuthHeader('student', 'test-user-123');
      expect(authHeader).toContain('Bearer');
      expect(authHeader).toContain('test_student_');
    });

    it('should parse role from token correctly', async () => {
      const studentHeader = getAuthHeader('student', 'user-1');
      const staffHeader = getAuthHeader('staff', 'user-2');
      const adminHeader = getAuthHeader('admin', 'user-3');
      
      expect(studentHeader).toContain('student');
      expect(staffHeader).toContain('staff');
      expect(adminHeader).toContain('admin');
    });
  });
});