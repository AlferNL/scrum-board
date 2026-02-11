-- Migration: Add status column to stories table
-- This allows stories to have a status: OPEN, IN_PROGRESS, DONE, ARCHIVED
-- ============================================

-- Add status column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN';

-- Create index for faster filtering by status
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);

-- Update existing stories to have OPEN status (should already be default)
UPDATE stories SET status = 'OPEN' WHERE status IS NULL;
