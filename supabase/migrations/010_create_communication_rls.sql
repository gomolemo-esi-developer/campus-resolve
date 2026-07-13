-- ============================================
-- RLS FOR COMMUNICATION TABLES
-- ============================================

ALTER TABLE complaint_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_note_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_note_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can view complaint_types'
  ) THEN
    CREATE POLICY "Authenticated users can view complaint_types"
      ON complaint_types FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role can manage communication tables'
  ) THEN
    CREATE POLICY "Service role can manage communication tables"
      ON profiles FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    CREATE POLICY "Service role can manage complaints"
      ON complaints FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    CREATE POLICY "Service role can manage complaint messages"
      ON complaint_messages FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    CREATE POLICY "Service role can manage complaint participants"
      ON complaint_participants FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    CREATE POLICY "Service role can manage attachments"
      ON attachments FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    CREATE POLICY "Service role can manage quick notes"
      ON quick_notes FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    CREATE POLICY "Service role can manage quick note attachments"
      ON quick_note_attachments FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');

    CREATE POLICY "Service role can manage quick note links"
      ON quick_note_links FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;
