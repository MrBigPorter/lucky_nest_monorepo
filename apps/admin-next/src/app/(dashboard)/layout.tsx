
import React from 'react';
import { Providers } from '@/components/Providers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <DashboardLayout>{children}</DashboardLayout>
    </Providers>
  );
}
