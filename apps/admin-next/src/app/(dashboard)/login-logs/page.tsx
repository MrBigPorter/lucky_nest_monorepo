import type { Metadata } from 'next';
import React from 'react';
import { LoginLogList } from '@/views/LoginLogList';

export const metadata: Metadata = { title: 'Login Logs' };

export default function LoginLogsPage() {
  return <LoginLogList />;
}
