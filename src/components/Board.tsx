'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Sprint, Story, Task, TaskStatus, COLUMNS, Project } from '@/types';
import { mockProjects } from '@/data/mockData';
import { t } from '@/lib/translations';
import SwimlaneRow from './SwimlaneRow';
import BoardHeader from './BoardHeader';
import TaskModal from './TaskModal';
import StoryModal from './StoryModal';
import SprintModal from './SprintModal';
import ProjectModal from './ProjectModal';

export default function Board() {
  // Project and Sprint state
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [currentProjectId, setCurrentProjectId] = useState<string>(mockProjects[0]?.id || '');
  const [currentSprintId, setCurrentSprintId] = useState<string>(
    mockProjects[0]?.sprints.find(s => s.isActive)?.id || mockProjects[0]?.sprints[0]?.id || ''
  );
  
  // Derived state for current project and sprint
  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];
  const currentSprint = currentProject?.sprints.find(s => s.id === currentSprintId) || currentProject?.sprints[0];
  
  // Modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeStoryId, setActiveStoryId] = useState<string>('');

  // Handle project change
  const handleProjectChange = (projectId: string) => {
    setCurrentProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    if (project) {
      // Select the active sprint or the first sprint
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
   */
  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Parse source and destination
    const [sourceStoryId, sourceStatus] = source.droppableId.split('|') as [string, TaskStatus];
    const [destStoryId, destStatus] = destination.droppableId.split('|') as [string, TaskStatus];

    setProjects((prevProjects) => {
      // Deep clone the projects
      const newProjects = JSON.parse(JSON.stringify(prevProjects)) as Project[];
      
      // Find the current project
      const projectIndex = newProjects.findIndex(p => p.id === currentProjectId);
      if (projectIndex === -1) return prevProjects;
      
      // Find the current sprint
      const sprintIndex = newProjects[projectIndex].sprints.findIndex(s => s.id === currentSprintId);
      if (sprintIndex === -1) return prevProjects;
      
      const sprint = newProjects[projectIndex].sprints[sprintIndex];

      // Find the source story
      const sourceStoryIndex = sprint.stories.findIndex((s) => s.id === sourceStoryId);
      if (sourceStoryIndex === -1) return prevProjects;

      const sourceStory = sprint.stories[sourceStoryIndex];

      // Find the task to move
      const taskIndex = sourceStory.tasks.findIndex((t) => t.id === draggableId);
      if (taskIndex === -1) return prevProjects;

      // Remove task from source
      const [movedTask] = sourceStory.tasks.splice(taskIndex, 1);

      // Update task status
      movedTask.status = destStatus;
      movedTask.updatedAt = new Date();

      // If moving within the same story
      if (sourceStoryId === destStoryId) {
        // Get tasks with the destination status to find correct insert position
        const tasksWithDestStatus = sourceStory.tasks.filter((t) => t.status === destStatus);
        
        // Find where to insert in the full tasks array
        if (tasksWithDestStatus.length === 0) {
          sourceStory.tasks.push(movedTask);
        } else {
          // Insert at the correct position among tasks with same status
          const insertAfterTask = tasksWithDestStatus[destination.index - 1];
          if (insertAfterTask) {
            const insertIndex = sourceStory.tasks.findIndex((t) => t.id === insertAfterTask.id) + 1;
            sourceStory.tasks.splice(insertIndex, 0, movedTask);
          } else {
            // Insert at the beginning of tasks with this status
            const firstTaskWithStatus = tasksWithDestStatus[0];
            const insertIndex = sourceStory.tasks.findIndex((t) => t.id === firstTaskWithStatus?.id);
            sourceStory.tasks.splice(insertIndex >= 0 ? insertIndex : 0, 0, movedTask);
          }
        }
      } else {
        // Moving to a different story
        const destStory = sprint.stories.find((s) => s.id === destStoryId);
        if (!destStory) return prevProjects;

        // Update task's storyId
        movedTask.storyId = destStoryId;

        // Get tasks with the destination status
        const tasksWithDestStatus = destStory.tasks.filter((t) => t.status === destStatus);

        if (tasksWithDestStatus.length === 0) {
          destStory.tasks.push(movedTask);
        } else {
          const insertAfterTask = tasksWithDestStatus[destination.index - 1];
          if (insertAfterTask) {
            const insertIndex = destStory.tasks.findIndex((t) => t.id === insertAfterTask.id) + 1;
            destStory.tasks.splice(insertIndex, 0, movedTask);
          } else {
            const firstTaskWithStatus = tasksWithDestStatus[0];
            const insertIndex = destStory.tasks.findIndex((t) => t.id === firstTaskWithStatus?.id);
            destStory.tasks.splice(insertIndex >= 0 ? insertIndex : 0, 0, movedTask);
          }
        }
      }

      return newProjects;
    });
  }, [currentProjectId, currentSprintId]);

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

  const handleSaveTask = (taskData: Partial<Task> & { storyId: string }) => {
    setProjects((prevProjects) => {
      const newProjects = JSON.parse(JSON.stringify(prevProjects)) as Project[];
      const projectIndex = newProjects.findIndex(p => p.id === currentProjectId);
      if (projectIndex === -1) return prevProjects;
      
      const sprintIndex = newProjects[projectIndex].sprints.findIndex(s => s.id === currentSprintId);
      if (sprintIndex === -1) return prevProjects;
      
      const sprint = newProjects[projectIndex].sprints[sprintIndex];
      const storyIndex = sprint.stories.findIndex((s) => s.id === taskData.storyId);
      
      if (storyIndex === -1) return prevProjects;
      
      if (taskData.id) {
        // Update existing task
        const taskIndex = sprint.stories[storyIndex].tasks.findIndex((t) => t.id === taskData.id);
        if (taskIndex !== -1) {
          sprint.stories[storyIndex].tasks[taskIndex] = {
            ...sprint.stories[storyIndex].tasks[taskIndex],
            ...taskData,
            updatedAt: new Date(),
          };
        }
      } else {
        // Create new task
        const newTask: Task = {
          id: `task-${Date.now()}`,
          storyId: taskData.storyId,
          title: taskData.title || '',
          description: taskData.description,
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          assignee: taskData.assignee,
          estimatedHours: taskData.estimatedHours,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        sprint.stories[storyIndex].tasks.push(newTask);
      }
      
      return newProjects;
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setProjects((prevProjects) => {
      const newProjects = JSON.parse(JSON.stringify(prevProjects)) as Project[];
      const projectIndex = newProjects.findIndex(p => p.id === currentProjectId);
      if (projectIndex === -1) return prevProjects;
      
      const sprintIndex = newProjects[projectIndex].sprints.findIndex(s => s.id === currentSprintId);
      if (sprintIndex === -1) return prevProjects;
      
      const sprint = newProjects[projectIndex].sprints[sprintIndex];
      
      for (const story of sprint.stories) {
        const taskIndex = story.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
          story.tasks.splice(taskIndex, 1);
          break;
        }
      }
      
      return newProjects;
    });
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

  const handleSaveStory = (storyData: Partial<Story> & { sprintId: string }) => {
    setProjects((prevProjects) => {
      const newProjects = JSON.parse(JSON.stringify(prevProjects)) as Project[];
      const projectIndex = newProjects.findIndex(p => p.id === currentProjectId);
      if (projectIndex === -1) return prevProjects;
      
      const sprintIndex = newProjects[projectIndex].sprints.findIndex(s => s.id === currentSprintId);
      if (sprintIndex === -1) return prevProjects;
      
      const sprint = newProjects[projectIndex].sprints[sprintIndex];
      
      if (storyData.id) {
        // Update existing story
        const storyIndex = sprint.stories.findIndex((s) => s.id === storyData.id);
        if (storyIndex !== -1) {
          sprint.stories[storyIndex] = {
            ...sprint.stories[storyIndex],
            ...storyData,
            updatedAt: new Date(),
          };
        }
      } else {
        // Create new story
        const newStory: Story = {
          id: `story-${Date.now()}`,
          sprintId: storyData.sprintId,
          title: storyData.title || '',
          description: storyData.description || '',
          storyPoints: storyData.storyPoints || 5,
          priority: storyData.priority || 'medium',
          assignee: storyData.assignee,
          tasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        sprint.stories.push(newStory);
      }
      
      return newProjects;
    });
  };

  const handleDeleteStory = (storyId: string) => {
    setProjects((prevProjects) => {
      const newProjects = JSON.parse(JSON.stringify(prevProjects)) as Project[];
      const projectIndex = newProjects.findIndex(p => p.id === currentProjectId);
      if (projectIndex === -1) return prevProjects;
      
      const sprintIndex = newProjects[projectIndex].sprints.findIndex(s => s.id === currentSprintId);
      if (sprintIndex === -1) return prevProjects;
      
      newProjects[projectIndex].sprints[sprintIndex].stories = 
        newProjects[projectIndex].sprints[sprintIndex].stories.filter((s) => s.id !== storyId);
      return newProjects;
    });
  };

  // ============================================
  // Sprint CRUD Operations
  // ============================================
  
  const handleEditSprint = () => {
    setEditingSprint(currentSprint);
    setSprintModalOpen(true);
  };

  const handleAddSprint = () => {
    setEditingSprint(null);
    setSprintModalOpen(true);
  };

  const handleSaveSprint = (sprintData: Partial<Sprint> & { projectId: string }) => {
    setProjects((prevProjects) => {
      const newProjects = JSON.parse(JSON.stringify(prevProjects)) as Project[];
      const projectIndex = newProjects.findIndex(p => p.id === sprintData.projectId);
      if (projectIndex === -1) return prevProjects;
      
      if (sprintData.id) {
        // Update existing sprint
        const sprintIndex = newProjects[projectIndex].sprints.findIndex((s) => s.id === sprintData.id);
        if (sprintIndex !== -1) {
          // If making this sprint active, deactivate others
          if (sprintData.isActive) {
            newProjects[projectIndex].sprints.forEach(s => s.isActive = false);
          }
          newProjects[projectIndex].sprints[sprintIndex] = {
            ...newProjects[projectIndex].sprints[sprintIndex],
            ...sprintData,
          };
        }
      } else {
        // Create new sprint
        // If making this sprint active, deactivate others
        if (sprintData.isActive) {
          newProjects[projectIndex].sprints.forEach(s => s.isActive = false);
        }
        const newSprint: Sprint = {
          id: `sprint-${Date.now()}`,
          projectId: sprintData.projectId,
          name: sprintData.name || '',
          goal: sprintData.goal,
          startDate: sprintData.startDate || new Date(),
          endDate: sprintData.endDate || new Date(),
          stories: [],
          isActive: sprintData.isActive || false,
          teamMembers: sprintData.teamMembers,
        };
        newProjects[projectIndex].sprints.push(newSprint);
        // Select the new sprint
        setCurrentSprintId(newSprint.id);
      }
      
      return newProjects;
    });
  };

  const handleDeleteSprint = (sprintId: string) => {
    setProjects((prevProjects) => {
      const newProjects = JSON.parse(JSON.stringify(prevProjects)) as Project[];
      const projectIndex = newProjects.findIndex(p => p.id === currentProjectId);
      if (projectIndex === -1) return prevProjects;
      
      newProjects[projectIndex].sprints = 
        newProjects[projectIndex].sprints.filter((s) => s.id !== sprintId);
      
      // If we deleted the current sprint, select another one
      if (sprintId === currentSprintId && newProjects[projectIndex].sprints.length > 0) {
        setCurrentSprintId(newProjects[projectIndex].sprints[0].id);
      }
      
      return newProjects;
    });
  };

  // ============================================
  // Project CRUD Operations
  // ============================================
  
  const handleEditProject = () => {
    setEditingProject(currentProject);
    setProjectModalOpen(true);
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setProjectModalOpen(true);
  };

  const handleSaveProject = (projectData: Partial<Project>) => {
    setProjects((prevProjects) => {
      const newProjects = JSON.parse(JSON.stringify(prevProjects)) as Project[];
      
      if (projectData.id) {
        // Update existing project
        const projectIndex = newProjects.findIndex((p) => p.id === projectData.id);
        if (projectIndex !== -1) {
          newProjects[projectIndex] = {
            ...newProjects[projectIndex],
            ...projectData,
            updatedAt: new Date(),
          };
        }
      } else {
        // Create new project
        const newProject: Project = {
          id: `project-${Date.now()}`,
          name: projectData.name || '',
          description: projectData.description,
          color: projectData.color || '#3B82F6',
          teamMembers: projectData.teamMembers || [],
          sprints: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        newProjects.push(newProject);
        // Select the new project
        setCurrentProjectId(newProject.id);
      }
      
      return newProjects;
    });
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prevProjects) => {
      const newProjects = prevProjects.filter((p) => p.id !== projectId);
      
      // If we deleted the current project, select another one
      if (projectId === currentProjectId && newProjects.length > 0) {
        setCurrentProjectId(newProjects[0].id);
        const activeSprint = newProjects[0].sprints.find(s => s.isActive) || newProjects[0].sprints[0];
        if (activeSprint) {
          setCurrentSprintId(activeSprint.id);
        }
      }
      
      return newProjects;
    });
  };

  // Calculate sprint statistics
  const totalTasks = currentSprint?.stories.reduce((acc, story) => acc + story.tasks.length, 0) || 0;
  const completedTasks = currentSprint?.stories.reduce(
    (acc, story) => acc + story.tasks.filter((t) => t.status === 'done').length,
    0
  ) || 0;
  const totalStoryPoints = currentSprint?.stories.reduce((acc, story) => acc + story.storyPoints, 0) || 0;

  // Guard clause for when there's no data
  if (!currentProject || !currentSprint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{t.project.noProjects}</p>
          <button
            onClick={handleAddProject}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t.menu.newProject}
          </button>
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
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Board Header */}
      <BoardHeader 
        projects={projects}
        currentProject={currentProject}
        sprint={currentSprint}
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        totalStoryPoints={totalStoryPoints}
        onAddStory={handleAddStory}
        onProjectChange={handleProjectChange}
        onSprintChange={handleSprintChange}
        onEditSprint={handleEditSprint}
        onNewSprint={handleAddSprint}
        onNewProject={handleAddProject}
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
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 px-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {column.title}
                  </h2>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drag and Drop Context */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {currentSprint.stories.map((story) => (
              <SwimlaneRow 
                key={story.id} 
                story={story} 
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
      />
    </div>
  );
}
