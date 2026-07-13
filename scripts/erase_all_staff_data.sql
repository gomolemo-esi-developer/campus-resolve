-- =============================================
-- COMPLETELY ERASE ALL STAFF DATA
-- Run this in Supabase SQL Editor
-- =============================================

-- Delete all staff records
DELETE FROM staff;

-- Verify table is empty
SELECT COUNT(*) as total_staff FROM staff;

-- Optional: Reset the auto-increment if using serial IDs
-- ALTER SEQUENCE staff_id_seq RESTART WITH 1;
