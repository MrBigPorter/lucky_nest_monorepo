/**
 * Payment Channels Page — Server Component
 * Moved from /payment/channels → /payment-channels (flattened)
 */
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Payment Channels' };

import React, { Suspense } from 'react';
import { PaymentChannelsClient } from '@/components/payment/PaymentChannelsClient';

function PaymentChannelsPageSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 p-6 space-y-4 animate-pulse">
      <div className="h-9 w-64 rounded-lg bg-gray-100 dark:bg-white/10" />
      <div className="h-12 w-full rounded-xl bg-gray-100 dark:bg-white/10" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-14 w-full rounded-xl bg-gray-100 dark:bg-white/5"
        />
      ))}
    </div>
  );
}

export default function PaymentChannelsPage() {
  return (
    <Suspense fallback={<PaymentChannelsPageSkeleton />}>
      <PaymentChannelsClient />
    </Suspense>
  );
}
