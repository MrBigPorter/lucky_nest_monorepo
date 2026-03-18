/**
 * Analytics Page — Server Component
 * SSR 预取 overview 统计 + 客户端 trend 图表
 */
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Analytics' };

import React, { Suspense } from 'react';
import { AnalyticsOverview } from '@/components/analytics/AnalyticsOverview';
import { AnalyticsOverviewSkeleton } from '@/components/analytics/AnalyticsOverviewSkeleton';
import { AnalyticsTrendSection } from '@/components/analytics/AnalyticsTrendSection';
import { PageHeader } from '@/components/scaffold/PageHeader';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Analytics"
        description="Real-time overview of users, orders, revenue and trends."
      />

      {/* 统计卡片 — async Server Component + Streaming */}
      <Suspense fallback={<AnalyticsOverviewSkeleton />}>
        <AnalyticsOverview />
      </Suspense>

      {/* 趋势图表 — Client Component（recharts） */}
      <AnalyticsTrendSection />
    </div>
  );
}

