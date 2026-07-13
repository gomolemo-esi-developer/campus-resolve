-- =============================================
-- SCRIPT 1: POPULATE STAFF TABLE WITH SAMPLE DATA
-- Run this to add Course, Modules, Extracurricular, Residence data
-- =============================================

-- Update Prof Adams (STF001) with sample data
UPDATE staff SET
    course = 'National Diploma in Business Management',
    course_code = 'NDVM16',
    professional_modules = '["m001", "m002", "m003"]'::jsonb,
    extracurricular = 'Sports Committee',
    residence = 'TUT Residence A'
WHERE staff_id = 'STF001';

-- Update Dr Banda (STF002) with sample data
UPDATE staff SET
    course = 'Bachelor of Engineering in Civil Engineering',
    course_code = 'BENGCE',
    professional_modules = '["m004", "m005"]'::jsonb,
    extracurricular = 'Research Club',
    residence = 'TUT Residence B'
WHERE staff_id = 'STF002';

-- Update Mrs Ngema (STF003) with sample data
UPDATE staff SET
    course = 'Higher Certificate in IT',
    course_code = 'HCIT01',
    professional_modules = '["m006", "m007", "m008", "m009"]'::jsonb,
    extracurricular = 'Tech Club',
    residence = NULL
WHERE staff_id = 'STF003';

-- Update Mr Khosa (STF004) with sample data
UPDATE staff SET
    course = 'Bachelor of Science in Applied Sciences',
    course_code = 'BSCAS',
    professional_modules = '["m010"]'::jsonb,
    extracurricular = 'Science Fair Committee',
    residence = 'TUT Residence C'
WHERE staff_id = 'STF004';

-- Update Dr Van Der Merwe (STF005) with sample data
UPDATE staff SET
    course = 'Master of Science in Multimedia',
    course_code = 'MSC MM',
    professional_modules = '["m011", "m012"]'::jsonb,
    extracurricular = 'Academic Board',
    residence = NULL
WHERE staff_id = 'STF005';

-- Verify the updates
SELECT 
    staff_id,
    first_name,
    last_name,
    course,
    course_code,
    professional_modules,
    extracurricular,
    residence
FROM staff
WHERE staff_id IN ('STF001', 'STF002', 'STF003', 'STF004', 'STF005');
