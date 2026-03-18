/**
 * Finance Page — Server Component
 * Phase 3: URL searchParams 驱动 filter
 */
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Finance' };

import React, { Suspense } from 'react';
import { FinanceClient } from '@/components/finance/FinanceClient';

function FinancePageSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 p-6 space-y-4 animate-pulse">
      {/* 顶部 Hero 区域的骨架 */}
      <div className="h-48 w-full rounded-3xl bg-gray-100 dark:bg-white/5" />
      {/* Tab 区域的骨架 */}
      <div className="flex gap-8 border-b border-gray-100 dark:border-white/5 pb-4">
        <div className="h-6 w-32 bg-gray-100 dark:bg-white/5 rounded" />
        <div className="h-6 w-32 bg-gray-100 dark:bg-white/5 rounded" />
        <div className="h-6 w-32 bg-gray-100 dark:bg-white/5 rounded" />
      </div>
      {/* 表格区域的骨架 */}
      <div className="h-12 w-full rounded-xl bg-gray-100 dark:bg-white/10" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-14 w-full rounded-xl bg-gray-100 dark:bg-white/5"
        />
      ))}
    </div>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={<FinancePageSkeleton />}>
      <FinanceClient />
    </Suspense>
  );
}
