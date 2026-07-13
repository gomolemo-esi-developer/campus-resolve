-- ============================================
-- Migration: Add faculty_id and course_id to students table
-- ============================================

-- Add missing foreign key columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_students_faculty_id ON students(faculty_id);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);

-- ============================================
-- Verification
-- ============================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('faculty_id', 'course_id')
ORDER BY column_name;
