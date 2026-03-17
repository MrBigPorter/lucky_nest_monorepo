import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Theme, Language } from '../type/types';

interface AppState {
  theme: Theme;
  lang: Language;
  isSidebarCollapsed: boolean;
  toggleTheme: () => void;
  toggleLang: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      lang: 'en',
      isSidebarCollapsed: false,
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('dark', 'light');
            document.documentElement.classList.add(newTheme);
          }
          return { theme: newTheme };
        }),
      toggleLang: () =>
        set((state) => ({ lang: state.lang === 'en' ? 'zh' : 'en' })),
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    }),
    {
      name: 'app-store', // localStorage key
      storage: createJSONStorage(() => {
        // SSR 安全：服务端没有 localStorage，返回空实现
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // 持久化 theme、lang 和 isSidebarCollapsed
      partialize: (state) => ({
        theme: state.theme,
        lang: state.lang,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    },
  ),
);
