import React from 'react';
import { motion } from 'framer-motion';
import {
  Menu,
  Search,
  Sparkles,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useToastStore } from '@/store/useToastStore';
import { Dropdown, Breadcrumbs } from '@/components/UIComponents';
import { useRequest } from 'ahooks';

interface HeaderProps {
  onMenuButtonClick: () => void;
  pageTitle: string;
  breadcrumbs: string[];
}

export const Header: React.FC<HeaderProps> = ({
  onMenuButtonClick,
  pageTitle,
  breadcrumbs,
}) => {
  const { theme, toggleTheme, lang, toggleLang } = useAppStore();
  const logoutAction = useAuthStore((state) => state.logout);
  const addToast = useToastStore((state) => state.addToast);

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

  return (
    <header className="h-16 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={onMenuButtonClick} className="lg:hidden text-gray-500">
          <Menu size={24} />
        </button>

        <div className="hidden sm:block">
          <Breadcrumbs items={breadcrumbs} />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white leading-tight -mt-1">
            {pageTitle}
          </h2>
        </div>

        <div className="hidden md:flex items-center ml-8 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-transparent focus-within:border-primary-500/50 focus-within:bg-white dark:focus-within:bg-black/20 transition-all w-64 lg:w-96 group">
          <Search
            size={16}
            className="text-gray-400 mr-2 group-focus-within:text-primary-500"
          />
          <input
            type="text"
            placeholder="Search orders, users, products..."
            className="bg-transparent border-none outline-none text-sm w-full text-gray-700 dark:text-white placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 transition-all text-sm font-medium"
          onClick={() =>
            addToast(
              'info',
              'AI Assistant: I can help analyze your sales data.',
            )
          }
        >
          <Sparkles size={16} />
          <span>AI Assist</span>
        </motion.button>

        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

        <button
          onClick={toggleLang}
          className="p-2 text-gray-500 hover:text-primary-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <span className="font-bold text-xs">
            {lang === 'en' ? 'EN' : '中'}
          </span>
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:text-amber-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
        >
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <Dropdown
          trigger={
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden border border-gray-200 dark:border-white/10 ring-2 ring-transparent hover:ring-primary-500/30 transition-all">
                <img
                  src="https://picsum.photos/32/32"
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <ChevronDown
                size={14}
                className="text-gray-500 hidden sm:block"
              />
            </div>
          }
          items={[
            {
              label: 'My Profile',
              icon: <User size={16} />,
              onClick: () => {},
            },
            {
              label: 'Settings',
              icon: <Settings size={16} />,
              onClick: () => {},
            },
            {
              label: 'Logout',
              icon: <LogOut size={16} />,
              onClick: handleLogout,
              danger: true,
              disabled: isLoggingOut,
            },
          ]}
        />
      </div>
    </header>
  );
};
