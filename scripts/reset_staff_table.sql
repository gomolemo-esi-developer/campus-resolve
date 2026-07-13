-- =============================================
-- SCRIPT 1: COMPLETELY RESET AND POPULATE STAFF TABLE
-- Run this in Supabase SQL Editor to delete and recreate staff with full data
-- =============================================

-- Step 1: Delete all existing staff data
TRUNCATE staff CASCADE;

-- Step 2: Insert new staff data with complete fields
INSERT INTO staff (
    staff_id, title, initials, first_name, last_name, role,
    department_id, level, campus_id, campus, email, phone,
    created_at, updated_at, cognito_sub, user_type,
    faculty, location, office_location,
    professional_entries, professional_modules,
    course, course_code, extracurricular, residence
)
VALUES
-- Prof Adams - Business Management
(
    'STF001', 'Prof', 'AP', 'Prof', 'Adams', 'HOD',
    'c0000000-0000-0000-0000-000000000006', 9, 'a0000000-0000-0000-0000-000000000002',
    'Soshanguve South Campus', 'prof.adams@campus.edu', '0125552001',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Business & Management', 'Block A, Room 101', 'Block A, Office 101',
    '[{"id": "prof-1", "entryType": "department", "departmentName": "Business Management", "departmentCode": "BM", "facultyName": "Faculty of Business & Management", "facultyCode": "BUM", "isCurrent": true}]'::jsonb,
    '["m001", "m002", "m003"]'::jsonb,
    'National Diploma in Business Management', 'NDVM16',
    'Sports Committee', 'TUT Residence A'
),

-- Dr Banda - Civil Engineering  
(
    'STF002', 'Dr', 'MB', 'Dr', 'Banda', 'Lecturer',
    'c0000000-0000-0000-0000-000000000003', 7, 'a0000000-0000-0000-0000-000000000006',
    'Polokwane Campus', 'dr.banda@campus.edu', '0125552002',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Engineering & Built Environment', 'Block B, Room 205', 'Block B, Office 205',
    '[{"id": "prof-2", "entryType": "course", "courseName": "National Diploma in Multimedia", "courseCode": "ND201", "facultyName": "Faculty of Engineering & Built Environment", "facultyCode": "FEBE", "isCurrent": true}]'::jsonb,
    '["m004", "m005"]'::jsonb,
    'Bachelor of Engineering in Civil Engineering', 'BENGCE',
    'Research Club', 'TUT Residence B'
),

-- Mrs Ngema - IT Services
(
    'STF003', 'Mrs', 'JN', 'Mrs', 'Ngema', 'Administrator',
    'c0000000-0000-0000-0000-000000000002', 5, 'a0000000-0000-0000-0000-000000000001',
    'Soshanguve North Campus', 'j.ngema@campus.edu', '0125552003',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Information & Communication Technology', 'Admin Block, Room 10', 'Admin Block, Office 10',
    '[]'::jsonb,
    '["m006", "m007", "m008", "m009"]'::jsonb,
    'Higher Certificate in IT', 'HCIT01',
    'Tech Club', NULL
),

-- Mr Khosa - Applied Sciences
(
    'STF004', 'Mr', 'DK', 'Mr', 'Khosa', 'Senior Lecturer',
    'c0000000-0000-0000-0000-000000000009', 8, 'a0000000-0000-0000-0000-000000000004',
    'Arts Campus', 'mr.khosa@campus.edu', '0125552004',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Arts & Sciences', 'Science Block, Room 302', 'Science Block, Office 302',
    '[{"id": "prof-3", "entryType": "faculty", "facultyName": "Faculty of Arts & Sciences", "facultyCode": "ART", "isCurrent": true}]'::jsonb,
    '["m010"]'::jsonb,
    'Bachelor of Science in Applied Sciences', 'BSCAS',
    'Science Fair Committee', 'TUT Residence C'
),

-- Dr Van Der Merwe - Multimedia Computing
(
    'STF005', 'Dr', 'MV', 'Dr', 'Van Der Merwe', 'Researcher',
    'c0000000-0000-0000-0000-000000000001', 8, 'a0000000-0000-0000-0000-000000000003',
    'Arcadia Campus', 'dr.vdmerwe@campus.edu', '0125552005',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Information & Communication Technology', 'Research Lab, Room 1', 'Research Lab, Office 1',
    '[{"id": "prof-4", "entryType": "department", "departmentName": "Multimedia Computing", "departmentCode": "MC", "facultyName": "Faculty of Information & Communication Technology", "facultyCode": "ICT", "isCurrent": true}]'::jsonb,
    '["m011", "m012"]'::jsonb,
    'Master of Science in Multimedia', 'MSC MM',
    'Academic Board', NULL
),

-- Prof Luthuli - Chemical Engineering
(
    'STF006', 'Prof', 'LM', 'Prof', 'Luthuli', 'Dean',
    'c0000000-0000-0000-0000-000000000005', 9, 'a0000000-0000-0000-0000-000000000005',
    'Emalahleni Campus', 'prof.luthuli@campus.edu', '0125552006',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Engineering & Built Environment', 'Engineering Block, Floor 5', 'Engineering Block, Office 501',
    '[{"id": "prof-5", "entryType": "faculty", "facultyName": "Faculty of Engineering & Built Environment", "facultyCode": "FEBE", "isCurrent": true}]'::jsonb,
    '[]'::jsonb,
    'PhD in Chemical Engineering', 'PHDCHE',
    'Engineering Faculty Board', 'TUT Residence D'
),

-- Mr Sibiya - Electrical Engineering
(
    'STF007', 'Mr', 'TS', 'Mr', 'Sibiya', 'Lab Technician',
    'c0000000-0000-0000-0000-000000000004', 4, 'a0000000-0000-0000-0000-000000000007',
    'Pretoria Campus', 'mr.sibiya@campus.edu', '0125552007',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Engineering & Built Environment', 'Engineering Lab, Room 101', 'Engineering Lab, Office 101',
    '[]'::jsonb,
    '[]'::jsonb,
    NULL, NULL,
    NULL, NULL
),

-- Ms Ross - Computer Science
(
    'STF008', 'Ms', 'HR', 'Ms', 'Ross', 'Lecturer',
    'c0000000-0000-0000-0000-000000000008', 6, 'a0000000-0000-0000-0000-000000000004',
    'Arts Campus', 'ms.ross@campus.edu', '0125552008',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Arts & Sciences', 'Humanities Building, Room 201', 'Humanities Building, Office 201',
    '[{"id": "prof-6", "entryType": "department", "departmentName": "Computer Science", "departmentCode": "CS", "facultyName": "Faculty of Arts & Sciences", "facultyCode": "ART", "isCurrent": true}]'::jsonb,
    '["m003", "m007"]'::jsonb,
    'Bachelor of Computer Science', 'BCS',
    'Coding Club', NULL
),

-- Dr Okonkwo - Human Resources
(
    'STF009', 'Dr', 'JO', 'Dr', 'Okonkwo', 'Head of Department',
    'c0000000-0000-0000-0000-000000000007', 8, 'a0000000-0000-0000-0000-000000000002',
    'Soshanguve South Campus', 'dr.okonkwo@campus.edu', '0125552009',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Business & Management', 'HR Block, Room 401', 'HR Block, Office 401',
    '[{"id": "prof-7", "entryType": "department", "departmentName": "Human Resources", "departmentCode": "HR", "facultyName": "Faculty of Business & Management", "facultyCode": "BUM", "isCurrent": true}]'::jsonb,
    '[]'::jsonb,
    'Master of Business Administration', 'MBA',
    'HR Committee', 'TUT Residence E'
),

-- Prof Chetty - Computer Science
(
    'STF010', 'Prof', 'CC', 'Prof', 'Chetty', 'Professor',
    'c0000000-0000-0000-0000-000000000008', 9, 'a0000000-0000-0000-0000-000000000003',
    'Arcadia Campus', 'prof.chetty@campus.edu', '0125552010',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Information & Communication Technology', 'Computer Science Building, Lab Complex', 'Computer Science Building, Office 500',
    '[{"id": "prof-8", "entryType": "course", "courseName": "Master of Science in Information Technology", "courseCode": "MSC601", "facultyName": "Faculty of Information & Communication Technology", "facultyCode": "ICT", "isCurrent": true}]'::jsonb,
    '["m001", "m002", "m003", "m004", "m005"]'::jsonb,
    'PhD in Computer Science', 'PHDCS',
    'AI Research Group', 'TUT Residence F'
);

-- Verify the data
SELECT 
    staff_id,
    first_name,
    last_name,
    faculty,
    department_id,
    course,
    professional_modules,
    extracurricular,
    residence
FROM staff
ORDER BY staff_id;
