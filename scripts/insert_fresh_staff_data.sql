-- =============================================
-- INSERT NEW FRESH STAFF DATA
-- Run this in Supabase SQL Editor after erasing
-- =============================================

INSERT INTO staff (
    staff_id, title, initials, first_name, last_name, role,
    department_id, level, campus_id, campus, email, phone,
    created_at, updated_at, cognito_sub, user_type,
    faculty, location, office_location,
    professional_entries, professional_modules,
    course, course_code, extracurricular, residence
)
VALUES
-- 1. Prof Adams - Business Management (HOD)
(
    'STF001', 'Prof', 'AP', 'Prof', 'Adams', 'HOD',
    'c0000000-0000-0000-0000-000000000006', 9, 'a0000000-0000-0000-0000-000000000002',
    'Soshanguve South Campus', 'prof.adams@campus.edu', '0125552001',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Business & Management', 'Block A, Room 101', 'Block A, Office 101',
    '[{"id": "prof-1", "entryType": "department", "departmentName": "Business Management", "departmentCode": "BM", "facultyName": "Faculty of Business & Management", "facultyCode": "BUM", "isCurrent": true}]'::jsonb,
    '["b0000000-0000-0000-0000-000000000001", "b0000000-0000-0000-0000-000000000002"]'::jsonb,
    'National Diploma in Business Management', 'NDVM16',
    'Sports Committee', 'TUT Residence A'
),

-- 2. Dr Banda - Civil Engineering (Lecturer)
(
    'STF002', 'Dr', 'MB', 'Dr', 'Banda', 'Lecturer',
    'c0000000-0000-0000-0000-000000000003', 7, 'a0000000-0000-0000-0000-000000000006',
    'Polokwane Campus', 'dr.banda@campus.edu', '0125552002',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Engineering & Built Environment', 'Block B, Room 205', 'Block B, Office 205',
    '[{"id": "prof-2", "entryType": "department", "departmentName": "Civil Engineering", "departmentCode": "CE", "facultyName": "Faculty of Engineering & Built Environment", "facultyCode": "FEBE", "isCurrent": true}]'::jsonb,
    '["b0000000-0000-0000-0000-000000000003"]'::jsonb,
    'Bachelor of Engineering in Civil Engineering', 'BENGCE',
    'Research Club', 'TUT Residence B'
),

-- 3. Mrs Ngema - IT Services (Administrator)
(
    'STF003', 'Mrs', 'JN', 'Mrs', 'Ngema', 'Administrator',
    'c0000000-0000-0000-0000-000000000002', 5, 'a0000000-0000-0000-0000-000000000001',
    'Soshanguve North Campus', 'j.ngema@campus.edu', '0125552003',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Information & Communication Technology', 'Admin Block, Room 10', 'Admin Block, Office 10',
    '[]'::jsonb,
    '[]'::jsonb,
    'Higher Certificate in IT', 'HCIT01',
    'Tech Club', NULL
),

-- 4. Mr Khosa - Applied Sciences (Senior Lecturer)
(
    'STF004', 'Mr', 'DK', 'Mr', 'Khosa', 'Senior Lecturer',
    'c0000000-0000-0000-0000-000000000009', 8, 'a0000000-0000-0000-0000-000000000004',
    'Arts Campus', 'mr.khosa@campus.edu', '0125552004',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Arts & Sciences', 'Science Block, Room 302', 'Science Block, Office 302',
    '[{"id": "prof-3", "entryType": "department", "departmentName": "Applied Sciences", "departmentCode": "AS", "facultyName": "Faculty of Arts & Sciences", "facultyCode": "ART", "isCurrent": true}]'::jsonb,
    '["b0000000-0000-0000-0000-000000000009"]'::jsonb,
    'Bachelor of Science in Applied Sciences', 'BSCAS',
    'Science Fair Committee', 'TUT Residence C'
),

-- 5. Dr Van Der Merwe - Multimedia Computing (Researcher)
(
    'STF005', 'Dr', 'MV', 'Dr', 'Van Der Merwe', 'Researcher',
    'c0000000-0000-0000-0000-000000000001', 8, 'a0000000-0000-0000-0000-000000000003',
    'Arcadia Campus', 'dr.vdmerwe@campus.edu', '0125552005',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Information & Communication Technology', 'Research Lab, Room 1', 'Research Lab, Office 1',
    '[{"id": "prof-4", "entryType": "department", "departmentName": "Multimedia Computing", "departmentCode": "MC", "facultyName": "Faculty of Information & Communication Technology", "facultyCode": "ICT", "isCurrent": true}]'::jsonb,
    '["b0000000-0000-0000-0000-000000000010", "b0000000-0000-0000-0000-000000000011"]'::jsonb,
    'Master of Science in Multimedia', 'MSC MM',
    'Academic Board', NULL
),

-- 6. Prof Luthuli - Chemical Engineering (Dean)
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

-- 7. Mr Sibiya - Electrical Engineering (Lab Technician)
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

-- 8. Ms Ross - Computer Science (Lecturer)
(
    'STF008', 'Ms', 'HR', 'Ms', 'Ross', 'Lecturer',
    'c0000000-0000-0000-0000-000000000008', 6, 'a0000000-0000-0000-0000-000000000004',
    'Arts Campus', 'ms.ross@campus.edu', '0125552008',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Arts & Sciences', 'Humanities Building, Room 201', 'Humanities Building, Office 201',
    '[{"id": "prof-6", "entryType": "department", "departmentName": "Computer Science", "departmentCode": "CS", "facultyName": "Faculty of Arts & Sciences", "facultyCode": "ART", "isCurrent": true}]'::jsonb,
    '["b0000000-0000-0000-0000-000000000001"]'::jsonb,
    'Bachelor of Computer Science', 'BCS',
    'Coding Club', NULL
),

-- 9. Dr Okonkwo - Human Resources (Head of Department)
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

-- 10. Prof Chetty - Computer Science (Professor)
(
    'STF010', 'Prof', 'CC', 'Prof', 'Chetty', 'Professor',
    'c0000000-0000-0000-0000-000000000008', 9, 'a0000000-0000-0000-0000-000000000003',
    'Arcadia Campus', 'prof.chetty@campus.edu', '0125552010',
    NOW(), NOW(), NULL, 'staff',
    'Faculty of Information & Communication Technology', 'Computer Science Building, Lab Complex', 'Computer Science Building, Office 500',
    '[{"id": "prof-8", "entryType": "course", "courseName": "Master of Science in Information Technology", "courseCode": "MSC601", "facultyName": "Faculty of Information & Communication Technology", "facultyCode": "ICT", "isCurrent": true}]'::jsonb,
    '["b0000000-0000-0000-0000-000000000001", "b0000000-0000-0000-0000-000000000002"]'::jsonb,
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
