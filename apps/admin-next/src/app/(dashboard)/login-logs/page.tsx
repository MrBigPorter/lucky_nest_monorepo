import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { LoginLogList } from '@/components/login-logs/LoginLogsClient';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export const metadata: Metadata = { title: 'Login Logs' };

export default function LoginLogsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LoginLogList />
    </Suspense>
  );
}
