-- Migration: Add SCRUM_MASTER role
-- This migration adds the SCRUM_MASTER role to the user_role constraint

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_role_check;

-- Add the new constraint with SCRUM_MASTER included
ALTER TABLE users ADD CONSTRAINT users_user_role_check 
CHECK (user_role IN ('ADMIN', 'PRODUCT_OWNER', 'SCRUM_MASTER', 'MEMBER', 'VIEWER'));

-- Update the comment
COMMENT ON COLUMN users.user_role IS 'User role for access control: ADMIN, PRODUCT_OWNER, SCRUM_MASTER, MEMBER, or VIEWER';
