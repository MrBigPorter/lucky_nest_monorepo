'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ToastContainer } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';

/**
 * 客户端全局 Provider
 * - 应用主题（dark/light）
 * - Toast 容器
 * Note: auth check is done per-page (DashboardLayout / Login)
 */
export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = useAppStore((s) => s.theme);
  const { toasts, removeToast } = useToastStore();

  // 应用主题
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {children}
    </>
  );
};
