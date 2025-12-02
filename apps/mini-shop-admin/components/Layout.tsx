
import React, { useContext } from 'react';
import { NavLink, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, Ticket, CreditCard,
  Settings, LogOut, Moon, Sun, Menu, Sparkles, Users, Package,
  Zap, Bell, Crown, Gift, Shield, FileText, PieChart, Headphones, User, ChevronDown, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext, useToast } from '../App';
import { TRANSLATIONS } from '../constants';
import { Dropdown, Breadcrumbs } from './UIComponents';

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick?: () => void }> = ({ to, icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
      ${isActive
        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 translate-x-1'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
    `}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme, lang, toggleLang, isAuthenticated, logout } = useContext(AppContext);
  const toast = useToast();
  const t = TRANSLATIONS[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  if (location.pathname === '/login') {
      return <>{children}</>;
  }

  if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
      logout();
  };

  const getPageInfo = () => {
    switch (location.pathname) {
      case '/': return { title: t.dashboard, path: ['Overview', 'Dashboard'] };
      case '/users': return { title: t.users, path: ['Management', 'Users'] };
      case '/products': return { title: t.products, path: ['Management', 'Products'] };
      case '/groups': return { title: t.groups, path: ['Management', 'Groups'] };
      case '/orders': return { title: t.orders, path: ['Management', 'Orders'] };
      case '/marketing': return { title: t.marketing, path: ['Operations', 'Marketing'] };
      case '/finance': return { title: t.finance, path: ['System', 'Finance'] };
      case '/system': return { title: t.system, path: ['System', 'Settings'] };
      case '/lottery': return { title: t.lottery, path: ['Operations', 'Lottery'] };
      case '/vip': return { title: t.vip, path: ['Operations', 'VIP'] };
      case '/notifications': return { title: t.notifications, path: ['Operations', 'Notifications'] };
      case '/activity': return { title: t.activity, path: ['Operations', 'Activity'] };
      case '/admin-security': return { title: t.admin_security, path: ['System', 'Security'] };
      case '/content': return { title: t.content_cms, path: ['System', 'Content'] };
      case '/analytics': return { title: t.analytics, path: ['Operations', 'Analytics'] };
      case '/service': return { title: t.service, path: ['Management', 'Service'] };
      default: return { title: 'LuxeAdmin', path: [] };
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Sidebar */}
      <aside 
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-dark-900 border-r border-gray-100 dark:border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center gap-3 px-4 py-6 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-500/20">
              L
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              LuxeAdmin
            </h1>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Overview</div>
            <SidebarItem to="/" icon={<LayoutDashboard size={18} />} label={t.dashboard} onClick={() => setMobileMenuOpen(false)} />
            
            <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">Management</div>
            <SidebarItem to="/users" icon={<Users size={18} />} label={t.users} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/products" icon={<ShoppingBag size={18} />} label={t.products} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/groups" icon={<Users size={18} />} label={t.groups} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/orders" icon={<Package size={18} />} label={t.orders} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/service" icon={<Headphones size={18} />} label={t.service} onClick={() => setMobileMenuOpen(false)} />
            
            <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">Operations</div>
            <SidebarItem to="/analytics" icon={<PieChart size={18} />} label={t.analytics} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/lottery" icon={<Zap size={18} />} label={t.lottery} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/activity" icon={<Gift size={18} />} label={t.activity} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/vip" icon={<Crown size={18} />} label={t.vip} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/notifications" icon={<Bell size={18} />} label={t.notifications} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/marketing" icon={<Ticket size={18} />} label={t.marketing} onClick={() => setMobileMenuOpen(false)} />
            
            <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">System</div>
            <SidebarItem to="/finance" icon={<CreditCard size={18} />} label={t.finance} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/admin-security" icon={<Shield size={18} />} label={t.admin_security} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/content" icon={<FileText size={18} />} label={t.content_cms} onClick={() => setMobileMenuOpen(false)} />
            <SidebarItem to="/system" icon={<Settings size={18} />} label={t.system} onClick={() => setMobileMenuOpen(false)} />
          </nav>

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/5 space-y-1">
             {/* Mobile Logout */}
             <button onClick={handleLogout} className="lg:hidden w-full flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
               <LogOut size={18} />
               <span className="text-sm font-medium">{t.logout}</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:ml-64 relative bg-gray-50 dark:bg-dark-950">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 transition-colors duration-300">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-gray-500">
              <Menu size={24} />
            </button>
            <div className="hidden sm:block">
                <Breadcrumbs items={pageInfo.path} />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white leading-tight">{pageInfo.title}</h2>
            </div>
            
            {/* Global Search Bar */}
            <div className="hidden md:flex items-center ml-8 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-transparent focus-within:border-primary-500/50 focus-within:bg-white dark:focus-within:bg-black/20 transition-all w-64 lg:w-96 group">
                <Search size={16} className="text-gray-400 mr-2 group-focus-within:text-primary-500" />
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
               onClick={() => toast.addToast('info', "AI Assistant: I can help analyze your sales data or generate marketing copy.")}
             >
               <Sparkles size={16} />
               <span>AI Assist</span>
             </motion.button>

            <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

            <button onClick={toggleLang} className="p-2 text-gray-500 hover:text-primary-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
              <span className="font-bold text-xs">{lang === 'en' ? 'EN' : '中'}</span>
            </button>
            <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-amber-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            
            {/* User Dropdown */}
            <Dropdown 
                trigger={
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden border border-gray-200 dark:border-white/10 ring-2 ring-transparent hover:ring-primary-500/30 transition-all">
                            <img src="https://picsum.photos/32/32" alt="User" className="w-full h-full object-cover" />
                        </div>
                        <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
                    </div>
                }
                items={[
                    { label: 'My Profile', icon: <User size={16} />, onClick: () => {} },
                    { label: 'Settings', icon: <Settings size={16} />, onClick: () => {} },
                    { label: 'Logout', icon: <LogOut size={16} />, onClick: handleLogout, danger: true }
                ]}
            />
          </div>
        </header>

        {/* Page Scroll Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
