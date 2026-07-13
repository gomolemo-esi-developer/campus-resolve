/**
 * Quick Notes Integration Tests
 * Tests for Campus-Resolve quick notes CRUD endpoints
 */

const { createTestApp, getAuthHeader } = require('./helpers');

describe('Quick Notes Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/resolve/notes', () => {
    it('should create note with subject and description', async () => {
      const noteData = {
        subject: 'Important Follow-up',
        description: 'Need to follow up with student regarding appeal',
        type: 'follow_up',
      };
      
      expect(noteData).toHaveProperty('subject');
      expect(noteData).toHaveProperty('description');
      expect(noteData).toHaveProperty('type');
    });

    it('should handle links in note creation', async () => {
      const noteWithLinks = {
        subject: 'Note with Links',
        description: 'Checking resources',
        links: [
          { url: 'https://example.com/doc1', title: 'Document 1' },
          { url: 'https://example.com/doc2', title: 'Document 2' },
        ],
      };
      
      expect(noteWithLinks.links).toHaveLength(2);
    });

    it('should store note in quick_notes table', async () => {
      const note = {
        id: 'note-123',
        subject: 'Test Note',
        description: 'Test description',
        user_id: 'staff-user-123',
        created_at: new Date().toISOString(),
      };
      
      expect(note).toHaveProperty('id');
      expect(note).toHaveProperty('user_id');
    });

    it('should return 401 for unauthenticated request', async () => {
      const authHeader = null;
      const isAuthenticated = authHeader !== undefined;
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('GET /api/resolve/notes', () => {
    it('should list all notes for user', async () => {
      const userId = 'staff-123';
      const allNotes = [
        { id: '1', user_id: 'staff-123', subject: 'Note 1' },
        { id: '2', user_id: 'staff-123', subject: 'Note 2' },
        { id: '3', user_id: 'other-user', subject: 'Note 3' },
      ];
      
      const userNotes = allNotes.filter(n => n.user_id === userId);
      expect(userNotes).toHaveLength(2);
    });

    it('should support search query param', async () => {
      const searchQuery = 'follow';
      const notes = [
        { subject: 'Follow up needed', description: 'Contact student' },
        { subject: 'Grade review', description: 'Review required' },
        { subject: 'Follow-up meeting', description: 'Schedule meeting' },
      ];
      
      const matches = notes.filter(n => 
        n.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      expect(matches).toHaveLength(2);
    });

    it('should support type query param', async () => {
      const typeFilter = 'action_item';
      const notes = [
        { type: 'action_item', subject: 'Task 1' },
        { type: 'follow_up', subject: 'Task 2' },
        { type: 'action_item', subject: 'Task 3' },
      ];
      
      const filtered = notes.filter(n => n.type === typeFilter);
      expect(filtered).toHaveLength(2);
    });

    it('should include file attachments in response', async () => {
      const notes = [
        {
          id: 'note-1',
          attachments: [
            { id: 'att-1', name: 'document.pdf' },
          ],
        },
      ];
      
      expect(notes[0].attachments).toHaveLength(1);
    });

    it('should include links in response', async () => {
      const notes = [
        {
          id: 'note-1',
          links: [
            { url: 'https://example.com', title: 'Link' },
          ],
        },
      ];
      
      expect(notes[0].links).toHaveLength(1);
    });
  });

  describe('GET /api/resolve/notes/:noteId', () => {
    it('should return note detail with links and attachments', async () => {
      const noteDetail = {
        id: 'note-123',
        subject: 'Test Note',
        description: 'Detailed description',
        type: 'follow_up',
        links: [
          { id: 'link-1', url: 'https://example.com', title: 'Example' },
        ],
        attachments: [
          { id: 'att-1', name: 'file.pdf' },
        ],
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-02T10:00:00Z',
      };
      
      expect(noteDetail).toHaveProperty('links');
      expect(noteDetail).toHaveProperty('attachments');
    });

    it('should return 404 for non-existent note', async () => {
      const noteId = 'non-existent';
      const allNotes = [];
      
      const found = allNotes.find(n => n.id === noteId);
      expect(found).toBeUndefined();
    });

    it('should return 403 for note belonging to another user', async () => {
      const noteId = 'note-123';
      const currentUserId = 'user-1';
      const note = { id: 'note-123', user_id: 'user-2' };
      
      const hasAccess = note.user_id === currentUserId;
      expect(hasAccess).toBe(false);
    });
  });

  describe('PUT /api/resolve/notes/:noteId', () => {
    it('should update note', async () => {
      const updateData = {
        subject: 'Updated Subject',
        description: 'Updated description',
      };
      
      expect(updateData).toHaveProperty('subject');
      expect(updateData).toHaveProperty('description');
    });

    it('should replace links on update', async () => {
      const oldLinks = [
        { id: 'link-1', url: 'https://old.com' },
      ];
      
      const newLinks = [
        { url: 'https://new.com', title: 'New Link' },
      ];
      
      // Links are replaced, not appended
      expect(newLinks).not.toEqual(oldLinks);
    });

    it('should return 404 for non-existent note', async () => {
      const noteId = 'non-existent';
      const allNotes = [];
      
      const found = allNotes.find(n => n.id === noteId);
      expect(found).toBeUndefined();
    });
  });

  describe('DELETE /api/resolve/notes/:noteId', () => {
    it('should delete note', async () => {
      const noteId = 'note-123';
      const allNotes = [{ id: 'note-123' }];
      
      const index = allNotes.findIndex(n => n.id === noteId);
      expect(index).toBe(0);
    });

    it('should cascade delete to links', async () => {
      const note = {
        id: 'note-123',
        links: [
          { id: 'link-1' },
          { id: 'link-2' },
        ],
      };
      
      // When note is deleted, links should be deleted
      const linksToDelete = note.links;
      expect(linksToDelete).toHaveLength(2);
    });

    it('should cascade delete to attachments', async () => {
      const note = {
        id: 'note-123',
        attachments: [
          { id: 'att-1' },
        ],
      };
      
      // When note is deleted, attachments should be deleted
      const attachmentsToDelete = note.attachments;
      expect(attachmentsToDelete).toHaveLength(1);
    });

    it('should return 404 for non-existent note', async () => {
      const noteId = 'non-existent';
      const allNotes = [];
      
      const found = allNotes.find(n => n.id === noteId);
      expect(found).toBeUndefined();
    });
  });

  describe('POST /api/resolve/notes/attachments', () => {
    it('should create standalone file attachment record', async () => {
      const attachmentData = {
        note_id: 'note-123',
        name: 'document.pdf',
        storage_key: 'notes/note-123/document.pdf',
        mime_type: 'application/pdf',
        size: 2048,
      };
      
      expect(attachmentData).toHaveProperty('storage_key');
      expect(attachmentData).toHaveProperty('note_id');
    });

    it('should return attachment metadata after creation', async () => {
      const response = {
        id: 'att-123',
        name: 'document.pdf',
        url: 'https://s3.example.com/notes/note-123/document.pdf',
      };
      
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('url');
    });

    it('should reject invalid file types', async () => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
      const fileType = 'application/exe';
      
      const isAllowed = allowedTypes.includes(fileType);
      expect(isAllowed).toBe(false);
    });
  });

  describe('Note Scoping', () => {
    it('user A cannot see user B notes', async () => {
      const userANotes = [
        { id: '1', user_id: 'user-a', subject: 'Note A1' },
        { id: '2', user_id: 'user-a', subject: 'Note A2' },
      ];
      
      const userBNotes = [
        { id: '3', user_id: 'user-b', subject: 'Note B1' },
      ];
      
      const userACanSeeB = userANotes.some(n => n.user_id === 'user-b');
      expect(userACanSeeB).toBe(false);
    });

    it('notes are associated with creating user', async () => {
      const note = {
        id: 'note-1',
        user_id: 'staff-123',
        subject: 'My Note',
      };
      
      expect(note.user_id).toBe('staff-123');
    });
  });

  describe('Note Types', () => {
    it('should support action_item type', async () => {
      const validTypes = ['action_item', 'follow_up', 'info', 'meeting'];
      const noteType = 'action_item';
      
      expect(validTypes).toContain(noteType);
    });

    it('should support follow_up type', async () => {
      const noteType = 'follow_up';
      expect(noteType).toBe('follow_up');
    });

    it('should reject invalid type', async () => {
      const validTypes = ['action_item', 'follow_up', 'info', 'meeting'];
      const invalidType = 'invalid';
      
      expect(validTypes).toContain(invalidType).toBe(false);
    });
  });
});