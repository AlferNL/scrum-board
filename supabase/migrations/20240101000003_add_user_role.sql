-- Add user_role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'MEMBER';

-- Add check constraint for valid roles
ALTER TABLE users 
ADD CONSTRAINT valid_user_role 
CHECK (user_role IN ('ADMIN', 'PRODUCT_OWNER', 'MEMBER', 'VIEWER'));

-- Update existing users with default roles (optional - customize as needed)
UPDATE users SET user_role = 'ADMIN' WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_user_role ON users(user_role);

-- Comment on column
COMMENT ON COLUMN users.user_role IS 'User role for access control: ADMIN, PRODUCT_OWNER, MEMBER, or VIEWER';
