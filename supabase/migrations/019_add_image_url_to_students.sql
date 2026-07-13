-- Add image_url column to students table for profile picture storage
ALTER TABLE students ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Index for faster lookups by image_url (optional)
CREATE INDEX IF NOT EXISTS idx_students_image_url ON students(image_url) WHERE image_url IS NOT NULL;
