'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Project, Sprint, Story, Task, User, UserRole, UserStatus, ProjectMember, ProjectRole } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import { 
  sendTeamsNotification, 
  ActivityType,
  findProjectBySprintId,
  findProjectByStoryId,
  findProjectByTaskId 
} from '@/lib/teamsWebhook';

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
    status: dbStory.status || 'OPEN',
    assignee: dbStory.users ? transformUser(dbStory.users) : undefined,
    tasks: (dbStory.tasks || []).map(transformTask),
    definitionOfDone: dbStory.definition_of_done || [],
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
  // Transform project members with their roles
  const members: ProjectMember[] = (dbProject.project_members || [])
    .filter((pm: any) => pm.users)
    .map((pm: any) => ({
      id: pm.id,
      projectId: dbProject.id,
      userId: pm.user_id,
      user: transformUser(pm.users),
      role: (pm.role as ProjectRole) || 'MEMBER',
      createdAt: new Date(pm.created_at),
      updatedAt: new Date(pm.updated_at),
    }));

  // Also keep teamMembers for backwards compatibility
  const teamMembers = members.map(m => m.user);

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
    webhookUrl: dbProject.webhook_url,
    teamMembers,
    members,
    sprints: (dbProject.sprints || []).map(transformSprint),
    columns,
    defaultDefinitionOfDone: dbProject.default_definition_of_done || [],
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
  
  // Get current user for webhook notifications (convert null to undefined)
  const { currentUser } = useAuth();
  const webhookUser = currentUser ?? undefined;

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
            id,
            user_id,
            role,
            created_at,
            updated_at,
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
        webhook_url: projectData.webhookUrl,
        default_definition_of_done: projectData.defaultDefinitionOfDone || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Always add the creator as PRODUCT_OWNER
    const creatorId = webhookUser?.id;
    const teamMemberIds = new Set(projectData.teamMembers?.map(u => u.id) || []);
    
    // Build member list: creator as PO + selected team members
    const membersToInsert = [];
    if (creatorId) {
      membersToInsert.push({
        project_id: data.id,
        user_id: creatorId,
        role: 'PRODUCT_OWNER',
      });
    }
    
    // Add other selected team members (skip if creator is already included)
    if (projectData.teamMembers?.length) {
      for (const u of projectData.teamMembers) {
        if (u.id !== creatorId) {
          membersToInsert.push({
            project_id: data.id,
            user_id: u.id,
            role: 'MEMBER',
          });
        }
      }
    }
    
    if (membersToInsert.length > 0) {
      await supabase.from('project_members').insert(membersToInsert);
    }

    // Send Teams notification
    sendTeamsNotification(projectData.webhookUrl, webhookUser,
      'project_created',
      { entityType: 'project', entityName: projectData.name || 'Nieuw project' },
      projectData.name || 'Nieuw project'
    );

    await fetchData();
    return data.id;
  };

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    // Get existing project for webhook URL and name
    const existingProject = projects.find(p => p.id === id);
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (projectData.name !== undefined) updateData.name = projectData.name;
    if (projectData.description !== undefined) updateData.description = projectData.description;
    if (projectData.color !== undefined) updateData.color = projectData.color;
    if (projectData.columns !== undefined) updateData.columns = JSON.stringify(projectData.columns);
    if (projectData.webhookUrl !== undefined) updateData.webhook_url = projectData.webhookUrl;
    if (projectData.defaultDefinitionOfDone !== undefined) updateData.default_definition_of_done = projectData.defaultDefinitionOfDone;

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    // Update team members only when explicitly provided (from create mode)
    // For edit mode, use addProjectMember/updateProjectMemberRole/removeProjectMember instead
    // to preserve existing roles
    if (projectData.teamMembers) {
      // Get existing members to preserve their roles
      const { data: existingMembers } = await supabase
        .from('project_members')
        .select('user_id, role')
        .eq('project_id', id);
      
      const existingMemberMap = new Map(
        (existingMembers || []).map(m => [m.user_id, m.role])
      );
      
      const newMemberIds = new Set(projectData.teamMembers.map(u => u.id));
      
      // Remove members that are no longer in the list
      const membersToRemove = (existingMembers || [])
        .filter(m => !newMemberIds.has(m.user_id))
        .map(m => m.user_id);
      
      if (membersToRemove.length > 0) {
        await supabase
          .from('project_members')
          .delete()
          .eq('project_id', id)
          .in('user_id', membersToRemove);
      }
      
      // Add new members (preserve role if they already existed, default MEMBER for new)
      const membersToAdd = projectData.teamMembers
        .filter(u => !existingMemberMap.has(u.id));
      
      if (membersToAdd.length > 0) {
        await supabase.from('project_members').insert(
          membersToAdd.map(u => ({
            project_id: id,
            user_id: u.id,
            role: 'MEMBER',
          }))
        );
      }
    }

    // Send Teams notification (use new webhookUrl if provided, otherwise existing)
    const webhookUrl = projectData.webhookUrl ?? existingProject?.webhookUrl;
    const projectName = projectData.name ?? existingProject?.name ?? 'Project';
    sendTeamsNotification(webhookUrl, webhookUser,
      'project_updated',
      { entityType: 'project', entityName: projectName },
      projectName
    );

    await fetchData();
  };

  const deleteProject = async (id: string) => {
    // Get project info before deletion
    const existingProject = projects.find(p => p.id === id);
    
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    
    // Send Teams notification
    if (existingProject) {
      sendTeamsNotification(existingProject.webhookUrl, webhookUser,
        'project_deleted',
        { entityType: 'project', entityName: existingProject.name },
        existingProject.name
      );
    }

    await fetchData();
  };

  // ============================================
  // Sprint CRUD
  // ============================================

  const createSprint = async (sprintData: Partial<Sprint> & { projectId: string }) => {
    // Get project for webhook
    const project = projects.find(p => p.id === sprintData.projectId);
    
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

    // Send Teams notification
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      'sprint_created',
      { entityType: 'sprint', entityName: sprintData.name || 'Nieuwe sprint' },
      project?.name || 'Project'
    );

    await fetchData();
    return data.id;
  };

  const updateSprint = async (id: string, sprintData: Partial<Sprint>) => {
    // Find project for webhook
    const project = findProjectBySprintId(projects, id);
    
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

    // Send Teams notification
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      'sprint_updated',
      { entityType: 'sprint', entityName: sprintData.name || 'Sprint' },
      (project as any)?.name || 'Project'
    );

    await fetchData();
  };

  const deleteSprint = async (id: string) => {
    // Find project and sprint info before deletion
    const project = findProjectBySprintId(projects, id);
    const sprint = projects.flatMap(p => p.sprints).find(s => s.id === id);
    
    const { error } = await supabase.from('sprints').delete().eq('id', id);
    if (error) throw error;
    
    // Send Teams notification
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      'sprint_deleted',
      { entityType: 'sprint', entityName: sprint?.name || 'Sprint' },
      (project as any)?.name || 'Project'
    );

    await fetchData();
  };

  // ============================================
  // Story CRUD
  // ============================================

  const createStory = async (storyData: Partial<Story> & { sprintId: string }) => {
    // Find project for webhook and default DoD
    const project = projects.find(p => p.sprints?.some(s => s.id === storyData.sprintId));
    
    // Auto-populate Definition of Done from project defaults if not provided
    const definitionOfDone = storyData.definitionOfDone && storyData.definitionOfDone.length > 0
      ? storyData.definitionOfDone
      : (project?.defaultDefinitionOfDone || []).map(text => ({ text, completed: false }));
    
    const { data, error } = await supabase
      .from('stories')
      .insert({
        sprint_id: storyData.sprintId,
        title: storyData.title,
        description: storyData.description,
        story_points: storyData.storyPoints,
        priority: storyData.priority,
        status: storyData.status || 'OPEN',
        assignee_id: storyData.assignee?.id || null,
        definition_of_done: definitionOfDone,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Send Teams notification
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      'story_created',
      { entityType: 'story', entityName: storyData.title || 'Nieuwe story' },
      project?.name || 'Project'
    );

    await fetchData();
    return data.id;
  };

  const updateStory = async (id: string, storyData: Partial<Story>) => {
    // Find project and existing story for webhook
    const project = findProjectByStoryId(projects, id);
    const existingStory = projects.flatMap(p => p.sprints).flatMap(s => s.stories).find(s => s.id === id);
    
    const { error } = await supabase
      .from('stories')
      .update({
        title: storyData.title,
        description: storyData.description,
        story_points: storyData.storyPoints,
        priority: storyData.priority,
        status: storyData.status,
        assignee_id: storyData.assignee?.id || null,
        definition_of_done: storyData.definitionOfDone || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    // Send Teams notification - check if status changed
    const activityType: ActivityType = storyData.status && existingStory?.status !== storyData.status 
      ? 'story_status_changed' 
      : 'story_updated';
    
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      activityType,
      { 
        entityType: 'story', 
        entityName: storyData.title || existingStory?.title || 'Story',
        oldValue: activityType === 'story_status_changed' ? existingStory?.status : undefined,
        newValue: activityType === 'story_status_changed' ? storyData.status : undefined,
      },
      project?.name || 'Project'
    );

    await fetchData();
  };

  const deleteStory = async (id: string) => {
    // Find project and story info before deletion
    const project = findProjectByStoryId(projects, id);
    const story = projects.flatMap(p => p.sprints).flatMap(s => s.stories).find(s => s.id === id);
    
    const { error } = await supabase.from('stories').delete().eq('id', id);
    if (error) throw error;
    
    // Send Teams notification
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      'story_deleted',
      { entityType: 'story', entityName: story?.title || 'Story' },
      project?.name || 'Project'
    );

    await fetchData();
  };

  // ============================================
  // Project Member CRUD
  // ============================================

  const addProjectMember = async (projectId: string, userId: string, role: ProjectRole) => {
    // Get project and user for webhook
    const project = projects.find(p => p.id === projectId);
    const user = users.find(u => u.id === userId);
    
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role: role,
      });

    if (error) throw error;
    
    // Send Teams notification
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      'member_added',
      { 
        entityType: 'member', 
        entityName: user?.name || 'Nieuw lid',
        additionalInfo: `Rol: ${role}`
      },
      project?.name || 'Project'
    );

    await fetchData();
  };

  const updateProjectMemberRole = async (projectId: string, userId: string, role: ProjectRole) => {
    // Get project and member info
    const project = projects.find(p => p.id === projectId);
    const member = project?.members?.find(m => m.userId === userId);
    
    const { error } = await supabase
      .from('project_members')
      .update({
        role: role,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
    
    // Send Teams notification
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      'member_role_changed',
      { 
        entityType: 'member', 
        entityName: member?.user.name || 'Lid',
        oldValue: member?.role,
        newValue: role
      },
      project?.name || 'Project'
    );

    await fetchData();
  };

  const removeProjectMember = async (projectId: string, userId: string) => {
    // Get project and member info before removal
    const project = projects.find(p => p.id === projectId);
    const member = project?.members?.find(m => m.userId === userId);
    
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
    
    // Send Teams notification
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      'member_removed',
      { entityType: 'member', entityName: member?.user.name || 'Lid' },
      project?.name || 'Project'
    );

    await fetchData();
  };

  // ============================================
  // Task CRUD
  // ============================================

  const createTask = async (taskData: Partial<Task> & { storyId: string }) => {
    // Find project and story for webhook
    const projectInfo = findProjectByTaskId(projects, taskData.storyId);
    // For new tasks, we need to find the story differently
    let project: { webhookUrl?: string; name: string } | undefined;
    let storyTitle: string | undefined;
    
    for (const p of projects) {
      for (const sprint of p.sprints || []) {
        const story = sprint.stories?.find(s => s.id === taskData.storyId);
        if (story) {
          project = p;
          storyTitle = story.title;
          break;
        }
      }
      if (project) break;
    }
    
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
    
    // Send Teams notification
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      'task_created',
      { 
        entityType: 'task', 
        entityName: taskData.title || 'Nieuwe taak',
        additionalInfo: storyTitle ? `Story: ${storyTitle}` : undefined
      },
      project?.name || 'Project'
    );

    await fetchData();
    return data.id;
  };

  const updateTask = async (id: string, taskData: Partial<Task>) => {
    // Find project and existing task
    const { project, storyTitle } = findProjectByTaskId(projects, id);
    const existingTask = projects
      .flatMap(p => p.sprints)
      .flatMap(s => s.stories)
      .flatMap(s => s.tasks)
      .find(t => t.id === id);
    
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
    
    // Send Teams notification - check if status changed
    const activityType: ActivityType = taskData.status && existingTask?.status !== taskData.status 
      ? 'task_status_changed' 
      : 'task_updated';
    
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      activityType,
      { 
        entityType: 'task', 
        entityName: taskData.title || existingTask?.title || 'Taak',
        oldValue: activityType === 'task_status_changed' ? existingTask?.status : undefined,
        newValue: activityType === 'task_status_changed' ? taskData.status : undefined,
        additionalInfo: storyTitle ? `Story: ${storyTitle}` : undefined
      },
      project?.name || 'Project'
    );

    await fetchData();
  };

  const deleteTask = async (id: string) => {
    // Find project and task info before deletion
    const { project, storyTitle } = findProjectByTaskId(projects, id);
    const task = projects
      .flatMap(p => p.sprints)
      .flatMap(s => s.stories)
      .flatMap(s => s.tasks)
      .find(t => t.id === id);
    
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    
    // Send Teams notification
    sendTeamsNotification(project?.webhookUrl, webhookUser,
      'task_deleted',
      { 
        entityType: 'task', 
        entityName: task?.title || 'Taak',
        additionalInfo: storyTitle ? `Story: ${storyTitle}` : undefined
      },
      project?.name || 'Project'
    );

    await fetchData();
  };

  // Update task status (for drag and drop)
  const updateTaskStatus = async (taskId: string, newStatus: Task['status'], newStoryId?: string) => {
    // Find project and existing task
    const { project, storyTitle: sourceStoryTitle } = findProjectByTaskId(projects, taskId);
    const existingTask = projects
      .flatMap(p => p.sprints)
      .flatMap(s => s.stories)
      .flatMap(s => s.tasks)
      .find(t => t.id === taskId);
    
    // Find destination story title if moving between stories
    let destStoryTitle: string | undefined;
    if (newStoryId) {
      const destStory = projects
        .flatMap(p => p.sprints)
        .flatMap(s => s.stories)
        .find(s => s.id === newStoryId);
      destStoryTitle = destStory?.title;
    }
    
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
    
    // Determine notification type: status change, story move, or both
    const statusChanged = existingTask?.status !== newStatus;
    const storyChanged = newStoryId && newStoryId !== existingTask?.storyId;
    
    if (storyChanged && statusChanged) {
      // Both status and story changed
      sendTeamsNotification(project?.webhookUrl, webhookUser,
        'task_moved',
        { 
          entityType: 'task', 
          entityName: existingTask?.title || 'Taak',
          oldValue: sourceStoryTitle,
          newValue: destStoryTitle,
          additionalInfo: `Status: ${existingTask?.status} → ${newStatus}`
        },
        project?.name || 'Project'
      );
    } else if (storyChanged) {
      // Only story changed (task moved between stories)
      sendTeamsNotification(project?.webhookUrl, webhookUser,
        'task_moved',
        { 
          entityType: 'task', 
          entityName: existingTask?.title || 'Taak',
          oldValue: sourceStoryTitle,
          newValue: destStoryTitle,
        },
        project?.name || 'Project'
      );
    } else if (statusChanged) {
      // Only status changed
      sendTeamsNotification(project?.webhookUrl, webhookUser,
        'task_status_changed',
        { 
          entityType: 'task', 
          entityName: existingTask?.title || 'Taak',
          oldValue: existingTask?.status,
          newValue: newStatus,
          additionalInfo: sourceStoryTitle ? `Story: ${sourceStoryTitle}` : undefined
        },
        project?.name || 'Project'
      );
    }

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

    // Project Member CRUD
    addProjectMember,
    updateProjectMemberRole,
    removeProjectMember,
    
    // Task CRUD
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  };
}
