'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Project, Sprint, Story, Task, User, UserRole, UserStatus } from '@/types';

// ============================================
// Transform database data to app types
// ============================================

function transformUser(dbUser: any): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    avatar: dbUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${dbUser.name}`,
    role: dbUser.role,
    userRole: (dbUser.user_role as UserRole) || 'MEMBER', // Default to MEMBER if not set
    status: (dbUser.status as UserStatus) || 'APPROVED', // Default to APPROVED for existing users
    authId: dbUser.auth_id,
  };
}

function transformTask(dbTask: any): Task {
  return {
    id: dbTask.id,
    storyId: dbTask.story_id,
    title: dbTask.title,
    description: dbTask.description,
    status: dbTask.status as Task['status'],
    priority: dbTask.priority as Task['priority'],
    assignee: dbTask.users ? transformUser(dbTask.users) : undefined,
    estimatedHours: dbTask.estimated_hours,
    loggedHours: dbTask.logged_hours,
    tags: [],
    createdAt: new Date(dbTask.created_at),
    updatedAt: new Date(dbTask.updated_at),
  };
}

function transformStory(dbStory: any): Story {
  return {
    id: dbStory.id,
    sprintId: dbStory.sprint_id,
    title: dbStory.title,
    description: dbStory.description || '',
    storyPoints: dbStory.story_points,
    priority: dbStory.priority as Story['priority'],
    assignee: dbStory.users ? transformUser(dbStory.users) : undefined,
    tasks: (dbStory.tasks || []).map(transformTask),
    acceptanceCriteria: [],
    createdAt: new Date(dbStory.created_at),
    updatedAt: new Date(dbStory.updated_at),
  };
}

function transformSprint(dbSprint: any): Sprint {
  const teamMembers = (dbSprint.sprint_members || [])
    .map((sm: any) => sm.users ? transformUser(sm.users) : null)
    .filter(Boolean);

  return {
    id: dbSprint.id,
    projectId: dbSprint.project_id,
    name: dbSprint.name,
    goal: dbSprint.goal,
    startDate: new Date(dbSprint.start_date),
    endDate: new Date(dbSprint.end_date),
    stories: (dbSprint.stories || []).map(transformStory),
    isActive: dbSprint.is_active,
    teamMembers,
  };
}

function transformProject(dbProject: any): Project {
  const teamMembers = (dbProject.project_members || [])
    .map((pm: any) => pm.users ? transformUser(pm.users) : null)
    .filter(Boolean);

  // Parse columns from JSON if present
  let columns = undefined;
  if (dbProject.columns) {
    try {
      columns = typeof dbProject.columns === 'string' 
        ? JSON.parse(dbProject.columns) 
        : dbProject.columns;
    } catch (e) {
      console.error('Error parsing columns:', e);
    }
  }

  return {
    id: dbProject.id,
    name: dbProject.name,
    description: dbProject.description,
    color: dbProject.color,
    teamMembers,
    sprints: (dbProject.sprints || []).map(transformSprint),
    columns,
    createdAt: new Date(dbProject.created_at),
    updatedAt: new Date(dbProject.updated_at),
  };
}

// ============================================
// Main Hook
// ============================================

export function useSupabaseData() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (usersError) throw usersError;
      setUsers((usersData || []).map(transformUser));

      // Fetch projects with all nested data
      const { data: projectsData, error: projectsError } = await supabase
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

      if (projectsError) throw projectsError;
      setProjects((projectsData || []).map(transformProject));

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Er is een fout opgetreden bij het laden van de data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================
  // Project CRUD
  // ============================================

  const createProject = async (projectData: Partial<Project>) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description,
        color: projectData.color,
      })
      .select()
      .single();

    if (error) throw error;

    // Add team members
    if (projectData.teamMembers?.length) {
      await supabase.from('project_members').insert(
        projectData.teamMembers.map(u => ({
          project_id: data.id,
          user_id: u.id,
        }))
      );
    }

    await fetchData();
    return data.id;
  };

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (projectData.name !== undefined) updateData.name = projectData.name;
    if (projectData.description !== undefined) updateData.description = projectData.description;
    if (projectData.color !== undefined) updateData.color = projectData.color;
    if (projectData.columns !== undefined) updateData.columns = JSON.stringify(projectData.columns);

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    // Update team members (delete all, then re-add)
    if (projectData.teamMembers) {
      await supabase.from('project_members').delete().eq('project_id', id);
      if (projectData.teamMembers.length > 0) {
        await supabase.from('project_members').insert(
          projectData.teamMembers.map(u => ({
            project_id: id,
            user_id: u.id,
          }))
        );
      }
    }

    await fetchData();
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  // ============================================
  // Sprint CRUD
  // ============================================

  const createSprint = async (sprintData: Partial<Sprint> & { projectId: string }) => {
    // If making active, deactivate others first
    if (sprintData.isActive) {
      await supabase
        .from('sprints')
        .update({ is_active: false })
        .eq('project_id', sprintData.projectId);
    }

    const { data, error } = await supabase
      .from('sprints')
      .insert({
        project_id: sprintData.projectId,
        name: sprintData.name,
        goal: sprintData.goal,
        start_date: sprintData.startDate?.toISOString().split('T')[0],
        end_date: sprintData.endDate?.toISOString().split('T')[0],
        is_active: sprintData.isActive,
      })
      .select()
      .single();

    if (error) throw error;

    // Add team members
    if (sprintData.teamMembers?.length) {
      await supabase.from('sprint_members').insert(
        sprintData.teamMembers.map(u => ({
          sprint_id: data.id,
          user_id: u.id,
        }))
      );
    }

    await fetchData();
    return data.id;
  };

  const updateSprint = async (id: string, sprintData: Partial<Sprint>) => {
    // If making active, deactivate others first
    if (sprintData.isActive && sprintData.projectId) {
      await supabase
        .from('sprints')
        .update({ is_active: false })
        .eq('project_id', sprintData.projectId);
    }

    const { error } = await supabase
      .from('sprints')
      .update({
        name: sprintData.name,
        goal: sprintData.goal,
        start_date: sprintData.startDate instanceof Date 
          ? sprintData.startDate.toISOString().split('T')[0]
          : sprintData.startDate,
        end_date: sprintData.endDate instanceof Date
          ? sprintData.endDate.toISOString().split('T')[0]
          : sprintData.endDate,
        is_active: sprintData.isActive,
      })
      .eq('id', id);

    if (error) throw error;

    // Update team members
    if (sprintData.teamMembers) {
      await supabase.from('sprint_members').delete().eq('sprint_id', id);
      if (sprintData.teamMembers.length > 0) {
        await supabase.from('sprint_members').insert(
          sprintData.teamMembers.map(u => ({
            sprint_id: id,
            user_id: u.id,
          }))
        );
      }
    }

    await fetchData();
  };

  const deleteSprint = async (id: string) => {
    const { error } = await supabase.from('sprints').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  // ============================================
  // Story CRUD
  // ============================================

  const createStory = async (storyData: Partial<Story> & { sprintId: string }) => {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        sprint_id: storyData.sprintId,
        title: storyData.title,
        description: storyData.description,
        story_points: storyData.storyPoints,
        priority: storyData.priority,
        assignee_id: storyData.assignee?.id || null,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchData();
    return data.id;
  };

  const updateStory = async (id: string, storyData: Partial<Story>) => {
    const { error } = await supabase
      .from('stories')
      .update({
        title: storyData.title,
        description: storyData.description,
        story_points: storyData.storyPoints,
        priority: storyData.priority,
        assignee_id: storyData.assignee?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    await fetchData();
  };

  const deleteStory = async (id: string) => {
    const { error } = await supabase.from('stories').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  // ============================================
  // Task CRUD
  // ============================================

  const createTask = async (taskData: Partial<Task> & { storyId: string }) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        story_id: taskData.storyId,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        assignee_id: taskData.assignee?.id || null,
        estimated_hours: taskData.estimatedHours,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchData();
    return data.id;
  };

  const updateTask = async (id: string, taskData: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        assignee_id: taskData.assignee?.id || null,
        estimated_hours: taskData.estimatedHours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    await fetchData();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    await fetchData();
  };

  // Update task status (for drag and drop)
  const updateTaskStatus = async (taskId: string, newStatus: Task['status'], newStoryId?: string) => {
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    
    if (newStoryId) {
      updateData.story_id = newStoryId;
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) throw error;
    await fetchData();
  };

  return {
    // Data
    projects,
    users,
    loading,
    error,
    
    // Refresh
    refetch: fetchData,
    
    // Project CRUD
    createProject,
    updateProject,
    deleteProject,
    
    // Sprint CRUD
    createSprint,
    updateSprint,
    deleteSprint,
    
    // Story CRUD
    createStory,
    updateStory,
    deleteStory,
    
    // Task CRUD
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  };
}
