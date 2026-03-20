/**
 * Categories Page — Server Component
 * (No search params needed for this view yet, but making it a Server Component for consistency)
 */
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Categories' };

import React from 'react';
import { CategoryManagement } from '@/views/CategoryManagement';

export default function CategoriesPage() {
  return <CategoryManagement />;
}
