-- ============================================================================
-- Staff Profiles Migration for Campus Resolve
-- Creates a single unified table for staff profile management
-- ============================================================================

-- Staff Profiles Table
-- This table stores all staff-specific profile information for campus-resolve
-- in a single table with JSONB fields for flexible data
CREATE TABLE IF NOT EXISTS staff_profiles (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cognito_sub VARCHAR(255) UNIQUE NOT NULL,
    
    -- Authentication & Basic Info
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    
    -- Personal Information
    title VARCHAR(20),
    initials VARCHAR(10),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    id_number VARCHAR(50),
    
    -- Staff Identification
    staff_number VARCHAR(50) UNIQUE,
    
    -- Location Information
    location VARCHAR(100),
    office_location VARCHAR(255),
    campus VARCHAR(100),
    
    -- Academic/Professional Information  
    department VARCHAR(255),
    department_code VARCHAR(50),
    department_nonacademic VARCHAR(255),
    faculty VARCHAR(255),
    faculty_code VARCHAR(50),
    course VARCHAR(255),
    course_code VARCHAR(50),
    
    -- Additional Information
    residence VARCHAR(100),
    extracurricular VARCHAR(255),
    
    -- Professional Entries stored as JSONB (courses, qualifications, certifications, research)
    professional_entries JSONB DEFAULT '[]'::jsonb,
    
    -- Professional Modules stored as JSONB (modules staff teach/manage)
    professional_modules JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for staff_profiles
CREATE INDEX IF NOT EXISTS idx_staff_profiles_cognito_sub ON staff_profiles(cognito_sub);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_email ON staff_profiles(email);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_staff_number ON staff_profiles(staff_number);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON staff_profiles(role);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_department ON staff_profiles(department);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_faculty ON staff_profiles(faculty);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- Staff can read their own profile
CREATE POLICY "Staff can read own profile" ON staff_profiles
    FOR SELECT USING (cognito_sub = auth.jwt()->>'sub');

-- Staff can update their own profile
CREATE POLICY "Staff can update own profile" ON staff_profiles
    FOR UPDATE USING (cognito_sub = auth.jwt()->>'sub');

-- Allow service role full access
CREATE POLICY "Service role full access" ON staff_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE staff_profiles IS 'Staff profiles for campus-resolve portal - stores personal and professional information';

-- ============================================================================
-- Helper function to check if profile exists for a user
-- ============================================================================

CREATE OR REPLACE FUNCTION get_staff_profile_by_cognito(sub VARCHAR)
RETURNS TABLE (
    id UUID,
    cognito_sub VARCHAR,
    email VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    staff_number VARCHAR,
    title VARCHAR,
    initials VARCHAR,
    location VARCHAR,
    office_location VARCHAR,
    campus VARCHAR,
    department VARCHAR,
    department_nonacademic VARCHAR,
    faculty VARCHAR,
    course VARCHAR,
    residence VARCHAR,
    extracurricular VARCHAR,
    professional_entries JSONB,
    professional_modules JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.cognito_sub,
        sp.email,
        sp.first_name,
        sp.last_name,
        sp.staff_number,
        sp.title,
        sp.initials,
        sp.location,
        sp.office_location,
        sp.campus,
        sp.department,
        sp.department_nonacademic,
        sp.faculty,
        sp.course,
        sp.residence,
        sp.extracurricular,
        sp.professional_entries,
        sp.professional_modules,
        sp.created_at,
        sp.updated_at
    FROM staff_profiles sp
    WHERE sp.cognito_sub = sub;
END;
$$;

-- ============================================================================
-- Helper function to create or update staff profile
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_staff_profile(
    in_cognito_sub VARCHAR,
    in_email VARCHAR,
    in_first_name VARCHAR,
    in_last_name VARCHAR,
    in_role VARCHAR DEFAULT 'staff'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    profile_id UUID;
BEGIN
    -- Try to update existing
    UPDATE staff_profiles
    SET email = in_email,
        first_name = in_first_name,
        last_name = in_last_name,
        role = in_role,
        updated_at = NOW()
    WHERE cognito_sub = in_cognito_sub
    RETURNING id INTO profile_id;
    
    -- If no row was updated, insert new
    IF profile_id IS NULL THEN
        INSERT INTO staff_profiles (
            cognito_sub,
            email,
            first_name,
            last_name,
            role
        ) VALUES (
            in_cognito_sub,
            in_email,
            in_first_name,
            in_last_name,
            in_role
        )
        RETURNING id INTO profile_id;
    END IF;
    
    RETURN profile_id;
END;
$$;