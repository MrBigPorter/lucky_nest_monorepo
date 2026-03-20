/**
 * Notifications Page — Server Component wrapper
 * 通知/推送管理界面
 */
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notifications' };

import React from 'react';
import { NotificationManagement } from '@/views/NotificationManagement';

export default function NotificationsPage() {
  return <NotificationManagement />;
}
