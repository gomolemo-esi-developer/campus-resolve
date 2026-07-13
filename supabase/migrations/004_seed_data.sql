-- ============================================================================
-- SEED DATA FOR CAMPUS ADMIN TABLES
-- Inserts test data to populate the campus, courses, faculties, and departments
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SEED CAMPUSES
-- ============================================================================
INSERT INTO public.campuses (id, name, abbreviation, location, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Soshanguve Campus', 'SH', '933 Lucas Meyer street, Theresapark, Pretoria', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Polokwane Campus', 'PL', 'Plot 3, Polokwane Business Park', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Ga-Rankuwa Campus', 'GR', 'Protea Avenue, Ga-Rankuwa', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'Midrand Campus', 'MR', 'Cnr William Nicol and Broadacres Drive, Midrand', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'Online Campus', 'OL', 'Virtual', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED FACULTIES
-- ============================================================================
INSERT INTO public.faculties (id, name, abbreviation, created_at, updated_at) VALUES
  ('aaaaaaaa-1111-1111-1111-111111111111', 'Faculty of Engineering', 'FE', NOW(), NOW()),
  ('aaaaaaaa-2222-2222-2222-222222222222', 'Faculty of Business and Management', 'FBM', NOW(), NOW()),
  ('aaaaaaaa-3333-3333-3333-333333333333', 'Faculty of Health Sciences', 'FHS', NOW(), NOW()),
  ('aaaaaaaa-4444-4444-4444-444444444444', 'Faculty of Science', 'FS', NOW(), NOW()),
  ('aaaaaaaa-5555-5555-5555-555555555555', 'Faculty of Humanities', 'FH', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DEPARTMENTS
-- ============================================================================
INSERT INTO public.departments (id, name, abbreviation, faculty_id, created_at, updated_at) VALUES
  ('bbbbbbbb-1111-1111-1111-111111111111', 'Department of Civil Engineering', 'DCE', 'aaaaaaaa-1111-1111-1111-111111111111', NOW(), NOW()),
  ('bbbbbbbb-2222-2222-2222-222222222222', 'Department of Mechanical Engineering', 'DME', 'aaaaaaaa-1111-1111-1111-111111111111', NOW(), NOW()),
  ('bbbbbbbb-3333-3333-3333-333333333333', 'Department of Accounting', 'DA', 'aaaaaaaa-2222-2222-2222-222222222222', NOW(), NOW()),
  ('bbbbbbbb-4444-4444-4444-444444444444', 'Department of Management', 'DM', 'aaaaaaaa-2222-2222-2222-222222222222', NOW(), NOW()),
  ('bbbbbbbb-5555-5555-5555-555555555555', 'Department of Nursing', 'DN', 'aaaaaaaa-3333-3333-3333-333333333333', NOW(), NOW()),
  ('bbbbbbbb-6666-6666-6666-666666666666', 'Department of Physics', 'DP', 'aaaaaaaa-4444-4444-4444-444444444444', NOW(), NOW()),
  ('bbbbbbbb-7777-7777-7777-777777777777', 'Department of Chemistry', 'DCH', 'aaaaaaaa-4444-4444-4444-444444444444', NOW(), NOW()),
  ('bbbbbbbb-8888-8888-8888-888888888888', 'Department of English', 'DE', 'aaaaaaaa-5555-5555-5555-555555555555', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED COURSES
-- ============================================================================
INSERT INTO public.courses (id, code, name, department_id, faculty_id, qualification_type, created_at, updated_at) VALUES
  -- Civil Engineering Courses
  ('cccccccc-1111-1111-1111-111111111111', 'CENG101', 'Introduction to Civil Engineering', 'bbbbbbbb-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', 'Higher Certificate', NOW(), NOW()),
  ('cccccccc-1111-1111-1111-111111111112', 'CENG201', 'Structural Analysis', 'bbbbbbbb-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', 'Diploma', NOW(), NOW()),
  ('cccccccc-1111-1111-1111-111111111113', 'CENG301', 'Advanced Structural Design', 'bbbbbbbb-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', 'Degree', NOW(), NOW()),
  
  -- Mechanical Engineering Courses
  ('cccccccc-2222-2222-2222-222222222221', 'MENG101', 'Introduction to Mechanical Engineering', 'bbbbbbbb-2222-2222-2222-222222222222', 'aaaaaaaa-1111-1111-1111-111111111111', 'Higher Certificate', NOW(), NOW()),
  ('cccccccc-2222-2222-2222-222222222222', 'MENG201', 'Thermodynamics', 'bbbbbbbb-2222-2222-2222-222222222222', 'aaaaaaaa-1111-1111-1111-111111111111', 'Diploma', NOW(), NOW()),
  ('cccccccc-2222-2222-2222-222222222223', 'MENG301', 'Advanced Mechanics of Materials', 'bbbbbbbb-2222-2222-2222-222222222222', 'aaaaaaaa-1111-1111-1111-111111111111', 'Degree', NOW(), NOW()),
  
  -- Accounting Courses
  ('cccccccc-3333-3333-3333-333333333331', 'ACCT101', 'Introduction to Accounting', 'bbbbbbbb-3333-3333-3333-333333333333', 'aaaaaaaa-2222-2222-2222-222222222222', 'Higher Certificate', NOW(), NOW()),
  ('cccccccc-3333-3333-3333-333333333332', 'ACCT201', 'Financial Accounting', 'bbbbbbbb-3333-3333-3333-333333333333', 'aaaaaaaa-2222-2222-2222-222222222222', 'Diploma', NOW(), NOW()),
  ('cccccccc-3333-3333-3333-333333333333', 'ACCT301', 'Advanced Financial Reporting', 'bbbbbbbb-3333-3333-3333-333333333333', 'aaaaaaaa-2222-2222-2222-222222222222', 'Degree', NOW(), NOW()),
  
  -- Management Courses
  ('cccccccc-4444-4444-4444-444444444441', 'MGMT101', 'Introduction to Management', 'bbbbbbbb-4444-4444-4444-444444444444', 'aaaaaaaa-2222-2222-2222-222222222222', 'Higher Certificate', NOW(), NOW()),
  ('cccccccc-4444-4444-4444-444444444442', 'MGMT201', 'Organizational Behavior', 'bbbbbbbb-4444-4444-4444-444444444444', 'aaaaaaaa-2222-2222-2222-222222222222', 'Diploma', NOW(), NOW()),
  ('cccccccc-4444-4444-4444-444444444443', 'MGMT301', 'Strategic Management', 'bbbbbbbb-4444-4444-4444-444444444444', 'aaaaaaaa-2222-2222-2222-222222222222', 'Degree', NOW(), NOW()),
  
  -- Nursing Courses
  ('cccccccc-5555-5555-5555-555555555551', 'NURS101', 'Introduction to Nursing', 'bbbbbbbb-5555-5555-5555-555555555555', 'aaaaaaaa-3333-3333-3333-333333333333', 'Higher Certificate', NOW(), NOW()),
  ('cccccccc-5555-5555-5555-555555555552', 'NURS201', 'Clinical Nursing', 'bbbbbbbb-5555-5555-5555-555555555555', 'aaaaaaaa-3333-3333-3333-333333333333', 'Diploma', NOW(), NOW()),
  ('cccccccc-5555-5555-5555-555555555553', 'NURS301', 'Advanced Nursing Practice', 'bbbbbbbb-5555-5555-5555-555555555555', 'aaaaaaaa-3333-3333-3333-333333333333', 'Degree', NOW(), NOW()),
  
  -- Physics Courses
  ('cccccccc-6666-6666-6666-666666666661', 'PHYS101', 'Introduction to Physics', 'bbbbbbbb-6666-6666-6666-666666666666', 'aaaaaaaa-4444-4444-4444-444444444444', 'Higher Certificate', NOW(), NOW()),
  ('cccccccc-6666-6666-6666-666666666662', 'PHYS201', 'Classical Mechanics', 'bbbbbbbb-6666-6666-6666-666666666666', 'aaaaaaaa-4444-4444-4444-444444444444', 'Diploma', NOW(), NOW()),
  ('cccccccc-6666-6666-6666-666666666663', 'PHYS301', 'Quantum Mechanics', 'bbbbbbbb-6666-6666-6666-666666666666', 'aaaaaaaa-4444-4444-4444-444444444444', 'Degree', NOW(), NOW()),
  
  -- Chemistry Courses
  ('cccccccc-7777-7777-7777-777777777771', 'CHEM101', 'Introduction to Chemistry', 'bbbbbbbb-7777-7777-7777-777777777777', 'aaaaaaaa-4444-4444-4444-444444444444', 'Higher Certificate', NOW(), NOW()),
  ('cccccccc-7777-7777-7777-777777777772', 'CHEM201', 'Organic Chemistry', 'bbbbbbbb-7777-7777-7777-777777777777', 'aaaaaaaa-4444-4444-4444-444444444444', 'Diploma', NOW(), NOW()),
  ('cccccccc-7777-7777-7777-777777777773', 'CHEM301', 'Advanced Analytical Chemistry', 'bbbbbbbb-7777-7777-7777-777777777777', 'aaaaaaaa-4444-4444-4444-444444444444', 'Degree', NOW(), NOW()),
  
  -- English Courses
  ('cccccccc-8888-8888-8888-888888888881', 'ENG101', 'English Fundamentals', 'bbbbbbbb-8888-8888-8888-888888888888', 'aaaaaaaa-5555-5555-5555-555555555555', 'Higher Certificate', NOW(), NOW()),
  ('cccccccc-8888-8888-8888-888888888882', 'ENG201', 'Literature Analysis', 'bbbbbbbb-8888-8888-8888-888888888888', 'aaaaaaaa-5555-5555-5555-555555555555', 'Diploma', NOW(), NOW()),
  ('cccccccc-8888-8888-8888-888888888883', 'ENG301', 'Advanced Literary Studies', 'bbbbbbbb-8888-8888-8888-888888888888', 'aaaaaaaa-5555-5555-5555-555555555555', 'Degree', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED MODULES
-- ============================================================================
INSERT INTO public.modules (id, code, name, course_id, credits, semester, created_at, updated_at) VALUES
  -- CENG101 Modules
  ('dddddddd-1111-1111-1111-111111111111', 'CENG101M1', 'Foundation Engineering Concepts', 'cccccccc-1111-1111-1111-111111111111', 10, 1, NOW(), NOW()),
  ('dddddddd-1111-1111-1111-111111111112', 'CENG101M2', 'Engineering Mathematics', 'cccccccc-1111-1111-1111-111111111111', 10, 1, NOW(), NOW()),
  ('dddddddd-1111-1111-1111-111111111113', 'CENG101M3', 'Engineering Drawing', 'cccccccc-1111-1111-1111-111111111111', 10, 1, NOW(), NOW()),
  
  -- CENG201 Modules
  ('dddddddd-1111-1111-1111-111111111121', 'CENG201M1', 'Structural Analysis I', 'cccccccc-1111-1111-1111-111111111112', 10, 1, NOW(), NOW()),
  ('dddddddd-1111-1111-1111-111111111122', 'CENG201M2', 'Structural Analysis II', 'cccccccc-1111-1111-1111-111111111112', 10, 2, NOW(), NOW()),
  ('dddddddd-1111-1111-1111-111111111123', 'CENG201M3', 'Geotechnical Engineering', 'cccccccc-1111-1111-1111-111111111112', 10, 2, NOW(), NOW()),
  
  -- MENG101 Modules
  ('dddddddd-2222-2222-2222-222222222221', 'MENG101M1', 'Mechanical Engineering Fundamentals', 'cccccccc-2222-2222-2222-222222222221', 10, 1, NOW(), NOW()),
  ('dddddddd-2222-2222-2222-222222222222', 'MENG101M2', 'Manufacturing Processes', 'cccccccc-2222-2222-2222-222222222221', 10, 1, NOW(), NOW()),
  ('dddddddd-2222-2222-2222-222222222223', 'MENG101M3', 'Machine Design Basics', 'cccccccc-2222-2222-2222-222222222221', 10, 1, NOW(), NOW()),
  
  -- ACCT101 Modules
  ('dddddddd-3333-3333-3333-333333333331', 'ACCT101M1', 'Accounting Principles', 'cccccccc-3333-3333-3333-333333333331', 10, 1, NOW(), NOW()),
  ('dddddddd-3333-3333-3333-333333333332', 'ACCT101M2', 'Bookkeeping Basics', 'cccccccc-3333-3333-3333-333333333331', 10, 1, NOW(), NOW()),
  ('dddddddd-3333-3333-3333-333333333333', 'ACCT101M3', 'Business Finance Intro', 'cccccccc-3333-3333-3333-333333333331', 10, 2, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED ROLES
-- ============================================================================
INSERT INTO public.roles (id, role, level, description, created_at, updated_at) VALUES
  ('eeeeeeee-1111-1111-1111-111111111111', 'Administrator', 1, 'System administrator with full access', NOW(), NOW()),
  ('eeeeeeee-2222-2222-2222-222222222222', 'Campus Admin', 2, 'Campus administrator', NOW(), NOW()),
  ('eeeeeeee-3333-3333-3333-333333333333', 'Department Head', 3, 'Department head/manager', NOW(), NOW()),
  ('eeeeeeee-4444-4444-4444-444444444444', 'Lecturer', 5, 'Academic staff/lecturer', NOW(), NOW()),
  ('eeeeeeee-5555-5555-5555-555555555555', 'Student', 7, 'Student user', NOW(), NOW()),
  ('eeeeeeee-6666-6666-6666-666666666666', 'Staff', 6, 'Support staff member', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFY DATA
-- ============================================================================
SELECT 'Campuses' as table_name, COUNT(*) as row_count FROM public.campuses
UNION ALL
SELECT 'Faculties', COUNT(*) FROM public.faculties
UNION ALL
SELECT 'Departments', COUNT(*) FROM public.departments
UNION ALL
SELECT 'Courses', COUNT(*) FROM public.courses
UNION ALL
SELECT 'Modules', COUNT(*) FROM public.modules
UNION ALL
SELECT 'Roles', COUNT(*) FROM public.roles;
