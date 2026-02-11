'use client';

import { Story, calculateStoryProgress, PRIORITY_CONFIG } from '@/types';
import Image from 'next/image';
import { t } from '@/lib/translations';

interface StoryCardProps {
  story: Story;
  onEdit?: (story: Story) => void;
  onAddTask?: (storyId: string) => void;
}

export default function StoryCard({ story, onEdit, onAddTask }: StoryCardProps) {
  const progress = calculateStoryProgress(story);
  const priorityConfig = PRIORITY_CONFIG[story.priority];

  // Determine progress bar color based on completion
  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 min-w-[280px] max-w-[280px] h-full flex flex-col group">
      {/* Header with Priority & Story Points */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`
            text-xs font-semibold px-2.5 py-1 rounded-full
            ${priorityConfig.bgColor} ${priorityConfig.color}
            dark:bg-opacity-20
          `}
        >
          {priorityConfig.label}
        </span>
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
          {/* Story Points */}
          <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-bold">{story.storyPoints}</span>
          </div>
        </div>
      </div>

      {/* Story Title */}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
        {story.title}
      </h3>

      {/* Story Description */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3 flex-grow">
        {story.description}
      </p>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t.story.progress}</span>
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
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

      {/* Footer: Assignee & Story ID */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
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
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
              {story.assignee.name}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500 italic">
            {t.common.unassigned}
          </span>
        )}

        {/* Story ID */}
        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono uppercase">
          {story.id}
        </span>
      </div>
    </div>
  );
}
