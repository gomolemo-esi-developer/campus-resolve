-- ============================================================================
-- Migration: Add links JSONB column to quick_items table
-- Supports multiple embedded links per note
-- ============================================================================

-- Add links column to store multiple links as JSONB array
ALTER TABLE quick_items 
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb;

-- Add index for efficient queries on links
CREATE INDEX IF NOT EXISTS idx_quick_items_links 
ON quick_items USING GIN (links) WHERE links IS NOT NULL;

COMMENT ON COLUMN quick_items.links IS 'JSONB array of embedded links for notes: [{"id": "uuid", "label": "text", "url": "url"}]';

SELECT 'Migration 002: links column added to quick_items table' AS status;