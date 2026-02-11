'use client';

import { useState, useRef, useEffect } from 'react';
import { User, USER_ROLE_CONFIG } from '@/types';
import { useUser } from '@/lib/UserContext';
import Image from 'next/image';

interface UserSelectorProps {
  users: User[];
}

export default function UserSelector({ users }: UserSelectorProps) {
  const { currentUser, setCurrentUser, permissions } = useUser();
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

  const handleUserSelect = (user: User) => {
    setCurrentUser(user);
    setIsOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
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
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Inloggen als
          </div>
          
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                         transition-colors text-left ${currentUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
            >
              <Image
                src={user.avatar}
                alt={user.name}
                width={36}
                height={36}
                unoptimized
                className="w-9 h-9 rounded-full flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.role || user.email}
                  </span>
                  <RoleBadge role={user.userRole} size="xs" />
                </div>
              </div>
              {currentUser?.id === user.id && (
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}

          {currentUser && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
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
          )}

          {/* Permissions Info */}
          {currentUser && (
            <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 px-3 pb-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Jouw rechten:</p>
              <div className="flex flex-wrap gap-1">
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
                {permissions.canEditTasks && (
                  <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                    Taken bewerken
                  </span>
                )}
                {permissions.isReadOnly && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    Alleen lezen
                  </span>
                )}
              </div>
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
