-- ============================================
-- ESCALATION STRUCTURE (Phase 1 — Foundation)
-- ============================================
-- Adds: offices, escalation_chains, escalation_chain_steps, role_holders
-- Extends: complaint_types (path), complaints (chain_variant)
-- Renames: complaint_types 'report-lecturer' -> 'report-staff'

-- ============================================
-- OFFICES (per-campus, per General-path category family)
-- ============================================
CREATE TABLE IF NOT EXISTS offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category_key VARCHAR(100) NOT NULL,
  campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID,
  updated_by UUID,
  UNIQUE (category_key, campus_id)
);

-- ============================================
-- ESCALATION CHAINS (one template per category, optionally per variant)
-- ============================================
CREATE TABLE IF NOT EXISTS escalation_chains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_key VARCHAR(100) NOT NULL,
  variant VARCHAR(50),
  scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('department', 'faculty', 'office', 'university')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID,
  updated_by UUID
);

-- Partial-unique-like behavior for nullable `variant`: use a computed key via COALESCE index
CREATE UNIQUE INDEX IF NOT EXISTS idx_escalation_chains_category_variant
  ON escalation_chains (category_key, COALESCE(variant, ''));

-- ============================================
-- ESCALATION CHAIN STEPS (ordered roles within a chain)
-- ============================================
CREATE TABLE IF NOT EXISTS escalation_chain_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain_id UUID NOT NULL REFERENCES escalation_chains(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID,
  updated_by UUID,
  UNIQUE (chain_id, step_order)
);

-- ============================================
-- ROLE HOLDERS (who currently fills a role for an org unit)
-- ============================================
CREATE TABLE IF NOT EXISTS role_holders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  org_unit_type VARCHAR(20) NOT NULL CHECK (org_unit_type IN ('department', 'faculty', 'office', 'university')),
  org_unit_id UUID,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_role_holders_lookup
  ON role_holders (role_id, org_unit_type, org_unit_id, is_primary)
  WHERE end_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_escalation_chain_steps_chain ON escalation_chain_steps(chain_id);
CREATE INDEX IF NOT EXISTS idx_offices_campus ON offices(campus_id);

-- ============================================
-- EXTEND complaint_types / complaints
-- ============================================
ALTER TABLE complaint_types ADD COLUMN IF NOT EXISTS path VARCHAR(20) CHECK (path IN ('academic', 'non-academic'));
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS chain_variant VARCHAR(50);

-- ============================================
-- RENAME 'report-lecturer' -> 'report-staff' (in place, keeps existing complaint references)
-- ============================================
UPDATE complaint_types
SET key = 'report-staff', label = 'Report Staff', description = 'Staff (lecturer or supervisor) conduct or delivery complaints'
WHERE key = 'report-lecturer';

-- Backfill path on existing categories
UPDATE complaint_types SET path = 'non-academic' WHERE key IN ('student-services', 'campus-facilities');
UPDATE complaint_types SET path = 'academic' WHERE key IN ('course-complaint', 'timetable', 'lecture-hall-lab', 'report-staff');

-- ============================================
-- SEED: Academic-path roles (undergraduate + research tracks)
-- ============================================
INSERT INTO roles (role, level, description) VALUES
  ('Lecturer', 1, 'Undergraduate academic track, level 1'),
  ('Supervisor', 1, 'Research/postgraduate academic track, level 1'),
  ('Cluster Group Leader', 2, 'Undergraduate academic track, level 2'),
  ('Departmental Research Chair', 2, 'Research academic track, level 2'),
  ('Department Admin', 3, 'Academic track, level 3'),
  ('Section Head', 3, 'Research academic track, level 3'),
  ('Head of Department', 4, 'Academic track, level 4 (shared)'),
  ('Research Officer', 5, 'Academic track, level 5 (shared)'),
  ('Assistant Dean', 6, 'Academic track, level 6 (shared)'),
  ('Executive Dean', 7, 'Academic track, level 7 (shared)')
ON CONFLICT (role) DO NOTHING;

-- ============================================
-- SEED: escalation_chains + steps
-- ============================================

-- Report Staff: lecturer variant (undergraduate track, department-scoped)
INSERT INTO escalation_chains (category_key, variant, scope_type)
VALUES ('report-staff', 'lecturer', 'department')
ON CONFLICT DO NOTHING;

INSERT INTO escalation_chain_steps (chain_id, step_order, role_id)
SELECT c.id, s.step_order, r.id
FROM escalation_chains c
CROSS JOIN (VALUES
  (1, 'Lecturer'),
  (2, 'Cluster Group Leader'),
  (3, 'Department Admin'),
  (4, 'Head of Department'),
  (5, 'Research Officer'),
  (6, 'Assistant Dean'),
  (7, 'Executive Dean')
) AS s(step_order, role_name)
JOIN roles r ON r.role = s.role_name
WHERE c.category_key = 'report-staff' AND c.variant = 'lecturer'
ON CONFLICT (chain_id, step_order) DO NOTHING;

-- Report Staff: supervisor variant (research track, department-scoped)
INSERT INTO escalation_chains (category_key, variant, scope_type)
VALUES ('report-staff', 'supervisor', 'department')
ON CONFLICT DO NOTHING;

INSERT INTO escalation_chain_steps (chain_id, step_order, role_id)
SELECT c.id, s.step_order, r.id
FROM escalation_chains c
CROSS JOIN (VALUES
  (1, 'Supervisor'),
  (2, 'Departmental Research Chair'),
  (3, 'Section Head'),
  (4, 'Head of Department'),
  (5, 'Research Officer'),
  (6, 'Assistant Dean'),
  (7, 'Executive Dean')
) AS s(step_order, role_name)
JOIN roles r ON r.role = s.role_name
WHERE c.category_key = 'report-staff' AND c.variant = 'supervisor'
ON CONFLICT (chain_id, step_order) DO NOTHING;

-- Course Complaint: starts at Lecturer (undergraduate track), department-scoped, no variant
INSERT INTO escalation_chains (category_key, variant, scope_type)
VALUES ('course-complaint', NULL, 'department')
ON CONFLICT DO NOTHING;

INSERT INTO escalation_chain_steps (chain_id, step_order, role_id)
SELECT c.id, s.step_order, r.id
FROM escalation_chains c
CROSS JOIN (VALUES
  (1, 'Lecturer'),
  (2, 'Cluster Group Leader'),
  (3, 'Department Admin'),
  (4, 'Head of Department'),
  (5, 'Research Officer'),
  (6, 'Assistant Dean'),
  (7, 'Executive Dean')
) AS s(step_order, role_name)
JOIN roles r ON r.role = s.role_name
WHERE c.category_key = 'course-complaint' AND c.variant IS NULL
ON CONFLICT (chain_id, step_order) DO NOTHING;

-- Timetable & Lecture Hall|Lab: start at Cluster Group Leader (skip Lecturer), department-scoped
INSERT INTO escalation_chains (category_key, variant, scope_type)
VALUES ('timetable', NULL, 'department'), ('lecture-hall-lab', NULL, 'department')
ON CONFLICT DO NOTHING;

INSERT INTO escalation_chain_steps (chain_id, step_order, role_id)
SELECT c.id, s.step_order, r.id
FROM escalation_chains c
CROSS JOIN (VALUES
  (2, 'Cluster Group Leader'),
  (3, 'Department Admin'),
  (4, 'Head of Department'),
  (5, 'Research Officer'),
  (6, 'Assistant Dean'),
  (7, 'Executive Dean')
) AS s(step_order, role_name)
JOIN roles r ON r.role = s.role_name
WHERE c.category_key IN ('timetable', 'lecture-hall-lab') AND c.variant IS NULL
ON CONFLICT (chain_id, step_order) DO NOTHING;
