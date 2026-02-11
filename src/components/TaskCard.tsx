'use client';

import { Task, PRIORITY_CONFIG } from '@/types';
import { Draggable } from '@hello-pangea/dnd';
import Image from 'next/image';
import { t } from '@/lib/translations';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit?: (task: Task) => void;
  isDragDisabled?: boolean;
}

export default function TaskCard({ task, index, onEdit, isDragDisabled = false }: TaskCardProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  const handleClick = (e: React.MouseEvent) => {
    // Only allow edit if onEdit handler is provided
    if (onEdit) {
      onEdit(task);
    }
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={handleClick}
          className={`
            bg-white dark:bg-gray-800 rounded-lg p-3 mb-2 shadow-sm 
            border border-gray-100 dark:border-gray-700
            hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 
            transition-all duration-200 group
            ${onEdit ? 'cursor-pointer' : 'cursor-default'}
            ${isDragDisabled ? 'opacity-90' : ''}
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400 ring-opacity-50 rotate-2' : ''}
          `}
        >
          {/* Task Title */}
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
            {task.title}
          </h4>

          {/* Task Metadata Row */}
          <div className="flex items-center justify-between">
            {/* Priority Badge */}
            <span
              className={`
                text-xs font-medium px-2 py-0.5 rounded-full
                ${priorityConfig.bgColor} ${priorityConfig.color}
                dark:bg-opacity-20
              `}
            >
              {priorityConfig.label}
            </span>

            {/* Right side: Hours & Avatar */}
            <div className="flex items-center gap-2">
              {/* Estimated Hours */}
              {task.estimatedHours && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {task.estimatedHours}{t.task.hours}
                </span>
              )}

              {/* Assignee Avatar */}
              {task.assignee && (
                <div className="relative group/avatar">
                  <Image
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    width={24}
                    height={24}
                    unoptimized
                    className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-gray-700"
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {task.assignee.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
