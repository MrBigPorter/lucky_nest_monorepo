/**
 * Notifications Page — Server Component wrapper
 * 通知/推送管理界面
 */
import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import { NotificationManagement } from '@/components/notifications/NotificationsClient';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export const metadata: Metadata = { title: 'Notifications' };

export default function NotificationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NotificationManagement />
    </Suspense>
  );
}
