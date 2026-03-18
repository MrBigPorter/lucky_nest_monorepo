/**
 * Customer Service Desk — Server Component wrapper
 * Phase 5-D: IM / 聊天客服接待台
 */
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Customer Support' };

import React from 'react';
import { CustomerServiceDesk } from '@/views/CustomerServiceDesk';

export default function ImPage() {
  return <CustomerServiceDesk />;
}
