
import React, { createContext, useState, useEffect, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UserManagement } from './pages/UserManagement';
import { ProductManagement, CategoryManagement } from './pages/ProductManagement';
import { GroupManagement } from './pages/GroupManagement';
import { OrderManagement } from './pages/OrderManagement';
import { Marketing } from './pages/Marketing';
import { Finance } from './pages/Finance';
import { SystemSettings } from './pages/SystemSettings';
import { LotteryControl } from './pages/LotteryControl';
import { VipConfig } from './pages/VipConfig';
import { NotificationCenter } from './pages/NotificationCenter';
import { ActivityConfig } from './pages/ActivityConfig';
import { AdminSecurity } from './pages/AdminSecurity';
import { ContentCMS } from './pages/ContentCMS';
import { DataAnalytics } from './pages/DataAnalytics';
import { ServiceCenter } from './pages/ServiceCenter';
import { Theme, Language, UserRole } from './types';
import { ToastContainer, ToastMessage } from './components/UIComponents';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  lang: Language;
  toggleLang: () => void;
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (token: string) => void;
  logout: () => void;
}

export const AppContext = createContext<AppContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  lang: 'en',
  toggleLang: () => {},
  isAuthenticated: false,
  userRole: 'viewer',
  login: () => {},
  logout: () => {},
});

// Toast Context
interface ToastContextType {
    addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}
export const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

// Custom Hook to use toast easily
export const useToast = () => useContext(ToastContext);

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [lang, setLang] = useState<Language>('en');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  
  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  const toggleLang = () => setLang(prev => (prev === 'en' ? 'zh' : 'en'));
  
  const login = (token: string) => {
      setIsAuthenticated(true);
      setUserRole('admin'); 
      localStorage.setItem('auth_token', token);
      addToast('success', 'Welcome back, Admin!');
  };

  const logout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('auth_token');
      addToast('info', 'Logged out successfully');
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, lang, toggleLang, isAuthenticated, userRole, login, logout }}>
      <ToastContext.Provider value={{ addToast }}>
        <Router>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <Layout>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/products" element={<ProductManagement />} />
                <Route path="/categories" element={<CategoryManagement />} />
                <Route path="/groups" element={<GroupManagement />} />
                <Route path="/orders" element={<OrderManagement />} />
                <Route path="/marketing" element={<Marketing />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/system" element={<SystemSettings />} />
                <Route path="/lottery" element={<LotteryControl />} />
                <Route path="/vip" element={<VipConfig />} />
                <Route path="/notifications" element={<NotificationCenter />} />
                <Route path="/activity" element={<ActivityConfig />} />
                <Route path="/admin-security" element={<AdminSecurity />} />
                <Route path="/content" element={<ContentCMS />} />
                <Route path="/analytics" element={<DataAnalytics />} />
                <Route path="/service" element={<ServiceCenter />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Layout>
        </Router>
      </ToastContext.Provider>
    </AppContext.Provider>
  );
};

export default App;
