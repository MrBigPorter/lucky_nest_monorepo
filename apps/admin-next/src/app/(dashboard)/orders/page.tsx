/**
 * Orders Page — Server Component
 * Phase 3: URL searchParams 驱动 filter
 */
import React, { Suspense } from 'react';
import { fetchOrders } from '@/lib/serverFetch';
import { OrdersClient } from '@/components/orders/OrdersClient';

function OrdersPageSkeleton() {
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

export default async function OrdersPage({ searchParams }: { searchParams: Record<string, string> }) {
  const initialData = await fetchOrders(searchParams);

  return (
    <Suspense fallback={<OrdersPageSkeleton />}>
      <OrdersClient initialData={initialData} />
    </Suspense>
  );
}

async function fetchOrders(searchParams: Record<string, string>) {
  const query = new URLSearchParams(searchParams).toString();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/orders?${query}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
}
