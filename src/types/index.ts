// ============================================
// Scrum Board TypeScript Interfaces
// ============================================

/**
 * Task Status represents the workflow columns
 */
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

/**
 * Priority levels for tasks and stories
 */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

/**
 * User/Team Member interface
 */
export interface User {
  id: string;
  name: string;
  avatar: string; // URL to avatar image
  email?: string;
  role?: string;
}

/**
 * Subtask interface - represents individual tasks within a User Story
 * These are the draggable items that move between columns
 */
export interface Task {
  id: string;
  storyId: string; // Reference to parent User Story
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: User;
  priority: Priority;
  estimatedHours?: number;
  loggedHours?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Story interface - represents a feature/requirement
 * Contains multiple subtasks and displays as a swimlane row
 */
export interface Story {
  id: string;
  sprintId: string; // Reference to parent Sprint
  title: string;
  description: string;
  storyPoints: number;
  priority: Priority;
  assignee?: User;
  tasks: Task[];
  acceptanceCriteria?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sprint interface - represents a time-boxed iteration
 * Contains multiple User Stories
 */
export interface Sprint {
  id: string;
  projectId: string; // Reference to parent Project
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  stories: Story[];
  isActive: boolean;
  teamMembers?: User[];
}

/**
 * Project interface - represents a project containing multiple sprints
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string; // Hex color for project branding
  teamMembers: User[];
  sprints: Sprint[];
  columns?: Column[]; // Custom columns for this project
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Column configuration for the board
 */
export interface Column {
  id: TaskStatus;
  title: string;
  color: string; // Tailwind color class
  bgColor: string; // Background color class
}

/**
 * Board state interface for managing drag and drop
 */
export interface BoardState {
  sprint: Sprint;
  columns: Column[];
}

// ============================================
// Column Configuration (Dutch)
// ============================================

export const COLUMNS: Column[] = [
  {
    id: 'todo',
    title: 'Te Doen',
    color: 'bg-slate-500',
    bgColor: 'bg-slate-50',
  },
  {
    id: 'in-progress',
    title: 'In Uitvoering',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'review',
    title: 'Review',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'done',
    title: 'Voltooid',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
  },
];

// ============================================
// Utility Types
// ============================================

/**
 * Helper type for calculating story progress
 */
export interface StoryProgress {
  total: number;
  completed: number;
  percentage: number;
}

/**
 * Calculate story completion progress
 */
export function calculateStoryProgress(story: Story): StoryProgress {
  const total = story.tasks.length;
  const completed = story.tasks.filter((task) => task.status === 'done').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}

/**
 * Get tasks by status for a specific story
 */
export function getTasksByStatus(story: Story, status: TaskStatus): Task[] {
  return story.tasks.filter((task) => task.status === status);
}

/**
 * Priority configuration with colors (Dutch)
 */
export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Laag', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  medium: { label: 'Gemiddeld', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { label: 'Hoog', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  critical: { label: 'Kritiek', color: 'text-red-600', bgColor: 'bg-red-100' },
};
