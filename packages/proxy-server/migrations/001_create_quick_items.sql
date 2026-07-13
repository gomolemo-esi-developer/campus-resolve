-- ============================================================================
-- Migration: Create unified quick_items table
-- For campus-resolve note management system
-- 
-- This table stores all content types (notes, files, links) in a single unified table
-- Run in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- Create the unified quick_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS quick_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id),
  
  -- Content type discriminator (REQUIRED)
  content_type TEXT NOT NULL CHECK (
    content_type IN ('note', 'file', 'link')
  ),
  
  -- Common fields for all content types
  title TEXT NOT NULL,
  description TEXT,
  
  -- File-specific fields (used when content_type = 'file')
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  mime_type TEXT,
  storage_key TEXT,
  s3_url TEXT,
  
-- Link-specific fields (used when content_type = 'link')
   link_url TEXT,
   link_label TEXT,

   -- Note links (JSONB array for multiple embedded links)
   links JSONB DEFAULT '[]'::jsonb,

   -- Metadata
   is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Create indexes for efficient queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_quick_items_created_by 
  ON quick_items(created_by);

CREATE INDEX IF NOT EXISTS idx_quick_items_content_type 
  ON quick_items(content_type);

CREATE INDEX IF NOT EXISTS idx_quick_items_created_at 
  ON quick_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quick_items_is_deleted 
  ON quick_items(is_deleted) WHERE is_deleted = false;

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE quick_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Users can only see their own items (not deleted)
-- Note: created_by references profiles.id, so we use the profile's UUID
CREATE POLICY "Users can view own items" ON quick_items
  FOR SELECT 
  USING (
    created_by = (SELECT id FROM profiles WHERE cognito_sub = auth.uid()::text)
    AND is_deleted = false
  );

-- Users can insert their own items
CREATE POLICY "Users can insert own items" ON quick_items
  FOR INSERT 
  WITH CHECK (created_by = (SELECT id FROM profiles WHERE cognito_sub = auth.uid()::text));

-- Users can update their own items
CREATE POLICY "Users can update own items" ON quick_items
  FOR UPDATE 
  USING (created_by = (SELECT id FROM profiles WHERE cognito_sub = auth.uid()::text));

-- Users can delete (soft) their own items
CREATE POLICY "Users can delete own items" ON quick_items
  FOR DELETE 
  USING (created_by = (SELECT id FROM profiles WHERE cognito_sub = auth.uid()::text));

-- ============================================================================
-- Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_quick_items_updated_at
  BEFORE UPDATE ON quick_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE quick_items IS 'Unified table for Quick Notes - stores notes, files, and links';
COMMENT ON COLUMN quick_items.content_type IS 'Content type: note, file, or link';
COMMENT ON COLUMN quick_items.title IS 'Title/subject for notes, filename for files, label for links';
COMMENT ON COLUMN quick_items.description IS 'Note content or file description';
COMMENT ON COLUMN quick_items.link_url IS 'URL for link content';
COMMENT ON COLUMN quick_items.link_label IS 'Display label for link';
COMMENT ON COLUMN quick_items.storage_key IS 'S3 object key for file storage';
COMMENT ON COLUMN quick_items.s3_url IS 'Full S3 URL for file download';
COMMENT ON COLUMN quick_items.is_deleted IS 'Soft delete flag';
COMMENT ON COLUMN quick_items.is_pinned IS 'Pin to top functionality';

-- ============================================================================
-- Optional: Migration complete
-- ============================================================================

SELECT 'Migration 001: quick_items table created successfully' AS status;