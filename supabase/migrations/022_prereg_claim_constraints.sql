-- ============================================
-- Migration: 022 - Pre-Registration Claim Constraints
-- ============================================
-- Supports the signup-time claim flow that links a new Cognito account to
-- an admin-created students/staff record (matched on email + number).

-- Prevent a staff row from being claimed by more than one Cognito account.
-- students.cognito_sub is already UNIQUE (migration 012) — no change needed there.
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_cognito_sub_unique
  ON staff (cognito_sub)
  WHERE cognito_sub IS NOT NULL;

-- Speed up the case-insensitive email lookup used during signup matching.
CREATE INDEX IF NOT EXISTS idx_students_email_lower ON students (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_staff_email_lower ON staff (LOWER(email));
