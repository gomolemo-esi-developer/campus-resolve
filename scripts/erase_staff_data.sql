-- =============================================
-- SCRIPT 2: ERASE COURSE, MODULES, EXTRACURRICULAR, RESIDENCE DATA
-- Run this to remove the sample data from staff table
-- =============================================

-- Reset all staff records to NULL/empty
UPDATE staff SET
    course = NULL,
    course_code = NULL,
    professional_modules = '[]'::jsonb,
    extracurricular = NULL,
    residence = NULL
WHERE staff_id IN ('STF001', 'STF002', 'STF003', 'STF004', 'STF005', 'STF006', 'STF007', 'STF008', 'STF009', 'STF010');

-- Or reset ALL staff records (uncomment below to reset everything)
-- UPDATE staff SET
--     course = NULL,
--     course_code = NULL,
--     professional_modules = '[]'::jsonb,
--     extracurricular = NULL,
--     residence = NULL;

-- Verify the reset
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
WHERE staff_id IN ('STF001', 'STF002', 'STF003', 'STF004', 'STF005')
ORDER BY staff_id;
