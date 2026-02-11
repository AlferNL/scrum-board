'use client';

import { Story, Task, Column, getTasksByStatus, TaskStatus, StoryStatus } from '@/types';
import { Droppable } from '@hello-pangea/dnd';
import { Permissions } from '@/lib/permissions';
import StoryCard from './StoryCard';
import TaskCard from './TaskCard';

interface SwimlaneRowProps {
  story: Story;
  columns: Column[];
  permissions: Permissions;
  onEditStory?: (story: Story) => void;
  onEditTask?: (task: Task) => void;
  onAddTask?: (storyId: string) => void;
  onStatusChange?: (storyId: string, status: StoryStatus) => void;
}

export default function SwimlaneRow({ story, columns, permissions, onEditStory, onEditTask, onAddTask, onStatusChange }: SwimlaneRowProps) {
  
  return (
    <div className="flex gap-4 min-h-[200px] bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 backdrop-blur-sm">
      {/* Story Card - Left Side */}
      <div className="flex-shrink-0">
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
                        ? `${column.bgColor} dark:bg-opacity-20 ring-2 ring-blue-300 dark:ring-blue-500 ring-opacity-50` 
                        : 'bg-gray-50/80 dark:bg-gray-900/50'
                      }
                    `}
                  >
                    {/* Column Task Count Badge */}
                    <div className="flex items-center justify-center mb-2">
                      <span className={`
                        text-xs font-medium px-2 py-0.5 rounded-full
                        ${tasksInColumn.length > 0 ? column.bgColor : 'bg-gray-100 dark:bg-gray-700'}
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
