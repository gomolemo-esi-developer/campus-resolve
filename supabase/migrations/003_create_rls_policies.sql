-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE residences ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracurriculars ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_sync ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CAMPUSES POLICIES
-- ============================================

CREATE POLICY "Authenticated users can view campuses"
  ON campuses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create campuses"
  ON campuses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update campuses"
  ON campuses FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete campuses"
  ON campuses FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- FACULTIES POLICIES
-- ============================================

CREATE POLICY "Authenticated users can view faculties"
  ON faculties FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create faculties"
  ON faculties FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update faculties"
  ON faculties FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete faculties"
  ON faculties FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- DEPARTMENTS POLICIES
-- ============================================

CREATE POLICY "Authenticated users can view departments"
  ON departments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create departments"
  ON departments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update departments"
  ON departments FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete departments"
  ON departments FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- COURSES POLICIES
-- ============================================

CREATE POLICY "Authenticated users can view courses"
  ON courses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create courses"
  ON courses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update courses"
  ON courses FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete courses"
  ON courses FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- MODULES POLICIES
-- ============================================

CREATE POLICY "Authenticated users can view modules"
  ON modules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create modules"
  ON modules FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update modules"
  ON modules FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete modules"
  ON modules FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- ROLES POLICIES
-- ============================================

CREATE POLICY "Authenticated users can view roles"
  ON roles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create roles"
  ON roles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update roles"
  ON roles FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete roles"
  ON roles FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- STAFF POLICIES
-- ============================================

CREATE POLICY "Authenticated users can view staff"
  ON staff FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create staff"
  ON staff FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update staff"
  ON staff FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete staff"
  ON staff FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- RESIDENCES POLICIES
-- ============================================

CREATE POLICY "Authenticated users can view residences"
  ON residences FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create residences"
  ON residences FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update residences"
  ON residences FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete residences"
  ON residences FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- EXTRACURRICULARS POLICIES
-- ============================================

CREATE POLICY "Authenticated users can view extracurriculars"
  ON extracurriculars FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create extracurriculars"
  ON extracurriculars FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update extracurriculars"
  ON extracurriculars FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete extracurriculars"
  ON extracurriculars FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

CREATE POLICY "Authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- USERS SYNC POLICIES
-- ============================================

CREATE POLICY "Service role can manage users sync"
  ON users_sync FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
