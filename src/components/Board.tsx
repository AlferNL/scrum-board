'use client';

import { useState, useCallback, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Sprint, Story, Task, TaskStatus, COLUMNS, Project, Column } from '@/types';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/lib/AuthContext';
import { t } from '@/lib/translations';
import SwimlaneRow from './SwimlaneRow';
import BoardHeader from './BoardHeader';
import TaskModal from './TaskModal';
import StoryModal from './StoryModal';
import SprintModal from './SprintModal';
import ProjectModal from './ProjectModal';
import ColumnSettingsModal from './ColumnSettingsModal';
import UserSelector from './UserSelector';
import Link from 'next/link';

export default function Board() {
  // User context for permissions
  const { currentUser, permissions } = useAuth();
  
  // Supabase data hook
  const {
    projects,
    users,
    loading,
    error,
    refetch,
    createProject,
    updateProject,
    deleteProject: deleteProjectDb,
    createSprint,
    updateSprint,
    deleteSprint: deleteSprintDb,
    createStory,
    updateStory,
    deleteStory: deleteStoryDb,
    createTask,
    updateTask,
    deleteTask: deleteTaskDb,
    updateTaskStatus,
  } = useSupabaseData();

  // Project and Sprint selection state
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [currentSprintId, setCurrentSprintId] = useState<string>('');
  
  // Set initial project/sprint when data loads
  useEffect(() => {
    if (projects.length > 0 && !currentProjectId) {
      const firstProject = projects[0];
      setCurrentProjectId(firstProject.id);
      const activeSprint = firstProject.sprints.find(s => s.isActive) || firstProject.sprints[0];
      if (activeSprint) {
        setCurrentSprintId(activeSprint.id);
      }
    }
  }, [projects, currentProjectId]);

  // Update sprint selection when project's sprints change (e.g., new sprint created)
  useEffect(() => {
    if (currentProjectId) {
      const project = projects.find(p => p.id === currentProjectId);
      if (project && project.sprints.length > 0 && !currentSprintId) {
        const activeSprint = project.sprints.find(s => s.isActive) || project.sprints[0];
        if (activeSprint) {
          setCurrentSprintId(activeSprint.id);
        }
      }
    }
  }, [projects, currentProjectId, currentSprintId]);
  
  // Derived state for current project and sprint
  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];
  const currentSprint = currentProject?.sprints.find(s => s.id === currentSprintId) || currentProject?.sprints[0];
  
  // Get columns for current project (use custom columns or default)
  const currentColumns = currentProject?.columns && currentProject.columns.length > 0 
    ? currentProject.columns 
    : COLUMNS;
  
  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeStoryId, setActiveStoryId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Handle project change
  const handleProjectChange = (projectId: string) => {
    setCurrentProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const activeSprint = project.sprints.find(s => s.isActive) || project.sprints[0];
      if (activeSprint) {
        setCurrentSprintId(activeSprint.id);
      }
    }
  };

  // Handle sprint change
  const handleSprintChange = (sprintId: string) => {
    setCurrentSprintId(sprintId);
  };

  /**
   * Handle drag end - Move task between columns (and potentially stories)
   * DroppableId format: "storyId|status"
   * Respects user permissions for dragging
   */
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Check permissions
    if (!permissions.canDragTasks) {
      console.log('Permission denied: User cannot drag tasks');
      return;
    }

    const [sourceStoryId] = source.droppableId.split('|') as [string, TaskStatus];
    const [destStoryId, destStatus] = destination.droppableId.split('|') as [string, TaskStatus];

    // If moving to a different story, check story drag permission
    if (sourceStoryId !== destStoryId && !permissions.canDragStories) {
      console.log('Permission denied: User cannot move tasks between stories');
      return;
    }

    try {
      // Update task status in Supabase
      await updateTaskStatus(
        draggableId,
        destStatus,
        sourceStoryId !== destStoryId ? destStoryId : undefined
      );
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  }, [updateTaskStatus, permissions]);

  // ============================================
  // Task CRUD Operations
  // ============================================
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setActiveStoryId(task.storyId);
    setTaskModalOpen(true);
  };

  const handleAddTask = (storyId: string) => {
    setEditingTask(null);
    setActiveStoryId(storyId);
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task> & { storyId: string }) => {
    setSaving(true);
    try {
      if (taskData.id) {
        await updateTask(taskData.id, taskData);
      } else {
        await createTask(taskData);
      }
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setSaving(true);
    try {
      await deleteTaskDb(taskId);
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Story CRUD Operations
  // ============================================
  
  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    setStoryModalOpen(true);
  };

  const handleAddStory = () => {
    setEditingStory(null);
    setStoryModalOpen(true);
  };

  const handleSaveStory = async (storyData: Partial<Story> & { sprintId: string }) => {
    setSaving(true);
    try {
      if (storyData.id) {
        await updateStory(storyData.id, storyData);
      } else {
        await createStory(storyData);
      }
    } catch (err) {
      console.error('Error saving story:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    setSaving(true);
    try {
      await deleteStoryDb(storyId);
    } catch (err) {
      console.error('Error deleting story:', err);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Sprint CRUD Operations
  // ============================================
  
  const handleEditSprint = () => {
    setEditingSprint(currentSprint || null);
    setSprintModalOpen(true);
  };

  const handleAddSprint = () => {
    setEditingSprint(null);
    setSprintModalOpen(true);
  };

  const handleSaveSprint = async (sprintData: Partial<Sprint> & { projectId: string }) => {
    setSaving(true);
    try {
      if (sprintData.id) {
        await updateSprint(sprintData.id, sprintData);
      } else {
        const newSprintId = await createSprint(sprintData);
        if (newSprintId) {
          setCurrentSprintId(newSprintId);
        }
      }
    } catch (err) {
      console.error('Error saving sprint:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    setSaving(true);
    try {
      await deleteSprintDb(sprintId);
      // Select another sprint if we deleted the current one
      if (sprintId === currentSprintId && currentProject?.sprints.length > 1) {
        const otherSprint = currentProject.sprints.find(s => s.id !== sprintId);
        if (otherSprint) {
          setCurrentSprintId(otherSprint.id);
        }
      }
    } catch (err) {
      console.error('Error deleting sprint:', err);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // Project CRUD Operations
  // ============================================
  
  const handleAddProject = () => {
    setEditingProject(null);
    setProjectModalOpen(true);
  };

  const handleEditProject = () => {
    setEditingProject(currentProject);
    setProjectModalOpen(true);
  };

  const handleSaveProject = async (projectData: Partial<Project>) => {
    setSaving(true);
    try {
      if (projectData.id) {
        await updateProject(projectData.id, projectData);
      } else {
        const newProjectId = await createProject(projectData);
        if (newProjectId) {
          setCurrentProjectId(newProjectId);
        }
      }
    } catch (err) {
      console.error('Error saving project:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setSaving(true);
    try {
      await deleteProjectDb(projectId);
      // Select another project if we deleted the current one
      if (projectId === currentProjectId && projects.length > 1) {
        const otherProject = projects.find(p => p.id !== projectId);
        if (otherProject) {
          setCurrentProjectId(otherProject.id);
          const activeSprint = otherProject.sprints.find(s => s.isActive) || otherProject.sprints[0];
          if (activeSprint) {
            setCurrentSprintId(activeSprint.id);
          }
        }
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle saving column settings
  const handleSaveColumns = async (columns: Column[]) => {
    if (!currentProject) return;
    setSaving(true);
    try {
      await updateProject(currentProject.id, { columns });
    } catch (err) {
      console.error('Error saving columns:', err);
    } finally {
      setSaving(false);
    }
  };

  // Calculate sprint statistics
  const totalTasks = currentSprint?.stories.reduce((acc, story) => acc + story.tasks.length, 0) || 0;
  const completedTasks = currentSprint?.stories.reduce(
    (acc, story) => acc + story.tasks.filter((t) => t.status === 'done').length,
    0
  ) || 0;
  const totalStories = currentSprint?.stories.length || 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t.common.error}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  // Empty state - no projects at all
  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{t.project.noProjects}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleAddProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {t.menu.newProject}
            </button>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        </div>
        
        <ProjectModal
          project={editingProject}
          isOpen={projectModalOpen}
          onClose={() => {
            setProjectModalOpen(false);
            setEditingProject(null);
          }}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
          users={users}
        />
      </div>
    );
  }

  // Empty state - project exists but has no sprints
  if (!currentSprint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Header with project selector */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: currentProject.color }}
              />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentProject.name}
              </h1>
              {projects.length > 1 && (
                <select
                  value={currentProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={handleAddProject}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
            >
              + Nieuw Project
            </button>
          </div>
        </div>

        {/* Empty sprint state */}
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Geen sprints in dit project
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Maak een sprint aan om te beginnen met het plannen van werk.
            </p>
            <button
              onClick={handleAddSprint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {t.menu.newSprint}
            </button>
          </div>
        </div>
        
        <SprintModal
          sprint={editingSprint}
          projectId={currentProject.id}
          isOpen={sprintModalOpen}
          onClose={() => {
            setSprintModalOpen(false);
            setEditingSprint(null);
          }}
          onSave={handleSaveSprint}
          onDelete={handleDeleteSprint}
          users={users}
        />

        <ProjectModal
          project={editingProject}
          isOpen={projectModalOpen}
          onClose={() => {
            setProjectModalOpen(false);
            setEditingProject(null);
          }}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
          users={users}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Saving indicator */}
      {saving && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Opslaan...</span>
        </div>
      )}

      {/* Board Header */}
      <BoardHeader 
        projects={projects}
        currentProject={currentProject}
        sprint={currentSprint}
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        totalStories={totalStories}
        onAddStory={permissions.canEditTasks ? handleAddStory : undefined}
        onProjectChange={handleProjectChange}
        onSprintChange={handleSprintChange}
        onEditSprint={handleEditSprint}
        onNewSprint={handleAddSprint}
        onNewProject={handleAddProject}
        onEditProject={handleEditProject}
      />

      {/* Main Board Area */}
      <div className="px-6 pb-6">
        {/* Column Headers */}
        <div className="flex gap-4 mb-4 sticky top-0 z-10 bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-2">
          {/* Spacer for Story Card Column */}
          <div className="min-w-[280px] max-w-[280px] flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider px-4">
              {t.board.userStories}
            </h2>
          </div>

          {/* Column Headers */}
          <div className="flex-1 flex gap-3">
            {currentColumns.map((column) => (
              <div key={column.id} className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 px-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {column.title}
                  </h2>
                </div>
              </div>
            ))}
            {/* Column Settings Button */}
            <button
              onClick={() => setColumnSettingsOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Kolommen beheren"
            >
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Drag and Drop Context */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {currentSprint.stories.map((story) => (
              <SwimlaneRow 
                key={story.id} 
                story={story}
                columns={currentColumns}
                onEditStory={handleEditStory}
                onEditTask={handleEditTask}
                onAddTask={handleAddTask}
              />
            ))}
          </div>
        </DragDropContext>

        {/* Empty State */}
        {currentSprint.stories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium">{t.empty.noStories}</p>
            <p className="text-sm">{t.empty.addStories}</p>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        task={editingTask}
        storyId={activeStoryId}
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        users={users}
      />

      {/* Story Modal */}
      <StoryModal
        story={editingStory}
        sprintId={currentSprint.id}
        isOpen={storyModalOpen}
        onClose={() => {
          setStoryModalOpen(false);
          setEditingStory(null);
        }}
        onSave={handleSaveStory}
        onDelete={handleDeleteStory}
        users={users}
      />

      {/* Sprint Modal */}
      <SprintModal
        sprint={editingSprint}
        projectId={currentProject.id}
        isOpen={sprintModalOpen}
        onClose={() => {
          setSprintModalOpen(false);
          setEditingSprint(null);
        }}
        onSave={handleSaveSprint}
        onDelete={handleDeleteSprint}
        users={users}
      />

      {/* Project Modal */}
      <ProjectModal
        project={editingProject}
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        onDelete={handleDeleteProject}
        users={users}
      />

      {/* Column Settings Modal */}
      <ColumnSettingsModal
        columns={currentColumns}
        isOpen={columnSettingsOpen}
        onClose={() => setColumnSettingsOpen(false)}
        onSave={handleSaveColumns}
      />
    </div>
  );
}
