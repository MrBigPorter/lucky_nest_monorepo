import type { Metadata } from 'next';
import React from 'react';
import { AdsManagement } from '@/views/AdsManagement';

export const metadata: Metadata = { title: 'Ads Management' };

export default function AdsPage() {
  return <AdsManagement />;
}
