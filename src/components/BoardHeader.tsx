'use client';

import { Sprint, Project } from '@/types';
import { t } from '@/lib/translations';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import ProjectSprintSelector from './ProjectSprintSelector';
import UserSelector from './UserSelector';
import Link from 'next/link';

interface BoardHeaderProps {
  projects: Project[];
  currentProject: Project;
  sprint: Sprint;
  totalTasks: number;
  completedTasks: number;
  totalStoryPoints: number;
  onAddStory?: () => void;
  onProjectChange: (projectId: string) => void;
  onSprintChange: (sprintId: string) => void;
  onEditSprint: () => void;
  onNewSprint: () => void;
  onNewProject: () => void;
  onEditProject: () => void;
}

export default function BoardHeader({
  projects,
  currentProject,
  sprint,
  totalTasks,
  completedTasks,
  totalStoryPoints,
  onAddStory,
  onProjectChange,
  onSprintChange,
  onEditSprint,
  onNewSprint,
  onNewProject,
  onEditProject,
}: BoardHeaderProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { permissions } = useAuth();
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Format dates in Dutch
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate days remaining
  const daysRemaining = () => {
    const end = new Date(sprint.endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-6 py-4">
        {/* Top Row: Sprint Name & Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Logo/Icon */}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            
            {/* Project & Sprint Selector */}
            <ProjectSprintSelector
              projects={projects}
              currentProject={currentProject}
              currentSprint={sprint}
              onProjectChange={onProjectChange}
              onSprintChange={onSprintChange}
              onEditSprint={onEditSprint}
              onNewSprint={onNewSprint}
              onNewProject={onNewProject}
              onEditProject={onEditProject}
            />
          </div>

          {/* Right side: Actions & Status */}
          <div className="flex items-center gap-4">
            {/* Add Story Button */}
            <button
              onClick={onAddStory}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                         text-white rounded-lg transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.menu.newStory}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 
                         dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={isDark ? t.menu.lightMode : t.menu.darkMode}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Admin Link - only for admins */}
            {permissions.canManageUsers && (
              <Link
                href="/admin"
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 
                           dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Admin Panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}

            {/* User Selector */}
            <UserSelector />

            {/* Sprint Status Badge */}
            {sprint.isActive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {t.board.activeSprint}
              </span>
            )}
            
            {/* Days Remaining */}
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{daysRemaining()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.board.daysLeft}</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-8">
          {/* Sprint Dates */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}</span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

          {/* Stories Count */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{sprint.stories.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.board.stories}</p>
            </div>
          </div>

          {/* Story Points */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{totalStoryPoints}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.board.points}</p>
            </div>
          </div>

          {/* Tasks Progress */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{completedTasks}/{totalTasks}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.board.tasksDone}</p>
            </div>
          </div>

          {/* Sprint Progress Bar */}
          <div className="flex-1 max-w-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t.board.sprintProgress}</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{progressPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercentage === 100 
                    ? 'bg-green-500' 
                    : progressPercentage >= 75 
                      ? 'bg-blue-500' 
                      : 'bg-blue-400'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
