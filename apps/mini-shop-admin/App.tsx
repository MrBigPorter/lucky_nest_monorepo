import React, { createContext, useState, useEffect, useContext } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
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

interface ToastContextType {
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}
export const ToastContext = createContext<ToastContextType>({
  addToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [lang, setLang] = useState<Language>('en');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check for token on initial load
    return !!localStorage.getItem('auth_token');
  });
  const [userRole, setUserRole] = useState<UserRole>('viewer');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const toggleLang = () => setLang((prev) => (prev === 'en' ? 'zh' : 'en'));

  const login = (token: string) => {
    localStorage.setItem('auth_token', token);
    setIsAuthenticated(true);
    setUserRole('admin');
    addToast('success', 'Welcome back, Admin!');
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    addToast('info', 'Logged out successfully');
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        lang,
        toggleLang,
        isAuthenticated,
        userRole,
        login,
        logout,
      }}
    >
      <ToastContext.Provider value={{ addToast }}>
        <Router>
          <ToastContainer toasts={toasts} removeToast={removeToast} />
          <AppRoutes />
        </Router>
      </ToastContext.Provider>
    </AppContext.Provider>
  );
};

export default App;
