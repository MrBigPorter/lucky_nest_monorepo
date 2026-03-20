import type { Metadata } from 'next';
import React from 'react';
import { SupportChannels } from '@/views/SupportChannels';

export const metadata: Metadata = {
  title: 'Support Channels',
};

export default function SupportChannelsPage() {
  return <SupportChannels />;
}

