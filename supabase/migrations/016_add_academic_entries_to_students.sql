-- Add academic_entries column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_entries JSONB DEFAULT '[]';
