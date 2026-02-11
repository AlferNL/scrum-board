'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { getPermissions, Permissions } from '@/lib/permissions';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  permissions: Permissions;
  isAuthenticated: boolean;
}

// Default permissions for unauthenticated users
const defaultPermissions = getPermissions(undefined);

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  permissions: defaultPermissions,
  isAuthenticated: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);

  // Update permissions when user changes
  useEffect(() => {
    if (currentUser) {
      setPermissions(getPermissions(currentUser.userRole));
    } else {
      setPermissions(defaultPermissions);
    }
  }, [currentUser]);

  // Load user from localStorage on mount (simple persistence)
  useEffect(() => {
    const savedUser = localStorage.getItem('scrumboard_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (e) {
        console.error('Error loading saved user:', e);
      }
    }
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('scrumboard_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('scrumboard_current_user');
    }
  }, [currentUser]);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        permissions,
        isAuthenticated: currentUser !== null,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export { UserContext };
