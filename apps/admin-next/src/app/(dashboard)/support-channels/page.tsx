import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { SupportChannels } from '@/components/support-channels/SupportChannelsClient';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export const metadata: Metadata = {
  title: 'Support Channels',
};

export default function SupportChannelsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SupportChannels />
    </Suspense>
  );
}
