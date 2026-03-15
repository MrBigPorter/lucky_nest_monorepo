'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { TRANSLATIONS } from '@/constants';
import { routes } from '@/routes';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

/**
 * DashboardLayout — 代替原 React 版的 Layout.tsx
 * 包含客户端 Auth Guard（静态导出模式下 middleware 不生效）
 */
export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { lang } = useAppStore();
  const t = TRANSLATIONS[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // ── 客户端 Auth Guard ────────────────────────────────────────
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuth();
    setAuthChecked(true);
  }, [checkAuth]);

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authChecked, isAuthenticated, router]);

  // ── 页面信息 ─────────────────────────────────────────────────
  const pageInfo = useMemo(() => {
    // Next.js 路由去掉末尾 /（trailingSlash 模式下会多一个 /）
    const normalizedPath = pathname.replace(/\/$/, '') || '/';
    const currentRoute = routes.find((r) => r.path === normalizedPath);
    if (currentRoute) {
      return {
        title: t[currentRoute.name as keyof typeof t] || currentRoute.name,
        path: [
          currentRoute.group,
          t[currentRoute.name as keyof typeof t] || currentRoute.name,
        ],
      };
    }
    return { title: 'LuxeAdmin', path: [] };
  }, [pathname, t]);

  // 等待 auth 检查完毕，避免闪屏
  if (!authChecked || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 font-sans">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col w-full transition-all duration-300 ease-in-out">
        <Header
          onMenuButtonClick={() => setMobileMenuOpen(true)}
          pageTitle={pageInfo.title}
          breadcrumbs={pageInfo.path}
        />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
};
