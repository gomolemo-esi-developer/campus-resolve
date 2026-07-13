-- ============================================================================
-- Drop Staff Profiles Tables
-- Run this to remove all tables created by 004_create_staff_profiles.sql
-- ============================================================================

-- First disable RLS policies before dropping tables
ALTER TABLE IF EXISTS staff_profiles DISABLE ROW LEVEL SECURITY;

-- Drop the main table (this will cascade drop related tables if they exist)
DROP TABLE IF EXISTS staff_profiles CASCADE;

-- Drop helper functions if they exist
DROP FUNCTION IF EXISTS get_staff_profile_by_cognito(VARCHAR);
DROP FUNCTION IF EXISTS upsert_staff_profile(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR);

-- Drop indexes if they still exist (orphan indexes after table drop)
DROP INDEX IF EXISTS idx_staff_profiles_cognito_sub;
DROP INDEX IF EXISTS idx_staff_profiles_email;
DROP INDEX IF EXISTS idx_staff_profiles_staff_number;
DROP INDEX IF EXISTS idx_staff_profiles_role;
DROP INDEX IF EXISTS idx_staff_profiles_department;
DROP INDEX IF EXISTS idx_staff_profiles_faculty;