'use client';

import { useState, useRef, useEffect } from 'react';
import { USER_ROLE_CONFIG } from '@/types';
import { useAuth } from '@/lib/AuthContext';
import Image from 'next/image';

export default function UserSelector() {
  const { currentUser, permissions, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                   rounded-lg transition-colors"
      >
        {currentUser ? (
          <>
            <Image
              src={currentUser.avatar}
              alt={currentUser.name}
              width={28}
              height={28}
              unoptimized
              className="w-7 h-7 rounded-full"
            />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]">
                {currentUser.name}
              </p>
              <RoleBadge role={currentUser.userRole} size="sm" />
            </div>
          </>
        ) : (
          <>
            <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Inloggen</span>
          </>
        )}
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl 
                        border border-gray-200 dark:border-gray-700 py-2 z-50">
          
          {currentUser ? (
            <>
              {/* Current User Info */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Image
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    width={40}
                    height={40}
                    unoptimized
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                    <RoleBadge role={currentUser.userRole} size="sm" />
                  </div>
                </div>
              </div>

              {/* Permissions Info */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">Jouw rechten:</p>
                <div className="flex flex-wrap gap-1">
                  {permissions.canManageUsers && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                      Gebruikers beheren
                    </span>
                  )}
                  {permissions.canEditProjects && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      Projecten beheren
                    </span>
                  )}
                  {permissions.canEditSprints && (
                    <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded">
                      Sprints beheren
                    </span>
                  )}
                  {permissions.canEditStories && (
                    <span className="text-xs px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded">
                      Stories beheren
                    </span>
                  )}
                  {permissions.canEditTasks && (
                    <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      Taken bewerken
                    </span>
                  )}
                  {permissions.canDragTasks && (
                    <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      Taken verplaatsen
                    </span>
                  )}
                  {permissions.canDragStories && (
                    <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      Stories sorteren
                    </span>
                  )}
                  {permissions.canDeleteProject && (
                    <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                      Projecten verwijderen
                    </span>
                  )}
                  {permissions.isReadOnly && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      Alleen lezen
                    </span>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                           transition-colors text-red-600 dark:text-red-400 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Uitloggen
              </button>
            </>
          ) : (
            <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">Niet ingelogd</p>
              <p className="text-xs mt-1">Ga naar /login om in te loggen</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Role Badge Component - Shows a visual indicator of user role
 */
interface RoleBadgeProps {
  role: string;
  size?: 'xs' | 'sm' | 'md';
}

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const config = USER_ROLE_CONFIG[role as keyof typeof USER_ROLE_CONFIG];
  
  if (!config) return null;

  const sizeClasses = {
    xs: 'text-[10px] px-1 py-0',
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  return (
    <span className={`${sizeClasses[size]} ${config.bgColor} ${config.color} rounded font-medium`}>
      {config.label}
    </span>
  );
}
