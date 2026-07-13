-- ============================================================================
-- ADD MISSING COLUMNS TO MODULES TABLE
-- Adds department_id and faculty_id as foreign keys to properly link modules
-- with their departments and faculties (derived from courses)
-- ============================================================================

-- Add department_id and faculty_id columns if they don't exist
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL;

-- Add credits and semester columns if they don't exist (optional metadata)
ALTER TABLE public.modules
ADD COLUMN IF NOT EXISTS credits INT,
ADD COLUMN IF NOT EXISTS semester INT;

-- Populate department_id and faculty_id from the linked course
-- This ensures data consistency: modules get their dept/faculty from their course
UPDATE public.modules
SET 
  department_id = courses.department_id,
  faculty_id = courses.faculty_id
FROM public.courses
WHERE modules.course_id = courses.id
  AND modules.department_id IS NULL;

-- Verify the update
SELECT 
  'Modules with department_id set' as status,
  COUNT(*) as total_modules,
  COUNT(CASE WHEN department_id IS NOT NULL THEN 1 END) as modules_with_dept,
  COUNT(CASE WHEN faculty_id IS NOT NULL THEN 1 END) as modules_with_faculty
FROM public.modules;

-- Sample query to verify data integrity
SELECT 
  m.code,
  m.name,
  c.name as course_name,
  d.name as department_name,
  f.name as faculty_name
FROM public.modules m
LEFT JOIN public.courses c ON m.course_id = c.id
LEFT JOIN public.departments d ON m.department_id = d.id
LEFT JOIN public.faculties f ON m.faculty_id = f.id
ORDER BY m.code
LIMIT 10;
