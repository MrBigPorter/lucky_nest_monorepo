/**
 * Act Section Page — Server Component
 * Phase 3: URL searchParams 驱动 filter
 */
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Act Sections' };

import React, { Suspense } from 'react';
import { ActSectionClient } from '@/components/act/ActSectionClient';

function ActSectionPageSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 p-6 space-y-4 animate-pulse">
      <div className="h-9 w-64 rounded-lg bg-gray-100 dark:bg-white/10" />
      <div className="h-12 w-full rounded-xl bg-gray-100 dark:bg-white/10" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-14 w-full rounded-xl bg-gray-100 dark:bg-white/5"
        />
      ))}
    </div>
  );
}

export default function ActSectionPage() {
  return (
    <Suspense fallback={<ActSectionPageSkeleton />}>
      <ActSectionClient />
    </Suspense>
  );
}
