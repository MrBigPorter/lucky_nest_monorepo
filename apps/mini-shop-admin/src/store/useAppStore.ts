import { create } from 'zustand';
import { Theme, Language } from '../types';

interface AppState {
  theme: Theme;
  lang: Language;
  toggleTheme: () => void;
  toggleLang: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  lang: 'en',
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
      return { theme: newTheme };
    }),
  toggleLang: () =>
    set((state) => ({ lang: state.lang === 'en' ? 'zh' : 'en' })),
}));
