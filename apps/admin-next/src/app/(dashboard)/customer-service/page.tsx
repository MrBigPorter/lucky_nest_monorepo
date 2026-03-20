import type { Metadata } from 'next';
import React from 'react';
import { CustomerServiceDesk } from '@/views/CustomerServiceDesk';

export const metadata: Metadata = { title: 'Customer Service' };

export default function CustomerServicePage() {
  return <CustomerServiceDesk />;
}
