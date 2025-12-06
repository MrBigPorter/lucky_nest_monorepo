import { create } from 'zustand';
import { Theme, Language } from '../type/types.ts';

interface AppState {
  theme: Theme;
  lang: Language;
  isSidebarCollapsed: boolean;
  toggleTheme: () => void;
  toggleLang: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  lang: 'en',
  isSidebarCollapsed: false,
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
      return { theme: newTheme };
    }),
  toggleLang: () =>
    set((state) => ({ lang: state.lang === 'en' ? 'zh' : 'en' })),
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
