import React, { useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AppRoutes } from './AppRoutes.tsx';
import { ToastContainer } from './components/UIComponents.tsx';
import { useAuthStore } from './store/useAuthStore.ts';
import { useAppStore } from './store/useAppStore.ts';
import { useToastStore } from './store/useToastStore.ts';

const App: React.FC = () => {
  // Initialize stores
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const theme = useAppStore((state) => state.theme);
  const { toasts, removeToast } = useToastStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <Router>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <AppRoutes />
    </Router>
  );
};

export default App;
