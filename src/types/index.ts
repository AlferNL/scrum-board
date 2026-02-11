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
 * User Roles for access control (global)
 */
export type UserRole = 'ADMIN' | 'PRODUCT_OWNER' | 'SCRUM_MASTER' | 'MEMBER' | 'VIEWER';

/**
 * Project Roles for project-specific access control
 * Note: ADMIN is global only, not assignable per project
 */
export type ProjectRole = 'PRODUCT_OWNER' | 'SCRUM_MASTER' | 'MEMBER' | 'VIEWER';

/**
 * User Status for approval workflow
 */
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Story Status for tracking story progress
 */
export type StoryStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';

/**
 * Status configuration with labels and colors
 */
export const USER_STATUS_CONFIG: Record<UserStatus, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Wachtend', color: 'text-yellow-700', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  APPROVED: { label: 'Goedgekeurd', color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  REJECTED: { label: 'Afgewezen', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
};

/**
 * Story Status configuration with labels and colors
 */
export const STORY_STATUS_CONFIG: Record<StoryStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  OPEN: { label: 'Open', color: 'text-slate-700 dark:text-slate-200', bgColor: 'bg-slate-200 dark:bg-slate-700', icon: '○' },
  IN_PROGRESS: { label: 'Bezig', color: 'text-blue-700 dark:text-blue-200', bgColor: 'bg-blue-200 dark:bg-blue-800', icon: '◐' },
  DONE: { label: 'Klaar', color: 'text-green-700 dark:text-green-200', bgColor: 'bg-green-200 dark:bg-green-800', icon: '●' },
  ARCHIVED: { label: 'Archief', color: 'text-gray-600 dark:text-gray-300', bgColor: 'bg-gray-200 dark:bg-gray-700', icon: '◉' },
};

/**
 * Role configuration with labels and colors (global roles)
 */
export const USER_ROLE_CONFIG: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  ADMIN: { label: 'Admin', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  PRODUCT_OWNER: { label: 'Product Owner', color: 'text-purple-700', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  SCRUM_MASTER: { label: 'Scrum Master', color: 'text-teal-700', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  MEMBER: { label: 'Lid', color: 'text-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  VIEWER: { label: 'Kijker', color: 'text-gray-700', bgColor: 'bg-gray-100 dark:bg-gray-700' },
};

/**
 * Project Role configuration (same styling as user roles, but without ADMIN)
 */
export const PROJECT_ROLE_CONFIG: Record<ProjectRole, { label: string; color: string; bgColor: string }> = {
  PRODUCT_OWNER: { label: 'Product Owner', color: 'text-purple-700', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  SCRUM_MASTER: { label: 'Scrum Master', color: 'text-teal-700', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  MEMBER: { label: 'Lid', color: 'text-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  VIEWER: { label: 'Kijker', color: 'text-gray-700', bgColor: 'bg-gray-100 dark:bg-gray-700' },
};

/**
 * User/Team Member interface
 */
export interface User {
  id: string;
  name: string;
  avatar: string; // URL to avatar image
  email?: string;
  role?: string; // Job title/role description
  userRole: UserRole; // Access control role
  status: UserStatus; // Approval status
  authId?: string; // Supabase Auth user ID
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
  status: StoryStatus; // Story workflow status
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
 * Project Member with role - represents a user's membership and role in a specific project
 */
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  user: User;
  role: ProjectRole;
  createdAt: Date;
  updatedAt: Date;
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
  members?: ProjectMember[]; // Project members with roles
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
  countsAsComplete?: boolean; // If true, tasks in this column count as completed
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
    countsAsComplete: false,
  },
  {
    id: 'in-progress',
    title: 'In Uitvoering',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    countsAsComplete: false,
  },
  {
    id: 'review',
    title: 'Review',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    countsAsComplete: false,
  },
  {
    id: 'done',
    title: 'Voltooid',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    countsAsComplete: true,
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
 * Get statuses that count as complete
 */
export function getCompleteStatuses(): TaskStatus[] {
  return COLUMNS.filter((col) => col.countsAsComplete).map((col) => col.id);
}

/**
 * Calculate story completion progress
 */
export function calculateStoryProgress(story: Story): StoryProgress {
  const total = story.tasks.length;
  const completeStatuses = getCompleteStatuses();
  const completed = story.tasks.filter((task) => completeStatuses.includes(task.status)).length;
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
