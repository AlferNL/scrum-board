import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// Database Types
// ============================================

export interface DbUser {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  role: string | null;
  user_role: string | null;
  status: string | null;
  auth_id: string | null;
  created_at: string;
}

export interface DbProject {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DbSprint {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface DbStory {
  id: string;
  sprint_id: string;
  title: string;
  description: string | null;
  story_points: number;
  priority: string;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  story_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  estimated_hours: number | null;
  logged_hours: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Data Fetching Functions
// ============================================

export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_members (
        user_id,
        users (*)
      ),
      sprints (
        *,
        sprint_members (
          user_id,
          users (*)
        ),
        stories (
          *,
          users:assignee_id (*),
          tasks (
            *,
            users:assignee_id (*)
          )
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }

  return data;
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return data;
}

// ============================================
// Project CRUD
// ============================================

export async function createProject(project: Partial<DbProject>) {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(id: string, project: Partial<DbProject>) {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...project, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// Sprint CRUD
// ============================================

export async function createSprint(sprint: Partial<DbSprint>) {
  const { data, error } = await supabase
    .from('sprints')
    .insert(sprint)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSprint(id: string, sprint: Partial<DbSprint>) {
  const { data, error } = await supabase
    .from('sprints')
    .update(sprint)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSprint(id: string) {
  const { error } = await supabase
    .from('sprints')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// Story CRUD
// ============================================

export async function createStory(story: Partial<DbStory>) {
  const { data, error } = await supabase
    .from('stories')
    .insert(story)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStory(id: string, story: Partial<DbStory>) {
  const { data, error } = await supabase
    .from('stories')
    .update({ ...story, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStory(id: string) {
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// Task CRUD
// ============================================

export async function createTask(task: Partial<DbTask>) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id: string, task: Partial<DbTask>) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...task, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// Team Members
// ============================================

export async function addProjectMember(projectId: string, userId: string) {
  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: userId });

  if (error) throw error;
}

export async function removeProjectMember(projectId: string, userId: string) {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function addSprintMember(sprintId: string, userId: string) {
  const { error } = await supabase
    .from('sprint_members')
    .insert({ sprint_id: sprintId, user_id: userId });

  if (error) throw error;
}

export async function removeSprintMember(sprintId: string, userId: string) {
  const { error } = await supabase
    .from('sprint_members')
    .delete()
    .eq('sprint_id', sprintId)
    .eq('user_id', userId);

  if (error) throw error;
}
