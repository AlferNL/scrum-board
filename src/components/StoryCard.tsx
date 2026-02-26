'use client';

import { useState, useRef, useEffect } from 'react';
import { Story, Column, PRIORITY_CONFIG, COLUMNS, STORY_STATUS_CONFIG, StoryStatus } from '@/types';
import Image from 'next/image';
import { t } from '@/lib/translations';

interface StoryCardProps {
  story: Story;
  columns?: Column[];
  onEdit?: (story: Story) => void;
  onAddTask?: (storyId: string) => void;
  onStatusChange?: (storyId: string, status: StoryStatus) => void;
}

export default function StoryCard({ story, columns = COLUMNS, onEdit, onAddTask, onStatusChange }: StoryCardProps) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate progress using dynamic columns
  const completeStatuses = columns.filter(col => col.countsAsComplete).map(col => col.id);
  const total = story.tasks.length;
  const completed = story.tasks.filter(task => completeStatuses.includes(task.status)).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const progress = { total, completed, percentage };
  
  const priorityConfig = PRIORITY_CONFIG[story.priority];
  const statusConfig = story.status ? STORY_STATUS_CONFIG[story.status] : STORY_STATUS_CONFIG.OPEN;

  const handleStatusChange = (newStatus: StoryStatus) => {
    if (onStatusChange) {
      onStatusChange(story.id, newStatus);
    }
    setStatusMenuOpen(false);
  };

  // Determine progress bar color based on completion
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 min-w-[280px] max-w-[280px] h-full flex flex-col group">
      {/* Header with Priority, Status & Edit */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`
              text-xs font-semibold px-2.5 py-1 rounded-full
              ${priorityConfig.bgColor} ${priorityConfig.color}
              dark:bg-opacity-20
            `}
          >
            {priorityConfig.label}
          </span>
          {/* Status Badge - clickable dropdown */}
          <div className="relative" ref={statusMenuRef}>
            <button
              onClick={() => onStatusChange && setStatusMenuOpen(!statusMenuOpen)}
              className={`
                text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer flex items-center gap-1
                ${statusConfig.bgColor} ${statusConfig.color}
                ${onStatusChange ? 'hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 transition-all' : ''}
              `}
              title={onStatusChange ? `Status: ${t.storyStatus[story.status || 'OPEN']} (klik om te wijzigen)` : t.storyStatus[story.status || 'OPEN']}
              disabled={!onStatusChange}
            >
              <span>{statusConfig.icon}</span>
              <span>{statusConfig.label}</span>
            </button>
            
            {/* Status Dropdown Menu */}
            {statusMenuOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 min-w-[140px]">
                {(Object.keys(STORY_STATUS_CONFIG) as StoryStatus[]).map((status) => {
                  const config = STORY_STATUS_CONFIG[status];
                  const isCurrentStatus = (story.status || 'OPEN') === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm
                        hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                        ${isCurrentStatus ? 'bg-gray-50 dark:bg-gray-700/50' : ''}
                      `}
                    >
                      <span className={`${config.color}`}>{config.icon}</span>
                      <span className={`${isCurrentStatus ? 'font-medium' : ''} text-gray-700 dark:text-gray-200`}>
                        {t.storyStatus[status]}
                      </span>
                      {isCurrentStatus && (
                        <svg className="w-4 h-4 ml-auto text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Edit Button - only show if onEdit handler is provided */}
          {onEdit && (
            <button
              onClick={() => onEdit(story)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
                         opacity-0 group-hover:opacity-100"
              title={t.story.edit}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Story Title */}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
        {story.title}
      </h3>

      {/* Story Description */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-3 flex-grow">
        {story.description}
      </p>

      {/* Acceptance Criteria */}
      {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {t.story.acceptanceCriteria} ({story.acceptanceCriteria.length})
            </span>
          </div>
          <ul className="space-y-1">
            {story.acceptanceCriteria.slice(0, 3).map((criterion, index) => (
              <li key={index} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <span className="text-green-500 mt-0.5">✓</span>
                <span className="line-clamp-1">{criterion}</span>
              </li>
            ))}
            {story.acceptanceCriteria.length > 3 && (
              <li className="text-xs text-gray-400 dark:text-gray-500 italic pl-4">
                +{story.acceptanceCriteria.length - 3} {t.common.more}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Definition of Done */}
      {story.definitionOfDone && story.definitionOfDone.length > 0 && (
        <div className="mb-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {t.story.definitionOfDone}
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {story.definitionOfDone.filter(d => d.completed).length}/{story.definitionOfDone.length}
            </span>
          </div>
          {/* DoD progress bar */}
          <div className="h-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(story.definitionOfDone.filter(d => d.completed).length / story.definitionOfDone.length) * 100}%` }}
            />
          </div>
          <ul className="space-y-1">
            {story.definitionOfDone.slice(0, 3).map((item, index) => (
              <li key={index} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <span className={`mt-0.5 ${item.completed ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}`}>
                  {item.completed ? '✓' : '○'}
                </span>
                <span className={item.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}>
                  {item.text}
                </span>
              </li>
            ))}
            {story.definitionOfDone.length > 3 && (
              <li className="text-xs text-gray-400 dark:text-gray-500 italic pl-4">
                +{story.definitionOfDone.length - 3} {t.common.more}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{t.story.progress}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-100">
            {progress.completed}/{progress.total} {t.story.tasks}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress.percentage)}`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        
        {/* Percentage Label */}
        <div className="text-right mt-1">
          <span className={`text-xs font-bold ${progress.percentage === 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {progress.percentage}%
          </span>
        </div>
      </div>

      {/* Add Task Button - only show if onAddTask handler is provided */}
      {onAddTask && (
        <button
          onClick={() => onAddTask(story.id)}
          className="w-full mb-3 py-2 px-3 border-2 border-dashed border-gray-200 dark:border-gray-600 
                     rounded-lg text-sm text-gray-500 dark:text-gray-400 font-medium
                     hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400
                     transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.story.addTask}
        </button>
      )}

      {/* Footer: Assignee */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
        {/* Assignee */}
        {story.assignee ? (
          <div className="flex items-center gap-2">
            <Image
              src={story.assignee.avatar}
              alt={story.assignee.name}
              width={28}
              height={28}
              unoptimized
              className="w-7 h-7 rounded-full ring-2 ring-gray-100 dark:ring-gray-700"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {story.assignee.name}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500 italic">
            {t.common.unassigned}
          </span>
        )}
      </div>
    </div>
  );
}
