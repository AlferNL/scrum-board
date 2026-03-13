'use client';

import { Suspense } from 'react';
import { Board } from '@/components';
import { AuthGuard } from '@/components/AuthGuard';

export default function Home() {
  return (
    <AuthGuard>
      <Suspense>
        <Board />
      </Suspense>
    </AuthGuard>
  );
}
