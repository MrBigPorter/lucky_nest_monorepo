import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { TRANSLATIONS } from '@/constants';
import { routes } from '@/routes';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { lang, isSidebarCollapsed } = useAppStore();
  const t = TRANSLATIONS[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const pageInfo = useMemo(() => {
    const currentRoute = routes.find(
      (route) => route.path === location.pathname,
    );
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
  }, [location.pathname, lang, t]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 font-sans">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div
        className={`flex-1 flex flex-col w-full transition-all duration-300 ease-in-out `}
      >
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
