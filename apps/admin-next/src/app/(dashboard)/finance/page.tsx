/**
 * Finance Page — Server Component
 * Stage 4: 双 Suspense 并行流式渲染
 *   ① FinanceStatsServer → async Server Component，统计数字服务端直出
 *   ② FinanceClient      → Client Component，Tab 切换 + 列表渲染
 */
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Finance' };

import React, { Suspense } from 'react';
import { FinanceStatsServer } from '@/components/finance/FinanceStatsServer';
import { FinanceClient } from '@/components/finance/FinanceClient';

// Stats Hero 骨架
function FinanceStatsSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 shadow-2xl ring-1 ring-white/10 animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-white/10 rounded-lg" />
          <div className="h-4 w-72 bg-white/5 rounded" />
        </div>
        <div className="h-9 w-32 bg-white/5 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 border border-white/10 bg-white/5 space-y-3"
          >
            <div className="h-8 w-8 bg-white/10 rounded-lg" />
            <div className="h-4 w-32 bg-white/10 rounded" />
            <div className="h-8 w-28 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Tabs 骨架
function FinanceTabsSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 p-6 space-y-4 animate-pulse">
      <div className="flex gap-8 border-b border-gray-100 dark:border-white/5 pb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-6 w-32 bg-gray-100 dark:bg-white/5 rounded"
          />
        ))}
      </div>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ① Stats Hero — 服务端直出，先流式到达浏览器 */}
      <Suspense fallback={<FinanceStatsSkeleton />}>
        <FinanceStatsServer />
      </Suspense>

      {/* ② Tabs — Client Component，与 Stats 并行流式，互不阻塞 */}
      <Suspense fallback={<FinanceTabsSkeleton />}>
        <FinanceClient />
      </Suspense>
    </div>
  );
}
