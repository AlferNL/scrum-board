'use client';

import { ThemeProvider } from '@/lib/ThemeContext';
import { UserProvider } from '@/lib/UserContext';
import { AuthProvider } from '@/lib/AuthContext';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          {children}
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
