'use client';

import React, { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { TRANSLATIONS } from '@/constants';
import { routes } from '@/routes';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

/**
 * DashboardLayout — 客户端 Layout Shell
 * 认证保护由 middleware.ts 负责（server-side，无闪烁）
 * 此组件只负责渲染 Sidebar / Header / MainContent 骨架
 */
export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { lang } = useAppStore();
  const t = TRANSLATIONS[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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
