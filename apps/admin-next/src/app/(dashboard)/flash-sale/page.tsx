import type { Metadata } from 'next';
import React from 'react';
import { FlashSaleManagement } from '@/views/FlashSaleManagement';

export const metadata: Metadata = { title: 'Flash Sale' };

export default function FlashSalePage() {
  return <FlashSaleManagement />;
}
