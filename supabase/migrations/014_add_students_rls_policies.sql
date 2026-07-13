-- ============================================
-- Migration: Add RLS Policies for Students Table
-- ============================================

-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENTS POLICIES
-- ============================================

CREATE POLICY "Authenticated users can view students"
  ON students FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create students"
  ON students FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update students"
  ON students FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete students"
  ON students FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- Verification
-- ============================================

SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE tablename IN ('staff', 'students')
ORDER BY tablename, policyname;
