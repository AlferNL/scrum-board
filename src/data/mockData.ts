import { Sprint, User, Story, Task, Project } from '@/types';

// ============================================
// Mock Users / Team Members
// ============================================

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    email: 'sarah.chen@company.com',
    role: 'Frontend Developer',
    userRole: 'ADMIN',
    status: 'APPROVED',
  },
  {
    id: 'user-2',
    name: 'Marcus Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    email: 'marcus.johnson@company.com',
    role: 'Backend Developer',
    userRole: 'PRODUCT_OWNER',
    status: 'APPROVED',
  },
  {
    id: 'user-3',
    name: 'Elena Rodriguez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    email: 'elena.rodriguez@company.com',
    role: 'UX Designer',
    userRole: 'MEMBER',
    status: 'APPROVED',
  },
  {
    id: 'user-4',
    name: 'David Kim',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    email: 'david.kim@company.com',
    role: 'Full Stack Developer',
    userRole: 'MEMBER',
    status: 'APPROVED',
  },
  {
    id: 'user-5',
    name: 'Anna Müller',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
    email: 'anna.mueller@company.com',
    role: 'QA Engineer',
    userRole: 'VIEWER',
    status: 'APPROVED',
  },
];

// ============================================
// Mock Tasks for User Stories
// ============================================

const createTask = (
  id: string,
  storyId: string,
  title: string,
  status: Task['status'],
  priority: Task['priority'],
  assignee?: User,
  description?: string,
  estimatedHours?: number,
  loggedHours?: number
): Task => ({
  id,
  storyId,
  title,
  description,
  status,
  priority,
  assignee,
  estimatedHours: estimatedHours ?? 4,
  loggedHours: loggedHours ?? 0,
  tags: [],
  createdAt: new Date('2026-02-01'),
  updatedAt: new Date('2026-02-10'),
});

// ============================================
// Mock User Stories with Tasks
// ============================================

export const mockStories: Story[] = [
  {
    id: 'story-1',
    sprintId: 'sprint-1',
    title: 'User Authentication System',
    description: 'Implement complete user authentication with login, registration, and password reset functionality.',
    storyPoints: 13,
    priority: 'high',
    status: 'OPEN',
    assignee: mockUsers[0],
    acceptanceCriteria: [
      'Users can register with email and password',
      'Users can login with credentials',
      'Password reset via email works',
      'JWT tokens are properly managed',
    ],
    tasks: [
      createTask('task-1-1', 'story-1', 'Design login page UI', 'done', 'high', mockUsers[2]),
      createTask('task-1-2', 'story-1', 'Implement login API endpoint', 'done', 'high', mockUsers[1]),
      createTask('task-1-3', 'story-1', 'Create registration form', 'review', 'medium', mockUsers[0]),
      createTask('task-1-4', 'story-1', 'Add form validation', 'in-progress', 'medium', mockUsers[0]),
      createTask('task-1-5', 'story-1', 'Implement password reset flow', 'todo', 'medium', mockUsers[1]),
      createTask('task-1-6', 'story-1', 'Write unit tests for auth', 'todo', 'low', mockUsers[4]),
    ],
    createdAt: new Date('2026-01-28'),
    updatedAt: new Date('2026-02-10'),
  },
  {
    id: 'story-2',
    sprintId: 'sprint-1',
    title: 'Dashboard Analytics Widget',
    description: 'Create an interactive dashboard with charts showing key performance metrics and user analytics.',
    storyPoints: 8,
    priority: 'medium',
    status: 'IN_PROGRESS',
    assignee: mockUsers[3],
    acceptanceCriteria: [
      'Display real-time user statistics',
      'Show interactive charts',
      'Data refreshes automatically',
      'Responsive design for mobile',
    ],
    tasks: [
      createTask('task-2-1', 'story-2', 'Design widget mockups', 'done', 'high', mockUsers[2]),
      createTask('task-2-2', 'story-2', 'Setup chart library', 'done', 'medium', mockUsers[3]),
      createTask('task-2-3', 'story-2', 'Create API for analytics data', 'in-progress', 'high', mockUsers[1]),
      createTask('task-2-4', 'story-2', 'Build chart components', 'in-progress', 'medium', mockUsers[3]),
      createTask('task-2-5', 'story-2', 'Add responsive styling', 'todo', 'low', mockUsers[0]),
    ],
    createdAt: new Date('2026-01-29'),
    updatedAt: new Date('2026-02-09'),
  },
  {
    id: 'story-3',
    sprintId: 'sprint-1',
    title: 'Notification System',
    description: 'Build a real-time notification system with in-app alerts and email notifications.',
    storyPoints: 5,
    priority: 'medium',
    status: 'IN_PROGRESS',
    assignee: mockUsers[1],
    acceptanceCriteria: [
      'Users receive in-app notifications',
      'Email notifications are sent',
      'Users can manage notification preferences',
      'Notifications show timestamps',
    ],
    tasks: [
      createTask('task-3-1', 'story-3', 'Design notification dropdown', 'done', 'medium', mockUsers[2]),
      createTask('task-3-2', 'story-3', 'Create notification service', 'review', 'high', mockUsers[1]),
      createTask('task-3-3', 'story-3', 'Implement WebSocket connection', 'in-progress', 'high', mockUsers[1]),
      createTask('task-3-4', 'story-3', 'Build email templates', 'todo', 'medium', mockUsers[2]),
    ],
    createdAt: new Date('2026-01-30'),
    updatedAt: new Date('2026-02-08'),
  },
  {
    id: 'story-4',
    sprintId: 'sprint-1',
    title: 'User Profile Management',
    description: 'Allow users to view and edit their profile information including avatar upload.',
    storyPoints: 5,
    priority: 'low',
    status: 'DONE',
    assignee: mockUsers[0],
    acceptanceCriteria: [
      'Users can view their profile',
      'Users can edit personal information',
      'Avatar upload works correctly',
      'Changes are saved to database',
    ],
    tasks: [
      createTask('task-4-1', 'story-4', 'Design profile page layout', 'done', 'medium', mockUsers[2]),
      createTask('task-4-2', 'story-4', 'Create profile API endpoints', 'done', 'medium', mockUsers[1]),
      createTask('task-4-3', 'story-4', 'Build profile edit form', 'done', 'medium', mockUsers[0]),
      createTask('task-4-4', 'story-4', 'Implement avatar upload', 'review', 'medium', mockUsers[3]),
      createTask('task-4-5', 'story-4', 'Add profile validation', 'done', 'low', mockUsers[0]),
    ],
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-10'),
  },
];

// Stories for Sprint 2
const mockStoriesSprint2: Story[] = [
  {
    id: 'story-5',
    sprintId: 'sprint-2',
    title: 'Data Export Feature',
    description: 'Allow users to export their data in various formats (CSV, PDF, Excel).',
    storyPoints: 8,
    priority: 'high',
    status: 'OPEN',
    assignee: mockUsers[3],
    acceptanceCriteria: [
      'Export to CSV works',
      'Export to PDF works',
      'Export to Excel works',
    ],
    tasks: [
      createTask('task-5-1', 'story-5', 'Design export UI', 'done', 'medium', mockUsers[2]),
      createTask('task-5-2', 'story-5', 'Implement CSV export', 'done', 'high', mockUsers[3]),
      createTask('task-5-3', 'story-5', 'Implement PDF export', 'in-progress', 'high', mockUsers[3]),
      createTask('task-5-4', 'story-5', 'Implement Excel export', 'todo', 'medium', mockUsers[1]),
    ],
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-20'),
  },
];

// Stories for Project 2 - Mobile App
const mockStoriesMobile: Story[] = [
  {
    id: 'story-m1',
    sprintId: 'sprint-m1',
    title: 'Mobile App Setup',
    description: 'Setup React Native project with navigation and theming.',
    storyPoints: 5,
    priority: 'high',
    status: 'IN_PROGRESS',
    assignee: mockUsers[0],
    acceptanceCriteria: [
      'Project initialised with Expo',
      'Navigation working',
      'Theme system in place',
    ],
    tasks: [
      createTask('task-m1-1', 'story-m1', 'Initialize React Native project', 'done', 'high', mockUsers[0]),
      createTask('task-m1-2', 'story-m1', 'Setup navigation', 'done', 'high', mockUsers[0]),
      createTask('task-m1-3', 'story-m1', 'Implement theming', 'review', 'medium', mockUsers[2]),
    ],
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-08'),
  },
  {
    id: 'story-m2',
    sprintId: 'sprint-m1',
    title: 'Mobile Login Screen',
    description: 'Build login and registration screens for mobile app.',
    storyPoints: 8,
    priority: 'high',
    status: 'OPEN',
    assignee: mockUsers[0],
    acceptanceCriteria: [
      'Login screen designed',
      'Registration screen designed',
      'Form validation working',
    ],
    tasks: [
      createTask('task-m2-1', 'story-m2', 'Design login screen', 'done', 'high', mockUsers[2]),
      createTask('task-m2-2', 'story-m2', 'Build login screen', 'in-progress', 'high', mockUsers[0]),
      createTask('task-m2-3', 'story-m2', 'Build registration screen', 'todo', 'medium', mockUsers[0]),
      createTask('task-m2-4', 'story-m2', 'Add form validation', 'todo', 'medium', mockUsers[4]),
    ],
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-08'),
  },
];

// ============================================
// Mock Sprint Data
// ============================================

export const mockSprint: Sprint = {
  id: 'sprint-1',
  projectId: 'project-1',
  name: 'Sprint 7 - Q1 2026',
  goal: 'Kernfunctionaliteit voor gebruikersbeheer en dashboard analytics afronden',
  startDate: new Date('2026-02-03'),
  endDate: new Date('2026-02-14'),
  stories: mockStories,
  isActive: true,
  teamMembers: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4]],
};

const mockSprint2: Sprint = {
  id: 'sprint-2',
  projectId: 'project-1',
  name: 'Sprint 8 - Q1 2026',
  goal: 'Data export en rapportage features implementeren',
  startDate: new Date('2026-02-17'),
  endDate: new Date('2026-02-28'),
  stories: mockStoriesSprint2,
  isActive: false,
  teamMembers: [mockUsers[0], mockUsers[1], mockUsers[3]],
};

const mockSprintMobile: Sprint = {
  id: 'sprint-m1',
  projectId: 'project-2',
  name: 'Mobile Sprint 1',
  goal: 'Basis mobile applicatie opzetten met authenticatie',
  startDate: new Date('2026-02-01'),
  endDate: new Date('2026-02-14'),
  stories: mockStoriesMobile,
  isActive: true,
  teamMembers: [mockUsers[0], mockUsers[2], mockUsers[4]],
};

// ============================================
// Mock Projects Data
// ============================================

export const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Web Platform',
    description: 'Hoofdproject voor de web applicatie ontwikkeling',
    color: '#3B82F6', // blue
    teamMembers: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4]],
    sprints: [mockSprint, mockSprint2],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-02-10'),
  },
  {
    id: 'project-2',
    name: 'Mobile App',
    description: 'React Native mobiele applicatie ontwikkeling',
    color: '#10B981', // green
    teamMembers: [mockUsers[0], mockUsers[2], mockUsers[4]],
    sprints: [mockSprintMobile],
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-02-08'),
  },
];

// ============================================
// Helper function to get initial board state
// ============================================

export function getInitialBoardState(): Project[] {
  return JSON.parse(JSON.stringify(mockProjects));
}
