import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { SystemConfig } from '@/components/settings/SettingsClient';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export const metadata: Metadata = { title: 'System Settings' };

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={4} />}>
      <SystemConfig />
    </Suspense>
  );
}
