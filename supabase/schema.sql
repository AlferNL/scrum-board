-- ============================================
-- Scrum Board Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  avatar TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Projects table
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  columns JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns field to existing projects table (run this if table already exists)
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS columns JSONB;

-- ============================================
-- Sprints table
-- ============================================
CREATE TABLE IF NOT EXISTS sprints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Stories table
-- ============================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  story_points INTEGER DEFAULT 5,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'OPEN',
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Tasks table
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  estimated_hours INTEGER,
  logged_hours INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Junction tables for team members
-- ============================================
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS sprint_members (
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (sprint_id, user_id)
);

-- ============================================
-- Indexes for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_stories_sprint_id ON stories(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_story_id ON tasks(story_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ============================================
-- Row Level Security (RLS) - Optional
-- Enable if you want user-based access control
-- ============================================
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Insert sample data
-- ============================================

-- Sample Users
INSERT INTO users (id, name, email, avatar, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sarah Chen', 'sarah.chen@company.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 'Frontend Developer'),
  ('22222222-2222-2222-2222-222222222222', 'Marcus Johnson', 'marcus.johnson@company.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', 'Backend Developer'),
  ('33333333-3333-3333-3333-333333333333', 'Elena Rodriguez', 'elena.rodriguez@company.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', 'UX Designer'),
  ('44444444-4444-4444-4444-444444444444', 'David Kim', 'david.kim@company.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', 'Full Stack Developer'),
  ('55555555-5555-5555-5555-555555555555', 'Anna Müller', 'anna.mueller@company.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna', 'QA Engineer')
ON CONFLICT (id) DO NOTHING;

-- Sample Project
INSERT INTO projects (id, name, description, color) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Web Platform', 'Hoofdproject voor de web applicatie ontwikkeling', '#3B82F6')
ON CONFLICT (id) DO NOTHING;

-- Sample Sprint
INSERT INTO sprints (id, project_id, name, goal, start_date, end_date, is_active) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sprint 7 - Q1 2026', 'Kernfunctionaliteit voor gebruikersbeheer en dashboard analytics afronden', '2026-02-03', '2026-02-14', true)
ON CONFLICT (id) DO NOTHING;

-- Sample Story
INSERT INTO stories (id, sprint_id, title, description, story_points, priority, assignee_id) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'User Authentication System', 'Implement complete user authentication with login, registration, and password reset functionality.', 13, 'high', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Sample Tasks
INSERT INTO tasks (story_id, title, status, priority, assignee_id, estimated_hours) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Design login page UI', 'done', 'high', '33333333-3333-3333-3333-333333333333', 4),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Implement login API endpoint', 'done', 'high', '22222222-2222-2222-2222-222222222222', 6),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Create registration form', 'review', 'medium', '11111111-1111-1111-1111-111111111111', 4),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Add form validation', 'in-progress', 'medium', '11111111-1111-1111-1111-111111111111', 3),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Implement password reset flow', 'todo', 'medium', '22222222-2222-2222-2222-222222222222', 5),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Write unit tests for auth', 'todo', 'low', '55555555-5555-5555-5555-555555555555', 4)
ON CONFLICT DO NOTHING;

-- Add project members
INSERT INTO project_members (project_id, user_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555')
ON CONFLICT DO NOTHING;

-- Add sprint members
INSERT INTO sprint_members (sprint_id, user_id) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '55555555-5555-5555-5555-555555555555')
ON CONFLICT DO NOTHING;
