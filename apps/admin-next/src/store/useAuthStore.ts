import { create } from 'zustand';
import { UserRole, AdminUser } from '@/type/types';
import { authApi } from '@/api';

interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  token: string | null;
  refreshToken: string | null;
  userInfo: AdminUser | null;
  login: (
    token: string,
    role?: UserRole,
    userInfo?: AdminUser,
    refreshToken?: string | null,
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  setTokens: (token: string, refreshToken?: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userRole: 'viewer',
  token: null,
  refreshToken: null,
  userInfo: null,

  login: async (token, role = 'admin', userInfo, refreshToken = null) => {
    localStorage.setItem('auth_token', token);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    } else {
      localStorage.removeItem('refresh_token');
    }
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
      refreshToken,
      userRole: role,
      userInfo: userInfo ?? null,
    });
  },

  setTokens: (token, refreshToken = null) => {
    localStorage.setItem('auth_token', token);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    set((state) => ({
      token,
      refreshToken: refreshToken ?? state.refreshToken,
      isAuthenticated: true,
    }));
  },

  logout: async () => {
    try {
      await Promise.allSettled([authApi.logout(), authApi.clearCookie()]);
    } catch (error) {
      console.error('[useAuthStore] logout API failed', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      set({
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        userRole: 'viewer',
        userInfo: null,
      });
      window.location.href = '/login';
    }
  },

  checkAuth: () => {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (token) {
      set({
        isAuthenticated: true,
        token,
        refreshToken,
        userRole: 'admin',
      });
    } else {
      set({
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        userRole: 'viewer',
      });
    }
  },
}));
