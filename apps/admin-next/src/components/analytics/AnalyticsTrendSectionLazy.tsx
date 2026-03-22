'use client';

import dynamic from 'next/dynamic';

/**
 * Client-only lazy wrapper for recharts section.
 *
 * Kept in a client file so Server Component pages can import it
 * without using `dynamic(..., { ssr: false })` directly.
 */
export const AnalyticsTrendSectionLazy = dynamic(
  () =>
    import('@/components/analytics/AnalyticsTrendSection').then(
      (mod) => mod.AnalyticsTrendSection,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] rounded-xl bg-gray-100 animate-pulse dark:bg-gray-800" />
    ),
  },
);
