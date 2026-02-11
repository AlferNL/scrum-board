'use client';

import { ThemeProvider } from '@/lib/ThemeContext';
import { UserProvider } from '@/lib/UserContext';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </ThemeProvider>
  );
}
