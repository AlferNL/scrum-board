'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { authUser, currentUser, isLoading, isAuthChecking, isPending, isRejected, permissions } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to be checked
    if (isAuthChecking || isLoading) return;

    // Not logged in - redirect to login
    if (!authUser) {
      router.push('/login');
      return;
    }

    // User profile not found (shouldn't happen normally)
    if (!currentUser) {
      return;
    }

    // User is pending - redirect to pending page
    if (isPending) {
      router.push('/pending');
      return;
    }

    // User is rejected - redirect to pending page (shows rejected message)
    if (isRejected) {
      router.push('/pending');
      return;
    }

    // Admin required but user is not admin
    if (requireAdmin && !permissions.canManageUsers) {
      router.push('/');
      return;
    }
  }, [authUser, currentUser, isLoading, isAuthChecking, isPending, isRejected, requireAdmin, permissions, router]);

  // Show loading state
  if (isAuthChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!authUser || !currentUser) {
    return null;
  }

  // Pending or rejected
  if (isPending || isRejected) {
    return null;
  }

  // Admin required but not admin
  if (requireAdmin && !permissions.canManageUsers) {
    return null;
  }

  // All checks passed - render children
  return <>{children}</>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuard requireAdmin>{children}</AuthGuard>;
}
