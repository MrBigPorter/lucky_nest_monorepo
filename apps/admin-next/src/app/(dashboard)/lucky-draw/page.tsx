import type { Metadata } from 'next';
import React from 'react';
import { LuckyDrawManagement } from '@/views/LuckyDrawManagement';

export const metadata: Metadata = { title: 'Lucky Draw' };

export default function LuckyDrawPage() {
  return <LuckyDrawManagement />;
}
