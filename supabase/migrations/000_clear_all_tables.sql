-- ============================================================================
-- CLEAR ALL TABLES SCRIPT
-- Uses TRUNCATE CASCADE to safely remove all records and reset sequences
-- Run this BEFORE running the seed data script
-- ============================================================================

-- TRUNCATE with CASCADE automatically handles foreign key relationships
-- RESTART IDENTITY resets auto-increment counters
-- Removes all records from all tables in dependency order

TRUNCATE TABLE public.modules RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.courses RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.extracurriculars RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.departments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.faculties RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.staff RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.residences RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.roles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.campuses RESTART IDENTITY CASCADE;

-- ============================================================================
-- VERIFY ALL TABLES ARE EMPTY
-- ============================================================================
SELECT 'Campuses' as table_name, COUNT(*) as row_count FROM public.campuses
UNION ALL
SELECT 'Faculties', COUNT(*) FROM public.faculties
UNION ALL
SELECT 'Departments', COUNT(*) FROM public.departments
UNION ALL
SELECT 'Courses', COUNT(*) FROM public.courses
UNION ALL
SELECT 'Modules', COUNT(*) FROM public.modules
UNION ALL
SELECT 'Roles', COUNT(*) FROM public.roles
UNION ALL
SELECT 'Staff', COUNT(*) FROM public.staff
UNION ALL
SELECT 'Residences', COUNT(*) FROM public.residences
UNION ALL
SELECT 'Extracurriculars', COUNT(*) FROM public.extracurriculars;
