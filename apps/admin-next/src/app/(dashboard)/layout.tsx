'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Force entire dashboard tree to be client-side only (no SSR).
// Admin app relies on localStorage/document/window — skip server render.
const DashboardClientShell = dynamic(
  () =>
    import('@/components/layout/DashboardLayout').then((m) => {
      const { DashboardLayout } = m;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Providers } = require('@/components/Providers');
      const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      );
      return { default: Shell };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  },
);

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardClientShell>{children}</DashboardClientShell>;
}
