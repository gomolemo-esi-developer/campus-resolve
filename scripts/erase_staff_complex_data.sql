-- =============================================
-- SCRIPT 2: ERASE COURSE, MODULES, EXTRACURRICULAR, RESIDENCE DATA
-- Run this in Supabase SQL Editor to reset these fields to NULL/empty
-- =============================================

-- Reset all complex fields to NULL or empty
UPDATE staff SET
    course = NULL,
    course_code = NULL,
    professional_modules = '[]'::jsonb,
    extracurricular = NULL,
    residence = NULL
WHERE staff_id IS NOT NULL;

-- Verify the reset
SELECT 
    staff_id,
    first_name,
    last_name,
    course,
    professional_modules,
    extracurricular,
    residence
FROM staff
ORDER BY staff_id;
