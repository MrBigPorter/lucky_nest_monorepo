import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Providers } from '@/components/Providers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

/**
 * Server Component Layout — 认证守卫
 * 服务端读取 HTTP-only Cookie 中的 auth_token，未登录直接跳转 /login。
 * 无客户端 JS 参与 → 彻底消除"加载中"闪烁。
 */
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  return (
    <Providers>
      <DashboardLayout>{children}</DashboardLayout>
    </Providers>
  );
}
