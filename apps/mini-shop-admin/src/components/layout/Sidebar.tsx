import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { TRANSLATIONS } from '@/constants';
import { routes, RouteConfig } from '@/routes';
import { useRequest } from 'ahooks';
import { motion } from 'framer-motion';

const SidebarItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
}> = ({ to, icon, label, isCollapsed, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `
      flex items-center gap-3 rounded-xl transition-all duration-200 font-medium
      ${
        isActive
          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
      }
      ${isCollapsed ? 'justify-center py-3 px-0 h-12' : 'justify-start px-4 py-3'}
    `}
  >
    {icon}
    <motion.span
      initial={false}
      animate={{
        opacity: isCollapsed ? 0 : 1,
        width: isCollapsed ? 0 : 'auto',
        display: isCollapsed ? 'none' : 'block',
      }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden whitespace-nowrap"
    >
      {label}
    </motion.span>
  </NavLink>
);

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onMobileClose,
}) => {
  const { lang, isSidebarCollapsed, toggleSidebar } = useAppStore();
  const logoutAction = useAuthStore((state) => state.logout);
  const addToast = useToastStore((state) => state.addToast);
  const t = TRANSLATIONS[lang];

  const { loading: isLoggingOut, run: handleLogout } = useRequest(
    logoutAction,
    {
      manual: true,
      onSuccess: () => {
        addToast('info', 'Logged out successfully');
      },
      onError: (error) => {
        addToast('error', `Logout failed: ${error.message}`);
      },
    },
  );

  const groupedRoutes = routes.reduce(
    (acc, route) => {
      const group = route.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(route);
      return acc;
    },
    {} as Record<string, RouteConfig[]>,
  );

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 bg-white dark:bg-dark-900 border-r border-gray-100 dark:border-white/5 transform transition-all duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${isSidebarCollapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col p-4">
          <div
            className={`flex items-center gap-3 px-4 py-6 mb-4 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20 flex-shrink-0">
              L
            </div>
            <motion.h1
              animate={{
                opacity: isSidebarCollapsed ? 0 : 1,
                width: isSidebarCollapsed ? 0 : 'auto',
                display: isSidebarCollapsed ? 'none' : 'block',
              }}
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 overflow-hidden whitespace-nowrap"
            >
              LuxeAdmin
            </motion.h1>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
            {Object.entries(groupedRoutes).map(([group, routesInGroup]) => (
              <div key={group}>
                <motion.div
                  animate={{
                    opacity: isSidebarCollapsed ? 0 : 1,
                    height: isSidebarCollapsed ? 0 : 'auto',
                    display: isSidebarCollapsed ? 'none' : 'block',
                  }}
                  className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6 overflow-hidden whitespace-nowrap"
                >
                  {group}
                </motion.div>
                {routesInGroup.map((route) => (
                  <SidebarItem
                    key={route.path}
                    to={route.path}
                    icon={React.createElement(route.icon, {
                      size: isSidebarCollapsed ? 24 : 18,
                    })}
                    label={t[route.name as keyof typeof t] || route.name}
                    isCollapsed={isSidebarCollapsed}
                    onClick={onMobileClose}
                  />
                ))}
              </div>
            ))}
          </nav>

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5 space-y-1">
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex w-full items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl"
            >
              {isSidebarCollapsed ? (
                <ChevronsRight size={18} />
              ) : (
                <ChevronsLeft size={18} />
              )}
              <motion.span
                animate={{
                  opacity: isSidebarCollapsed ? 0 : 1,
                  width: isSidebarCollapsed ? 0 : 'auto',
                  display: isSidebarCollapsed ? 'none' : 'block',
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                {isSidebarCollapsed ? 'Expand' : 'Collapse'}
              </motion.span>
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="lg:hidden w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">{t.logout}</span>
            </button>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}
    </>
  );
};
