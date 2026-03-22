import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import { CustomerServiceDesk } from '@/components/customer-service/CustomerServiceClient';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export const metadata: Metadata = { title: 'Customer Service' };

export default function CustomerServicePage() {
  return (
    <Suspense fallback={<PageSkeleton rows={8} />}>
      <CustomerServiceDesk />
    </Suspense>
  );
}
