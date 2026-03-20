'use client';

/**
 * MarketingClient — Client Component wrapper
 * Marketing view manages its own state internally (no URL filter needed)
 */
import React from 'react';
import { Marketing } from '@/views/Marketing';

export function MarketingClient() {
  return <Marketing />;
}
