'use client';

import { useState, useRef, useEffect } from 'react';
import { Project, Sprint } from '@/types';
import { t } from '@/lib/translations';

interface ProjectSprintSelectorProps {
  projects: Project[];
  currentProject: Project;
  currentSprint: Sprint;
  onProjectChange: (projectId: string) => void;
  onSprintChange: (sprintId: string) => void;
  onEditSprint: () => void;
  onNewSprint: () => void;
  onNewProject: () => void;
  onEditProject: () => void;
  canCreateProject?: boolean;
  canCreateSprint?: boolean;
}

export default function ProjectSprintSelector({
  projects,
  currentProject,
  currentSprint,
  onProjectChange,
  onSprintChange,
  onEditSprint,
  onNewSprint,
  onNewProject,
  onEditProject,
  canCreateProject = true,
  canCreateSprint = true,
}: ProjectSprintSelectorProps) {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isSprintDropdownOpen, setIsSprintDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const sprintDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
      if (sprintDropdownRef.current && !sprintDropdownRef.current.contains(event.target as Node)) {
        setIsSprintDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-3">
      {/* Project Selector */}
      <div className="relative" ref={projectDropdownRef}>
        <button
          onClick={() => {
            setIsProjectDropdownOpen(!isProjectDropdownOpen);
            setIsSprintDropdownOpen(false);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                     rounded-lg transition-colors text-sm font-medium"
        >
          {/* Project Color Dot */}
          <span 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: currentProject.color }}
          />
          <span className="text-gray-900 dark:text-white max-w-[120px] truncate">
            {currentProject.name}
          </span>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Project Dropdown */}
        {isProjectDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl 
                          border border-gray-200 dark:border-gray-700 py-2 z-50">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t.project.title}
            </div>
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  onProjectChange(project.id);
                  setIsProjectDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                           transition-colors text-left ${project.id === currentProject.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
              >
                <span 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: project.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {project.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {project.sprints.length} {t.project.sprints} • {project.teamMembers.length} {t.project.members}
                  </p>
                </div>
                {project.id === currentProject.id && (
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
            
            {/* Edit Current Project */}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
              <button
                onClick={() => {
                  onEditProject();
                  setIsProjectDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                           transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Project Instellingen
              </button>
              
              {/* Add New Project - only for ADMINs */}
              {canCreateProject && (
                <button
                  onClick={() => {
                    onNewProject();
                    setIsProjectDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                             transition-colors text-blue-600 dark:text-blue-400 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t.menu.newProject}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Separator */}
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>

      {/* Sprint Selector */}
      <div className="relative" ref={sprintDropdownRef}>
        <button
          onClick={() => {
            setIsSprintDropdownOpen(!isSprintDropdownOpen);
            setIsProjectDropdownOpen(false);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                     rounded-lg transition-colors text-sm font-medium"
        >
          {/* Active indicator */}
          {currentSprint.isActive && (
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
          <span className="text-gray-900 dark:text-white max-w-[150px] truncate">
            {currentSprint.name}
          </span>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform ${isSprintDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Sprint Dropdown */}
        {isSprintDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl 
                          border border-gray-200 dark:border-gray-700 py-2 z-50">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t.sprint.title}
            </div>
            
            {currentProject.sprints.map((sprint) => {
              const isActive = sprint.isActive;
              const endDate = new Date(sprint.endDate);
              const today = new Date();
              const isPast = endDate < today && !isActive;
              
              return (
                <button
                  key={sprint.id}
                  onClick={() => {
                    onSprintChange(sprint.id);
                    setIsSprintDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                             transition-colors text-left ${sprint.id === currentSprint.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                >
                  <div className="flex-shrink-0">
                    {isActive ? (
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    ) : isPast ? (
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {sprint.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(sprint.startDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} - {new Date(sprint.endDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      {' • '}{sprint.stories.length} stories
                    </p>
                  </div>
                  {sprint.id === currentSprint.id && (
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
            
            {/* Sprint Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 space-y-1">
              <button
                onClick={() => {
                  onEditSprint();
                  setIsSprintDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                           transition-colors text-gray-700 dark:text-gray-300 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t.menu.editSprint}
              </button>
              {canCreateSprint && (
                <button
                  onClick={() => {
                    onNewSprint();
                    setIsSprintDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                             transition-colors text-blue-600 dark:text-blue-400 text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t.menu.newSprint}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
