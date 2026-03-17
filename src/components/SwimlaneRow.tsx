'use client';

import { useState } from 'react';
import { Story, Task, Column, getTasksByStatus, TaskStatus, StoryStatus } from '@/types';
import { Droppable } from '@hello-pangea/dnd';
import { Permissions } from '@/lib/permissions';
import StoryCard from './StoryCard';
import TaskCard from './TaskCard';

// Static mapping of light mode bgColor to dark mode equivalent
// Tailwind requires static class names at build time
const DARK_MODE_BG_MAP: Record<string, string> = {
  'bg-slate-50': 'bg-slate-50 dark:bg-slate-700',
  'bg-slate-100': 'bg-slate-100 dark:bg-slate-700',
  'bg-blue-50': 'bg-blue-50 dark:bg-blue-800',
  'bg-blue-100': 'bg-blue-100 dark:bg-blue-800',
  'bg-amber-50': 'bg-amber-50 dark:bg-amber-800',
  'bg-amber-100': 'bg-amber-100 dark:bg-amber-800',
  'bg-green-50': 'bg-green-50 dark:bg-green-800',
  'bg-green-100': 'bg-green-100 dark:bg-green-800',
  'bg-red-50': 'bg-red-50 dark:bg-red-800',
  'bg-red-100': 'bg-red-100 dark:bg-red-800',
  'bg-purple-50': 'bg-purple-50 dark:bg-purple-800',
  'bg-purple-100': 'bg-purple-100 dark:bg-purple-800',
  'bg-yellow-50': 'bg-yellow-50 dark:bg-yellow-800',
  'bg-yellow-100': 'bg-yellow-100 dark:bg-yellow-800',
  'bg-gray-50': 'bg-gray-50 dark:bg-gray-700',
  'bg-gray-100': 'bg-gray-100 dark:bg-gray-700',
};

function getResponsiveBgColor(bgColor: string): string {
  // If already contains dark:, return as-is
  if (bgColor.includes('dark:')) return bgColor;
  // Look up in map, or return with default dark fallback
  return DARK_MODE_BG_MAP[bgColor] || `${bgColor} dark:bg-gray-700`;
}

interface SwimlaneRowProps {
  story: Story;
  columns: Column[];
  permissions: Permissions;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onEditStory?: (story: Story) => void;
  onEditTask?: (task: Task) => void;
  onAddTask?: (storyId: string) => void;
  onStatusChange?: (storyId: string, status: StoryStatus) => void;
}

export default function SwimlaneRow({ story, columns, permissions, collapsed = false, onToggleCollapse, onEditStory, onEditTask, onAddTask, onStatusChange }: SwimlaneRowProps) {
  
  // Collapsed view: compact row with just story title and task counts
  if (collapsed) {
    const completeStatuses = columns.filter(col => col.countsAsComplete).map(col => col.id);
    const totalTasks = story.tasks.length;
    const doneTasks = story.tasks.filter(task => completeStatuses.includes(task.status)).length;

    return (
      <div 
        className="flex items-center gap-4 bg-white/50 dark:bg-gray-800/50 rounded-xl px-4 py-3 backdrop-blur-sm cursor-pointer hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
        onClick={onToggleCollapse}
      >
        {/* Expand icon */}
        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Story title */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {story.title}
          </h3>
        </div>

        {/* Task counts per column */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {columns.map((column) => {
            const count = getTasksByStatus(story, column.id).length;
            return (
              <div key={column.id} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{count}</span>
              </div>
            );
          })}
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
            {doneTasks}/{totalTasks}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 min-h-[200px] bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
      {/* Collapse button + Story Card - Left Side */}
      <div className="flex-shrink-0 flex flex-col">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="mb-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 self-center"
            title="Inklappen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
        <StoryCard 
          story={story} 
          columns={columns}
          onEdit={permissions.canEditStories ? onEditStory : undefined} 
          onAddTask={permissions.canEditTasks ? onAddTask : undefined}
          onStatusChange={permissions.canEditStories ? onStatusChange : undefined}
        />
      </div>

      {/* Task Columns - Right Side */}
      <div className="flex-1 flex gap-3">
        {columns.map((column) => {
          const tasksInColumn = getTasksByStatus(story, column.id);
          const droppableId = `${story.id}|${column.id}`;

          return (
            <div key={column.id} className="flex-1 min-w-[180px]">
              <Droppable droppableId={droppableId} isDropDisabled={!permissions.canDragTasks}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      h-full rounded-lg p-2 transition-colors duration-200
                      ${snapshot.isDraggingOver 
                        ? `${getResponsiveBgColor(column.bgColor)} ring-2 ring-blue-300 dark:ring-blue-500 ring-opacity-50` 
                        : 'bg-gray-50/80 dark:bg-gray-900/50'
                      }
                    `}
                  >
                    {/* Column Task Count Badge */}
                    <div className="flex items-center justify-center mb-2">
                      <span className={`
                        text-xs font-medium px-2 py-0.5 rounded-full
                        ${tasksInColumn.length > 0 ? getResponsiveBgColor(column.bgColor) : 'bg-gray-100 dark:bg-gray-700'}
                        ${tasksInColumn.length > 0 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}
                      `}>
                        {tasksInColumn.length}
                      </span>
                    </div>

                    {/* Tasks */}
                    <div className="space-y-2 min-h-[100px]">
                      {tasksInColumn.map((task, index) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          index={index} 
                          onEdit={permissions.canEditTasks ? onEditTask : undefined}
                          isDragDisabled={!permissions.canDragTasks}
                        />
                      ))}
                      {provided.placeholder}
                    </div>

                    {/* Empty State */}
                    {tasksInColumn.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center h-[100px] text-gray-300 dark:text-gray-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </div>
  );
}
