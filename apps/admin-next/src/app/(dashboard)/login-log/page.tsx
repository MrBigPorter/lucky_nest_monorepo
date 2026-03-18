import type { Metadata } from 'next';
import React from 'react';
import { LoginLogList } from '@/views/LoginLogList';

export const metadata: Metadata = { title: 'Login Logs' };

// Legacy alias route kept for old bookmarks: /login-log
export default function LoginLogAliasPage() {
  return <LoginLogList />;
}
