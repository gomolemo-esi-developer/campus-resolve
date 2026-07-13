-- ============================================
-- COMPLAINT ROUTING AND SYNC TABLES
-- ============================================

-- Complaint Conversations Table (maps complaints to conversation threads)
CREATE TABLE IF NOT EXISTS complaint_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(complaint_id)
);

-- Message Sync Table (ensures idempotency across apps)
CREATE TABLE IF NOT EXISTS complaint_message_sync (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  message_id UUID NOT NULL,
  sender_app VARCHAR(50) NOT NULL CHECK (sender_app IN ('campus-voice', 'campus-resolve')),
  sync_timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  message_type VARCHAR(50) NOT NULL DEFAULT 'reply',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(complaint_id, message_id, sender_app)
);

-- Escalation History Table
CREATE TABLE IF NOT EXISTS escalation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  from_level INT NOT NULL,
  to_level INT NOT NULL,
  reason TEXT,
  escalated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  escalated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaint_conversations_staff_id ON complaint_conversations(staff_id);
CREATE INDEX IF NOT EXISTS idx_complaint_conversations_status ON complaint_conversations(status);
CREATE INDEX IF NOT EXISTS idx_complaint_conversations_last_message_at ON complaint_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_message_sync_complaint_id ON complaint_message_sync(complaint_id);
CREATE INDEX IF NOT EXISTS idx_escalation_history_complaint_id ON escalation_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);