'use client';

import { Board } from '@/components';
import { AuthGuard } from '@/components/AuthGuard';

export default function Home() {
  return (
    <AuthGuard>
      <Board />
    </AuthGuard>
  );
}
