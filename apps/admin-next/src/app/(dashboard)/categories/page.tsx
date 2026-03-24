/**
 * Categories Page — Server Component
 * (No search params needed for this view yet, but making it a Server Component for consistency)
 */
import type { Metadata } from 'next';
import React, { Suspense } from 'react';

import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { CategoryManagement } from '@/components/categories/CategoriesClient';

export const metadata: Metadata = { title: 'Categories' };

export default function CategoriesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CategoryManagement />
    </Suspense>
  );
}
