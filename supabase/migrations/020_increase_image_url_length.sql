-- Increase image_url column size to handle S3 presigned URLs (which can be 1000+ chars)
-- Staff table
ALTER TABLE staff ALTER COLUMN image_url TYPE VARCHAR(2000);

-- Students table
ALTER TABLE students ALTER COLUMN image_url TYPE VARCHAR(2000);

-- Optional: Add index if not already present (students index already created in 019)
CREATE INDEX IF NOT EXISTS idx_staff_image_url ON staff(image_url) WHERE image_url IS NOT NULL;
