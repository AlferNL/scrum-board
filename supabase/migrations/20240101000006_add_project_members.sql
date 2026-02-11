-- Migration: Add project_members table for project-based roles
-- This allows users to have different roles per project
-- ADMIN role remains global (defined in users.user_role)
-- ============================================

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id),
  CONSTRAINT valid_project_role CHECK (role IN ('PRODUCT_OWNER', 'SCRUM_MASTER', 'MEMBER', 'VIEWER'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);

-- Add comment
COMMENT ON TABLE project_members IS 'Stores project-specific role assignments. Global ADMIN role is still in users table.';
COMMENT ON COLUMN project_members.role IS 'Project role: PRODUCT_OWNER, SCRUM_MASTER, MEMBER, or VIEWER';
