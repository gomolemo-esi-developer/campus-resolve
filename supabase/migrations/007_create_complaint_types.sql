-- ============================================
-- COMPLAINT TYPES CONFIG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS complaint_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_complaint_types_active ON complaint_types(is_active);
CREATE INDEX IF NOT EXISTS idx_complaint_types_key ON complaint_types(key);

INSERT INTO complaint_types (key, label, description, is_active)
VALUES
  ('student-services', 'Student Services', 'Student administration and services related complaints', true),
  ('campus-facilities', 'Campus Facilities', 'Residence, lecture hall, infrastructure and facilities complaints', true),
  ('course-complaint', 'Course Complaint', 'Course delivery, content and academic support complaints', true),
  ('timetable', 'Timetable Issue', 'Scheduling and timetable conflict complaints', true),
  ('lecture-hall-lab', 'Lecture Hall | Lab Issue', 'Lecture venue and lab environment complaints', true),
  ('report-lecturer', 'Report Lecturer', 'Lecturer conduct or delivery complaints', true)
ON CONFLICT (key) DO NOTHING;
