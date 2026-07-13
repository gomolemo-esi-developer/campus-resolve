-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Migration: 012 - Enhance Staff Table with Full Profile Fields
-- ============================================

-- Add new columns to staff table for comprehensive profile data
ALTER TABLE staff ADD COLUMN IF NOT EXISTS id_number VARCHAR(50);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS office_location VARCHAR(255);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department_code VARCHAR(20);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department_nonacademic VARCHAR(255);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS faculty VARCHAR(255);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS faculty_code VARCHAR(20);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS course VARCHAR(255);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS course_code VARCHAR(20);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS residence VARCHAR(255);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS extracurricular TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS professional_entries JSONB DEFAULT '[]';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS professional_modules JSONB DEFAULT '[]';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'staff';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS cognito_sub VARCHAR(255);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_cognito_sub ON staff(cognito_sub);
CREATE INDEX IF NOT EXISTS idx_staff_user_type ON staff(user_type);

-- ============================================
-- Migration: 013 - Create Students Table
-- ============================================

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id VARCHAR(50) NOT NULL UNIQUE,
  cognito_sub VARCHAR(255) UNIQUE,
  title VARCHAR(10),
  initials VARCHAR(2),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  id_number VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
  campus VARCHAR(255),
  faculty VARCHAR(255),
  faculty_code VARCHAR(20),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  department VARCHAR(255),
  department_code VARCHAR(20),
  course VARCHAR(255),
  course_code VARCHAR(50),
  residence VARCHAR(255),
  extracurricular TEXT,
  modules JSONB DEFAULT '[]',
  user_type VARCHAR(20) DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID,
  updated_by UUID
);

-- Create indexes for students table
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_cognito_sub ON students(cognito_sub);
CREATE INDEX IF NOT EXISTS idx_students_user_type ON students(user_type);
CREATE INDEX IF NOT EXISTS idx_students_campus_id ON students(campus_id);

-- ============================================
-- Verification Queries
-- ============================================

-- Check staff table enhancements
SELECT 
  COUNT(*) as total_staff,
  COUNT(DISTINCT cognito_sub) as with_cognito,
  COUNT(professional_entries) as with_professional_entries
FROM staff;

-- Check students table
SELECT 
  COUNT(*) as total_students
FROM students;