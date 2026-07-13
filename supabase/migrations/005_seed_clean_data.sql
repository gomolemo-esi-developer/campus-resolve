-- ============================================================================
-- CLEAN SEED DATA FOR CAMPUS ADMIN TABLES - FULLY POPULATED
-- Production-ready sample data: 7 campuses, 3+ records per table/tab category
-- Generated: March 14, 2026
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SEED CAMPUSES (7 records - matching residence/staff tabs)
-- ============================================================================
INSERT INTO public.campuses (id, name, abbreviation, location, created_at, updated_at, created_by, updated_by) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Soshanguve North Campus', 'SN', '933 Lucas Meyer Street, Theresapark, Akasia 0081', NOW(), NOW(), NULL, NULL),
  ('a0000000-0000-0000-0000-000000000002', 'Soshanguve South Campus', 'SS', 'Cnr Main & Second Avenue, Soshanguve, Pretoria 0152', NOW(), NOW(), NULL, NULL),
  ('a0000000-0000-0000-0000-000000000003', 'Arcadia Campus', 'ARC', '345 Arcadia Avenue, Arcadia, Pretoria 0007', NOW(), NOW(), NULL, NULL),
  ('a0000000-0000-0000-0000-000000000004', 'Arts Campus', 'ARTS', '123 Arts Boulevard, Pretoria, Pretoria 0001', NOW(), NOW(), NULL, NULL),
  ('a0000000-0000-0000-0000-000000000005', 'Emalahleni Campus', 'EMA', '456 Industrial Avenue, Emalahleni, Mpumalanga 1035', NOW(), NOW(), NULL, NULL),
  ('a0000000-0000-0000-0000-000000000006', 'Polokwane Campus', 'POL', '789 Growth Street, Polokwane, Limpopo 0699', NOW(), NOW(), NULL, NULL),
  ('a0000000-0000-0000-0000-000000000007', 'Pretoria Campus', 'PT', '200 Union Avenue, Pretoria, Gauteng 0083', NOW(), NOW(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED FACULTIES (4 records to support extended departments)
-- ============================================================================
INSERT INTO public.faculties (id, name, abbreviation, created_at, updated_at, created_by, updated_by) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Faculty of Arts & Sciences', 'ART', NOW(), NOW(), NULL, NULL),
  ('b0000000-0000-0000-0000-000000000002', 'Faculty of Engineering & Built Environment', 'FEBE', NOW(), NOW(), NULL, NULL),
  ('b0000000-0000-0000-0000-000000000003', 'Faculty of Information & Communication Technology', 'ICT', NOW(), NOW(), NULL, NULL),
  ('b0000000-0000-0000-0000-000000000004', 'Faculty of Business & Management', 'BUM', NOW(), NOW(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED DEPARTMENTS (9 records)
-- ============================================================================
INSERT INTO public.departments (id, name, abbreviation, faculty_id, created_at, updated_at, created_by, updated_by) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Multimedia Computing', 'MC', 'b0000000-0000-0000-0000-000000000003', NOW(), NOW(), NULL, NULL),
  ('c0000000-0000-0000-0000-000000000002', 'Information Technology Services', 'ITS', 'b0000000-0000-0000-0000-000000000003', NOW(), NOW(), NULL, NULL),
  ('c0000000-0000-0000-0000-000000000003', 'Civil Engineering', 'CE', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW(), NULL, NULL),
  ('c0000000-0000-0000-0000-000000000004', 'Electrical Engineering', 'EE', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW(), NULL, NULL),
  ('c0000000-0000-0000-0000-000000000005', 'Chemical Engineering', 'CHE', 'b0000000-0000-0000-0000-000000000002', NOW(), NOW(), NULL, NULL),
  ('c0000000-0000-0000-0000-000000000006', 'Business Management', 'BM', 'b0000000-0000-0000-0000-000000000004', NOW(), NOW(), NULL, NULL),
  ('c0000000-0000-0000-0000-000000000007', 'Human Resources', 'HR', 'b0000000-0000-0000-0000-000000000004', NOW(), NOW(), NULL, NULL),
  ('c0000000-0000-0000-0000-000000000008', 'Computer Science', 'CS', 'b0000000-0000-0000-0000-000000000003', NOW(), NOW(), NULL, NULL),
  ('c0000000-0000-0000-0000-000000000009', 'Applied Sciences', 'AS', 'b0000000-0000-0000-0000-000000000001', NOW(), NOW(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED COURSES (39 records) - 3 per qualification type
-- Tab Categories: HCert, Dip, ND, ExP, B, BH, M, D, PG, Hon, BT, MT, PhD
-- ============================================================================

-- HCERT (Higher Certificate) - 3 records
INSERT INTO public.courses (id, code, name, department_id, faculty_id, qualification_type, created_at, updated_at, created_by, updated_by) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'HCT101', 'Higher Certificate in IT Support', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'HCert', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000002', 'HCT102', 'Higher Certificate in Systems Administration', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'HCert', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000003', 'HCT103', 'Higher Certificate in Business Analysis', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'HCert', NOW(), NOW(), NULL, NULL),

-- DIP (Diploma) - 3 records
  ('d0000000-0000-0000-0000-000000000004', 'DIP101', 'Diploma in Computer Support', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'Dip', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000005', 'DIP102', 'Diploma in Information Systems', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'Dip', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000006', 'DIP103', 'Diploma in Network Engineering', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'Dip', NOW(), NOW(), NULL, NULL),

-- ND (National Diploma) - 3 records
  ('d0000000-0000-0000-0000-000000000007', 'ND201', 'National Diploma in Multimedia', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'ND', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000008', 'ND202', 'National Diploma in Information Technology', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'ND', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000009', 'ND203', 'National Diploma in Software Development', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'ND', NOW(), NOW(), NULL, NULL),

-- ExP (Extended Programme) - 3 records
  ('d0000000-0000-0000-0000-000000000010', 'EXP301', 'Extended Programme in Engineering', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'ExP', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000011', 'EXP302', 'Extended Programme in Science', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'ExP', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000012', 'EXP303', 'Extended Programme in Technology', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'ExP', NOW(), NOW(), NULL, NULL),

-- B (Bachelor) - 3 records
  ('d0000000-0000-0000-0000-000000000013', 'BAC401', 'Bachelor of Science in Computer Science', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'B', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000014', 'BAC402', 'Bachelor of Arts in Communication', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'B', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000015', 'BAC403', 'Bachelor of Business Administration', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 'B', NOW(), NOW(), NULL, NULL),

-- BH (Bachelor Honours) - 3 records
  ('d0000000-0000-0000-0000-000000000016', 'BHN501', 'Bachelor of Science Honours in IT', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'BH', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000017', 'BHN502', 'Bachelor of Science Honours in Engineering', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'BH', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000018', 'BHN503', 'Bachelor of Science Honours in Chemistry', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'BH', NOW(), NOW(), NULL, NULL),

-- M (Masters) - 3 records
  ('d0000000-0000-0000-0000-000000000019', 'MSC601', 'Master of Science in Information Technology', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'M', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000020', 'MSC602', 'Master of Science in Engineering', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'M', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000021', 'MBA603', 'Master of Business Administration', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 'M', NOW(), NOW(), NULL, NULL),

-- D (Doctorate) - 3 records
  ('d0000000-0000-0000-0000-000000000022', 'PHD701', 'Doctor of Philosophy in Computer Science', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'D', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000023', 'PHD702', 'Doctor of Philosophy in Engineering', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'D', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000024', 'DBA703', 'Doctor of Business Administration', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 'D', NOW(), NOW(), NULL, NULL),

-- PG (Postgraduate Diploma) - 3 records
  ('d0000000-0000-0000-0000-000000000025', 'PGD801', 'Postgraduate Diploma in Advanced Technology', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'PG', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000026', 'PGD802', 'Postgraduate Diploma in Systems Engineering', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'PG', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000027', 'PGD803', 'Postgraduate Diploma in Management', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 'PG', NOW(), NOW(), NULL, NULL),

-- Hon (Honours) - 3 records
  ('d0000000-0000-0000-0000-000000000028', 'HON901', 'Honours in Information Systems', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'Hon', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000029', 'HON902', 'Honours in Civil Engineering', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Hon', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000030', 'HON903', 'Honours in Business Studies', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 'Hon', NOW(), NOW(), NULL, NULL),

-- BT (Bachelor of Technology) - 3 records
  ('d0000000-0000-0000-0000-000000000031', 'BTech401', 'Bachelor of Technology in Software Development', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'BT', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000032', 'BTech402', 'Bachelor of Technology in Civil Engineering', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'BT', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000033', 'BTech403', 'Bachelor of Technology in Electrical Engineering', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'BT', NOW(), NOW(), NULL, NULL),

-- MT (Master of Technology) - 3 records
  ('d0000000-0000-0000-0000-000000000034', 'MTech501', 'Master of Technology in Software Engineering', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'MT', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000035', 'MTech502', 'Master of Technology in Structural Engineering', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'MT', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000036', 'MTech503', 'Master of Technology in Engineering Management', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'MT', NOW(), NOW(), NULL, NULL),

-- PhD (Doctor of Philosophy/Research) - 3 records
  ('d0000000-0000-0000-0000-000000000037', 'PHDR701', 'PhD in Information Technology Research', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 'PhD', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000038', 'PHDR702', 'PhD in Engineering Research', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'PhD', NOW(), NOW(), NULL, NULL),
  ('d0000000-0000-0000-0000-000000000039', 'PHDR703', 'PhD in Applied Sciences Research', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'PhD', NOW(), NOW(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED MODULES (12 records) - 3 per course
-- Courses mapped: HCT101 (d001), DIP102 (d005), BAC401 (d013), BAC402 (d014)
-- ============================================================================
INSERT INTO public.modules (id, code, name, course_id, department_id, faculty_id, credits, semester, created_at, updated_at, created_by, updated_by) VALUES
  -- HCT101: Higher Certificate in IT Support (d001 → ITS Dept → ICT Faculty)
  ('e0000000-0000-0000-0000-000000000001', 'ITD101', 'IT Systems & Architecture', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 15, 1, NOW(), NOW(), NULL, NULL),
  ('e0000000-0000-0000-0000-000000000002', 'ITD102', 'Database Fundamentals', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 15, 1, NOW(), NOW(), NULL, NULL),
  ('e0000000-0000-0000-0000-000000000003', 'ITD103', 'Network Administration', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 15, 2, NOW(), NOW(), NULL, NULL),
  
  -- DIP102: Diploma in Information Systems (d005 → Computer Science Dept → ICT Faculty)
  ('e0000000-0000-0000-0000-000000000004', 'MM201', 'Digital Graphics & Design', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 18, 1, NOW(), NOW(), NULL, NULL),
  ('e0000000-0000-0000-0000-000000000005', 'MM202', 'Web Design & Development', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 18, 1, NOW(), NOW(), NULL, NULL),
  ('e0000000-0000-0000-0000-000000000006', 'MM203', 'Animation & Video Production', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 18, 2, NOW(), NOW(), NULL, NULL),
  
  -- BAC401: Bachelor of Science in Computer Science (d013 → Computer Science Dept → ICT Faculty)
  ('e0000000-0000-0000-0000-000000000007', 'CS301', 'Data Structures & Algorithms', 'd0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 24, 1, NOW(), NOW(), NULL, NULL),
  ('e0000000-0000-0000-0000-000000000008', 'CS302', 'Software Engineering Principles', 'd0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 24, 1, NOW(), NOW(), NULL, NULL),
  ('e0000000-0000-0000-0000-000000000009', 'CS303', 'Database Management Systems', 'd0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000003', 24, 2, NOW(), NOW(), NULL, NULL),
  
  -- BAC402: Bachelor of Arts in Communication (d014 → Applied Sciences Dept → Arts & Sciences Faculty)
  ('e0000000-0000-0000-0000-000000000010', 'CE401', 'Structural Analysis', 'd0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 24, 1, NOW(), NOW(), NULL, NULL),
  ('e0000000-0000-0000-0000-000000000011', 'CE402', 'Foundation Design', 'd0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 24, 2, NOW(), NOW(), NULL, NULL),
  ('e0000000-0000-0000-0000-000000000012', 'CE403', 'Construction Management', 'd0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 24, 2, NOW(), NOW(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED ROLES (5 records)
-- ============================================================================
INSERT INTO public.roles (id, role, level, created_at, updated_at, created_by, updated_by) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'Lecturer', 5, NOW(), NOW(), NULL, NULL),
  ('f0000000-0000-0000-0000-000000000002', 'Senior Lecturer', 6, NOW(), NOW(), NULL, NULL),
  ('f0000000-0000-0000-0000-000000000003', 'Professor', 8, NOW(), NOW(), NULL, NULL),
  ('f0000000-0000-0000-0000-000000000004', 'Assistant Lecturer', 4, NOW(), NOW(), NULL, NULL),
  ('f0000000-0000-0000-0000-000000000005', 'Associate Professor', 7, NOW(), NOW(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED STAFF (21 records) - 3 per campus
-- ============================================================================
INSERT INTO public.staff (id, staff_id, title, initials, first_name, last_name, role, department_id, level, campus_id, campus, email, phone, image_url, created_at, updated_at, created_by, updated_by) VALUES
  -- Soshanguve North (3)
  ('f5000000-0000-0000-0000-000000000001'::uuid, 'S10245', 'Dr.', 'MN', 'Mpho', 'Ndlela', 'Lecturer', 'c0000000-0000-0000-0000-000000000002'::uuid, 5, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Soshanguve North', 'mpho.ndlela@tut.ac.za', '+27 12 382 5123', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000002'::uuid, 'S10246', 'Prof.', 'LK', 'Lindiwe', 'Khumalo', 'Senior Lecturer', 'c0000000-0000-0000-0000-000000000001'::uuid, 6, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Soshanguve North', 'l.khumalo@tut.ac.za', '+27 12 382 5145', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000003'::uuid, 'S10247', 'Mr.', 'TM', 'Themba', 'Mthembu', 'Assistant Lecturer', 'c0000000-0000-0000-0000-000000000002'::uuid, 4, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Soshanguve North', 'themba.mthembu@tut.ac.za', '+27 12 382 5167', NULL, NOW(), NOW(), NULL, NULL),
  
  -- Soshanguve South (3)
  ('f5000000-0000-0000-0000-000000000004'::uuid, 'S10248', 'Dr.', 'JM', 'Johan', 'van der Merwe', 'Lecturer', 'c0000000-0000-0000-0000-000000000003'::uuid, 5, 'a0000000-0000-0000-0000-000000000002'::uuid, 'Soshanguve South', 'j.vdmerwe@tut.ac.za', '+27 12 382 5200', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000005'::uuid, 'S10249', 'Prof.', 'AZ', 'Andile', 'Zwane', 'Professor', 'c0000000-0000-0000-0000-000000000004'::uuid, 8, 'a0000000-0000-0000-0000-000000000002'::uuid, 'Soshanguve South', 'a.zwane@tut.ac.za', '+27 12 382 5220', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000006'::uuid, 'S10250', 'Ms.', 'NM', 'Nomsa', 'Mkhize', 'Senior Lecturer', 'c0000000-0000-0000-0000-000000000003'::uuid, 6, 'a0000000-0000-0000-0000-000000000002'::uuid, 'Soshanguve South', 'nomsa.mkhize@tut.ac.za', '+27 12 382 5240', NULL, NOW(), NOW(), NULL, NULL),
  
  -- Arcadia (3)
  ('f5000000-0000-0000-0000-000000000007'::uuid, 'S10251', 'Dr.', 'DP', 'Dirk', 'Pieterse', 'Professor', 'c0000000-0000-0000-0000-000000000005'::uuid, 8, 'a0000000-0000-0000-0000-000000000003'::uuid, 'Arcadia', 'dirk.pieterse@tut.ac.za', '+27 12 382 5260', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000008'::uuid, 'S10252', 'Mr.', 'SC', 'Samuel', 'Chirwa', 'Lecturer', 'c0000000-0000-0000-0000-000000000005'::uuid, 5, 'a0000000-0000-0000-0000-000000000003'::uuid, 'Arcadia', 'samuel.chirwa@tut.ac.za', '+27 12 382 5280', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000009'::uuid, 'S10253', 'Ms.', 'TV', 'Thandi', 'Vilakazi', 'Associate Professor', 'c0000000-0000-0000-0000-000000000006'::uuid, 7, 'a0000000-0000-0000-0000-000000000003'::uuid, 'Arcadia', 'thandi.vilakazi@tut.ac.za', '+27 12 382 5300', NULL, NOW(), NOW(), NULL, NULL),
  
  -- Arts Campus (3)
  ('f5000000-0000-0000-0000-000000000010'::uuid, 'S10254', 'Prof.', 'KM', 'Khaya', 'Madlingozi', 'Associate Professor', 'c0000000-0000-0000-0000-000000000009'::uuid, 7, 'a0000000-0000-0000-0000-000000000004'::uuid, 'Arts', 'khaya.madlingozi@tut.ac.za', '+27 12 382 5320', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000011'::uuid, 'S10255', 'Dr.', 'ER', 'Enoch', 'Radebe', 'Lecturer', 'c0000000-0000-0000-0000-000000000009'::uuid, 5, 'a0000000-0000-0000-0000-000000000004'::uuid, 'Arts', 'enoch.radebe@tut.ac.za', '+27 12 382 5340', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000012'::uuid, 'S10256', 'Ms.', 'ZN', 'Zandile', 'Nkosi', 'Senior Lecturer', 'c0000000-0000-0000-0000-000000000009'::uuid, 6, 'a0000000-0000-0000-0000-000000000004'::uuid, 'Arts', 'zandile.nkosi@tut.ac.za', '+27 12 382 5360', NULL, NOW(), NOW(), NULL, NULL),
  
  -- Emalahleni (3)
  ('f5000000-0000-0000-0000-000000000013'::uuid, 'S10257', 'Dr.', 'MJ', 'Mthunzi', 'Jele', 'Professor', 'c0000000-0000-0000-0000-000000000003'::uuid, 8, 'a0000000-0000-0000-0000-000000000005'::uuid, 'Emalahleni', 'mthunzi.jele@tut.ac.za', '+27 13 655 2000', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000014'::uuid, 'S10258', 'Mr.', 'BP', 'Bongani', 'Phalane', 'Lecturer', 'c0000000-0000-0000-0000-000000000004'::uuid, 5, 'a0000000-0000-0000-0000-000000000005'::uuid, 'Emalahleni', 'bongani.phalane@tut.ac.za', '+27 13 655 2020', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000015'::uuid, 'S10259', 'Ms.', 'LD', 'Lerato', 'Dlamini', 'Associate Professor', 'c0000000-0000-0000-0000-000000000003'::uuid, 7, 'a0000000-0000-0000-0000-000000000005'::uuid, 'Emalahleni', 'lerato.dlamini@tut.ac.za', '+27 13 655 2040', NULL, NOW(), NOW(), NULL, NULL),
  
  -- Polokwane (3)
  ('f5000000-0000-0000-0000-000000000016'::uuid, 'S10260', 'Prof.', 'SM', 'Sipho', 'Mahlangu', 'Professor', 'c0000000-0000-0000-0000-000000000006'::uuid, 8, 'a0000000-0000-0000-0000-000000000006'::uuid, 'Polokwane', 'sipho.mahlangu@tut.ac.za', '+27 15 291 1000', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000017'::uuid, 'S10261', 'Dr.', 'PJ', 'Paullina', 'Jafari', 'Senior Lecturer', 'c0000000-0000-0000-0000-000000000006'::uuid, 6, 'a0000000-0000-0000-0000-000000000006'::uuid, 'Polokwane', 'paullina.jafari@tut.ac.za', '+27 15 291 1020', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000018'::uuid, 'S10262', 'Mr.', 'RS', 'Reginald', 'Sithole', 'Lecturer', 'c0000000-0000-0000-0000-000000000007'::uuid, 5, 'a0000000-0000-0000-0000-000000000006'::uuid, 'Polokwane', 'reginald.sithole@tut.ac.za', '+27 15 291 1040', NULL, NOW(), NOW(), NULL, NULL),
  
  -- Pretoria (3)
  ('f5000000-0000-0000-0000-000000000019'::uuid, 'S10263', 'Prof.', 'CL', 'Clive', 'Lolwane', 'Professor', 'c0000000-0000-0000-0000-000000000008'::uuid, 8, 'a0000000-0000-0000-0000-000000000007'::uuid, 'Pretoria', 'clive.lolwane@tut.ac.za', '+27 12 382 8000', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000020'::uuid, 'S10264', 'Dr.', 'RT', 'Ravi', 'Tharavadu', 'Associate Professor', 'c0000000-0000-0000-0000-000000000008'::uuid, 7, 'a0000000-0000-0000-0000-000000000007'::uuid, 'Pretoria', 'ravi.tharavadu@tut.ac.za', '+27 12 382 8020', NULL, NOW(), NOW(), NULL, NULL),
  ('f5000000-0000-0000-0000-000000000021'::uuid, 'S10265', 'Ms.', 'HT', 'Hadiah', 'Tjale', 'Senior Lecturer', 'c0000000-0000-0000-0000-000000000002'::uuid, 6, 'a0000000-0000-0000-0000-000000000007'::uuid, 'Pretoria', 'hadiah.tjale@tut.ac.za', '+27 12 382 8040', NULL, NOW(), NOW(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED RESIDENCES (21 records) - 3 per campus
-- ============================================================================
INSERT INTO public.residences (id, residence_id, residence, address, residence_type, manager, campus_id, campus, capacity, current_occupancy, created_at, updated_at, created_by, updated_by) VALUES
  -- Soshanguve North (3)
  ('f6000000-0000-0000-0000-000000000001'::uuid, 'R001', 'Mosa Court', '445 Mosa Drive, Soshanguve North, Pretoria 0081', 'On-Campus', 'Mr. Thabo Mkhize', 'a0000000-0000-0000-0000-000000000001'::uuid, 'Soshanguve North', 120, 110, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000002'::uuid, 'R002', 'Emoya Residence', '567 Cedar Avenue, Soshanguve North, Pretoria 0081', 'On-Campus', 'Ms. Thandiwe Molefe', 'a0000000-0000-0000-0000-000000000001'::uuid, 'Soshanguve North', 95, 88, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000003'::uuid, 'R003', 'Harmony House', '890 Oak Lane, Soshanguve North, Pretoria 0081', 'On-Campus', 'Mr. Sipho Dlamini', 'a0000000-0000-0000-0000-000000000001'::uuid, 'Soshanguve North', 140, 125, NOW(), NOW(), NULL, NULL),
  
  -- Soshanguve South (3)
  ('f6000000-0000-0000-0000-000000000004'::uuid, 'R004', 'Soshi Village', '234 Main Street, Soshanguve South, Pretoria 0152', 'On-Campus', 'Ms. Kholeka Nxumalo', 'a0000000-0000-0000-0000-000000000002'::uuid, 'Soshanguve South', 110, 102, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000005'::uuid, 'R005', 'Student Haven', '456 Second Avenue, Soshanguve South, Pretoria 0152', 'On-Campus', 'Mr. Mandla Sithole', 'a0000000-0000-0000-0000-000000000002'::uuid, 'Soshanguve South', 130, 118, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000006'::uuid, 'R006', 'Unity Hostel', '789 Station Road, Soshanguve South, Pretoria 0152', 'Off-Campus', 'Ms. Patricia Mokoena', 'a0000000-0000-0000-0000-000000000002'::uuid, 'Soshanguve South', 85, 75, NOW(), NOW(), NULL, NULL),
  
  -- Arcadia (3)
  ('f6000000-0000-0000-0000-000000000007'::uuid, 'R007', 'Arcadia Residence', '120 Arcadia Street, Arcadia, Pretoria 0007', 'On-Campus', 'Ms. Lerato Dlamini', 'a0000000-0000-0000-0000-000000000003'::uuid, 'Arcadia', 95, 87, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000008'::uuid, 'R008', 'Arcadia Plaza', '100 Pretoria Avenue, Arcadia, Pretoria 0007', 'On-Campus', 'Mr. Themba Ngcamu', 'a0000000-0000-0000-0000-000000000003'::uuid, 'Arcadia', 120, 105, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000009'::uuid, 'R009', 'Park Gardens', '150 Bricks Street, Arcadia, Pretoria 0007', 'On-Campus', 'Ms. Naledi Mboyi', 'a0000000-0000-0000-0000-000000000003'::uuid, 'Arcadia', 100, 92, NOW(), NOW(), NULL, NULL),
  
  -- Arts Campus (3)
  ('f6000000-0000-0000-0000-000000000010'::uuid, 'R010', 'Arts Commons', '200 Union Avenue, Pretoria, Gauteng 0001', 'On-Campus', 'Mr. Sibusiso Zulu', 'a0000000-0000-0000-0000-000000000004'::uuid, 'Arts', 160, 148, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000011'::uuid, 'R011', 'Heritage Hall', '210 Union Avenue, Pretoria, Gauteng 0001', 'On-Campus', 'Ms. Grace Nkhosi', 'a0000000-0000-0000-0000-000000000004'::uuid, 'Arts', 140, 128, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000012'::uuid, 'R012', 'Unity Court', '220 Union Avenue, Pretoria, Gauteng 0001', 'Off-Campus', 'Mr. Teboho Moloto', 'a0000000-0000-0000-0000-000000000004'::uuid, 'Arts', 110, 98, NOW(), NOW(), NULL, NULL),
  
  -- Emalahleni (3)
  ('f6000000-0000-0000-0000-000000000013'::uuid, 'R013', 'Emalahleni Lodge', '567 Industrial Avenue, Emalahleni, Mpumalanga 1035', 'On-Campus', 'Mr. Joshua Banda', 'a0000000-0000-0000-0000-000000000005'::uuid, 'Emalahleni', 100, 92, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000014'::uuid, 'R014', 'Miners Residence', '580 Industrial Avenue, Emalahleni, Mpumalanga 1035', 'On-Campus', 'Ms. Precious Ngcobo', 'a0000000-0000-0000-0000-000000000005'::uuid, 'Emalahleni', 95, 85, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000015'::uuid, 'R015', 'Coal City Hostel', '600 Church Street, Emalahleni, Mpumalanga 1035', 'Off-Campus', 'Mr. Khaya Mbobo', 'a0000000-0000-0000-0000-000000000005'::uuid, 'Emalahleni', 80, 68, NOW(), NOW(), NULL, NULL),
  
  -- Polokwane (3)
  ('f6000000-0000-0000-0000-000000000016'::uuid, 'R016', 'Limpopo Lodge', '456 Growth Street, Polokwane, Limpopo 0699', 'On-Campus', 'Mr. Vusi Nkomo', 'a0000000-0000-0000-0000-000000000006'::uuid, 'Polokwane', 110, 102, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000017'::uuid, 'R017', 'Rising Sun Residence', '470 Growth Street, Polokwane, Limpopo 0699', 'On-Campus', 'Ms. Bongiwe Mthembu', 'a0000000-0000-0000-0000-000000000006'::uuid, 'Polokwane', 100, 88, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000018'::uuid, 'R018', 'Gateway Hostel', '500 Market Street, Polokwane, Limpopo 0699', 'Off-Campus', 'Mr. Malusi Hlongwane', 'a0000000-0000-0000-0000-000000000006'::uuid, 'Polokwane', 90, 78, NOW(), NOW(), NULL, NULL),
  
  -- Pretoria (3)
  ('f6000000-0000-0000-0000-000000000019'::uuid, 'R019', 'Student Village', '678 University Road, Hatfield, Pretoria 0083', 'Off-Campus', 'Mr. Andile Mbatha', 'a0000000-0000-0000-0000-000000000007'::uuid, 'Pretoria', 200, 165, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000020'::uuid, 'R020', 'Campus Court', '200 Union Avenue, Pretoria, Gauteng 0083', 'On-Campus', 'Ms. Zanele Mthembu', 'a0000000-0000-0000-0000-000000000007'::uuid, 'Pretoria', 150, 138, NOW(), NOW(), NULL, NULL),
  ('f6000000-0000-0000-0000-000000000021'::uuid, 'R021', 'Academic Plaza', '215 Union Avenue, Pretoria, Gauteng 0083', 'On-Campus', 'Mr. Themba Moloi', 'a0000000-0000-0000-0000-000000000007'::uuid, 'Pretoria', 120, 108, NOW(), NOW(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED EXTRACURRICULARS (15 records) - 3 per category
-- Categories: Sports, Indigenous Activities, Religious, Social Justice, Student Governance
-- ============================================================================

-- Sports (3)
INSERT INTO public.extracurriculars (id, activity, category, department_id, description, contact_person, created_at, updated_at, created_by, updated_by) VALUES
  ('f7000000-0000-0000-0000-000000000001', 'Football Club', 'Sports', 'c0000000-0000-0000-0000-000000000001', 'University football team competing in national leagues', 'Coach Samuel Banda', NOW(), NOW(), NULL, NULL),
  ('f7000000-0000-0000-0000-000000000002', 'Netball Team', 'Sports', 'c0000000-0000-0000-0000-000000000001', 'Women''s netball team for competitive play', 'Coach Maria Zwane', NOW(), NOW(), NULL, NULL),
  ('f7000000-0000-0000-0000-000000000003', 'Rugby Club', 'Sports', 'c0000000-0000-0000-0000-000000000001', 'Rugby union club with development program', 'Coach Jan Pieterse', NOW(), NOW(), NULL, NULL),

-- Indigenous Activities (3)
  ('f7000000-0000-0000-0000-000000000004', 'Traditional Dance Society', 'Indigenous Activities', 'c0000000-0000-0000-0000-000000000009', 'Preservation and promotion of traditional South African dance', 'Dr. Thandi Gumede', NOW(), NOW(), NULL, NULL),
  ('f7000000-0000-0000-0000-000000000005', 'Drum Circle', 'Indigenous Activities', 'c0000000-0000-0000-0000-000000000009', 'African drumming and percussion ensemble', 'Mr. Mfundo Khanyi', NOW(), NOW(), NULL, NULL),
  ('f7000000-0000-0000-0000-000000000006', 'Ubuntu Philosophy Club', 'Indigenous Activities', 'c0000000-0000-0000-0000-000000000009', 'Discussion and study of African philosophical thought', 'Prof. Mandla Shabalala', NOW(), NOW(), NULL, NULL),

-- Religious (3)
  ('f7000000-0000-0000-0000-000000000007', 'Christian Fellowship', 'Religious', 'c0000000-0000-0000-0000-000000000009', 'Interfaith Christian student community', 'Pastor David Mokoena', NOW(), NOW(), NULL, NULL),
  ('f7000000-0000-0000-0000-000000000008', 'Muslim Students Association', 'Religious', 'c0000000-0000-0000-0000-000000000009', 'Support group for Muslim students on campus', 'Imam Rasheed Hassan', NOW(), NOW(), NULL, NULL),
  ('f7000000-0000-0000-0000-000000000009', 'Hindu Cultural Circle', 'Religious', 'c0000000-0000-0000-0000-000000000009', 'Celebration of Hindu festivals and traditions', 'Ms. Priya Nair', NOW(), NOW(), NULL, NULL),

-- Social Justice (3)
  ('f7000000-0000-0000-0000-000000000010', 'IT Skills Competition', 'Social Justice', 'c0000000-0000-0000-0000-000000000002', 'Annual coding and IT skills competition for students', 'Dr. Khubone Zwane', NOW(), NOW(), NULL, NULL),
  ('f7000000-0000-0000-0000-000000000011', 'Digital Design Club', 'Social Justice', 'c0000000-0000-0000-0000-000000000001', 'Creative digital design and multimedia projects', 'Ms. Lindiwe Mthembu', NOW(), NOW(), NULL, NULL),
  ('f7000000-0000-0000-0000-000000000012', 'Engineering Mentorship Program', 'Social Justice', 'c0000000-0000-0000-0000-000000000003', 'Mentorship program for engineering students', 'Prof. Dirk Pieterse', NOW(), NOW(), NULL, NULL),

-- Student Governance (3)
  ('f7000000-0000-0000-0000-000000000013', 'Student Representative Council', 'Student Governance', 'c0000000-0000-0000-0000-000000000006', 'Main student governance body on campus', 'Ms. Amahle Dlamini', NOW(), NOW(), NULL, NULL),
  ('f7000000-0000-0000-0000-000000000014', 'Residence Council', 'Student Governance', 'c0000000-0000-0000-0000-000000000007', 'Residence student governance and affairs', 'Mr. Lebogang Mahlangu', NOW(), NOW(), NULL, NULL),
  ('f7000000-0000-0000-0000-000000000015', 'Academic Forum', 'Student Governance', 'c0000000-0000-0000-0000-000000000008', 'Student academic advocacy and curriculum feedback', 'Ms. Zanele Khumalo', NOW(), NOW(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFY SEED DATA
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
SELECT 'Roles', COUNT(*) FROM public.roles
UNION ALL
SELECT 'Staff', COUNT(*) FROM public.staff
UNION ALL
SELECT 'Residences', COUNT(*) FROM public.residences
UNION ALL
SELECT 'Extracurriculars', COUNT(*) FROM public.extracurriculars;

-- ============================================================================
-- SAMPLE QUERIES TO TEST DATA
-- ============================================================================

-- Get all courses grouped by qualification type
SELECT qualification_type, COUNT(*) as course_count
FROM courses
GROUP BY qualification_type
ORDER BY qualification_type;

-- Get residences by campus
SELECT campus, COUNT(*) as residence_count, SUM(capacity) as total_capacity, SUM(current_occupancy) as total_occupied
FROM residences
GROUP BY campus
ORDER BY campus;

-- Get extracurriculars by category
SELECT category, COUNT(*) as activity_count
FROM extracurriculars
GROUP BY category
ORDER BY category;

-- Get staff distribution by campus
SELECT campus, COUNT(*) as staff_count
FROM staff
GROUP BY campus
ORDER BY campus;
