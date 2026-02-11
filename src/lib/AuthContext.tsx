'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { User, UserRole, UserStatus } from '@/types';
import { getPermissions, Permissions } from '@/lib/permissions';

interface AuthContextType {
  // Supabase Auth state
  authUser: SupabaseUser | null;
  session: Session | null;
  
  // App user state
  currentUser: User | null;
  permissions: Permissions;
  
  // Loading states
  isLoading: boolean;
  isAuthChecking: boolean;
  
  // Auth methods
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  
  // Status helpers
  isPending: boolean;
  isApproved: boolean;
  isRejected: boolean;
}

const defaultPermissions = getPermissions(undefined);

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  session: null,
  currentUser: null,
  permissions: defaultPermissions,
  isLoading: true,
  isAuthChecking: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  isPending: false,
  isApproved: false,
  isRejected: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Load user profile from database
  const loadUserProfile = async (authId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error || !data) {
        console.error('Error loading user profile:', error);
        return null;
      }

      const user: User = {
        id: data.id,
        name: data.name,
        email: data.email || undefined,
        avatar: data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
        role: data.role || undefined,
        userRole: (data.user_role as UserRole) || 'VIEWER',
        status: (data.status as UserStatus) || 'PENDING',
        authId: data.auth_id || undefined,
      };

      return user;
    } catch (err) {
      console.error('Error in loadUserProfile:', err);
      return null;
    }
  };

  // Check if this is the first user (for auto-admin)
  const isFirstUser = async (): Promise<boolean> => {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error checking user count:', error);
        return false;
      }

      return count === 0;
    } catch (err) {
      console.error('Error in isFirstUser:', err);
      return false;
    }
  };

  // Sign up new user
  const signUp = async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: 'Registratie mislukt' };
      }

      // Check if first user (becomes admin)
      const firstUser = await isFirstUser();

      // Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          name,
          email,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          user_role: firstUser ? 'ADMIN' : 'MEMBER',
          status: firstUser ? 'APPROVED' : 'PENDING',
          auth_id: authData.user.id,
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Try to clean up auth user if profile creation fails
        await supabase.auth.signOut();
        return { error: 'Fout bij aanmaken profiel: ' + profileError.message };
      }

      return { error: null };
    } catch (err) {
      console.error('SignUp error:', err);
      return { error: 'Er is een onverwachte fout opgetreden' };
    }
  };

  // Sign in existing user
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Ongeldige e-mail of wachtwoord' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('SignIn error:', err);
      return { error: 'Er is een onverwachte fout opgetreden' };
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setSession(null);
    setCurrentUser(null);
    setPermissions(defaultPermissions);
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      setIsAuthChecking(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setAuthUser(session?.user ?? null);
        setIsAuthChecking(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load user profile when auth user changes
  useEffect(() => {
    const loadProfile = async () => {
      if (authUser) {
        setIsLoading(true);
        const profile = await loadUserProfile(authUser.id);
        setCurrentUser(profile);
        if (profile) {
          setPermissions(getPermissions(profile.userRole));
        } else {
          setPermissions(defaultPermissions);
        }
        setIsLoading(false);
      } else {
        setCurrentUser(null);
        setPermissions(defaultPermissions);
        setIsLoading(false);
      }
    };

    if (!isAuthChecking) {
      loadProfile();
    }
  }, [authUser, isAuthChecking]);

  const isPending = currentUser?.status === 'PENDING';
  const isApproved = currentUser?.status === 'APPROVED';
  const isRejected = currentUser?.status === 'REJECTED';

  return (
    <AuthContext.Provider
      value={{
        authUser,
        session,
        currentUser,
        permissions,
        isLoading,
        isAuthChecking,
        signUp,
        signIn,
        signOut,
        isPending,
        isApproved,
        isRejected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
