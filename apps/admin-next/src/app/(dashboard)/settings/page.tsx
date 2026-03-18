import type { Metadata } from 'next';
import React from 'react';
import { SystemConfig } from '@/views/SystemConfig';

export const metadata: Metadata = { title: 'System Settings' };

export default function SettingsPage() {
  return <SystemConfig />;
}
