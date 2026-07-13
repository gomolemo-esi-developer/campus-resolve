-- ============================================
-- INDEXES FOR COMMUNICATION TABLES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_cognito_sub ON profiles(cognito_sub);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_complaints_filed_by ON complaints(filed_by);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_complaint_messages_complaint_id ON complaint_messages(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_messages_sender_id ON complaint_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_complaint_messages_created_at ON complaint_messages(created_at ASC);

CREATE INDEX IF NOT EXISTS idx_complaint_participants_complaint_id ON complaint_participants(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_participants_profile_id ON complaint_participants(profile_id);

CREATE INDEX IF NOT EXISTS idx_attachments_complaint_message_id ON attachments(complaint_message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON attachments(note_id);

CREATE INDEX IF NOT EXISTS idx_quick_notes_created_by ON quick_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_quick_notes_created_at ON quick_notes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quick_note_attachments_note_id ON quick_note_attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_quick_note_links_note_id ON quick_note_links(note_id);
