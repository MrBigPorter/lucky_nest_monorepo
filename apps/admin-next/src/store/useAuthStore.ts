import { create } from 'zustand';
import { UserRole, AdminUser } from '@/type/types';
import { authApi } from '@/api';

interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  token: string | null;
  userInfo: AdminUser | null;
  login: (
    token: string,
    role?: UserRole,
    userInfo?: AdminUser,
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userRole: 'viewer',
  token: null,
  userInfo: null,

  login: async (token, role = 'admin', userInfo) => {
    localStorage.setItem('auth_token', token);
    try {
      await authApi.setCookie(token);
    } catch (e) {
      console.warn(
        '[useAuthStore] set-cookie failed, fallback to localStorage only',
        e,
      );
    }
    set({
      isAuthenticated: true,
      token,
      userRole: role,
      userInfo: userInfo ?? null,
    });
  },

  logout: async () => {
    try {
      await Promise.allSettled([authApi.logout(), authApi.clearCookie()]);
    } catch (error) {
      console.error('[useAuthStore] logout API failed', error);
    } finally {
      localStorage.removeItem('auth_token');
      set({
        isAuthenticated: false,
        token: null,
        userRole: 'viewer',
        userInfo: null,
      });
      window.location.href = '/login';
    }
  },

  checkAuth: () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      set({ isAuthenticated: true, token, userRole: 'admin' });
    } else {
      set({ isAuthenticated: false, token: null, userRole: 'viewer' });
    }
  },
}));
