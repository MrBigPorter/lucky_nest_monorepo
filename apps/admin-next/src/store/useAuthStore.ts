import { create } from 'zustand';
import { UserRole } from '@/type/types';
import { authApi } from '@/api';

interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  token: string | null;
  login: (token: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userRole: 'viewer',
  token: null,

  login: async (token, role = 'admin') => {
    // 1. localStorage — 向下兼容（api/http.ts 读 token 发请求）
    localStorage.setItem('auth_token', token);

    // 2. 请求后端设置 HTTP-only Cookie（JS 不可读，防 XSS）
    try {
      await authApi.setCookie(token);
    } catch (e) {
      // set-cookie 失败不阻断登录，middleware 降级到 localStorage 模式
      console.warn('[useAuthStore] set-cookie failed, fallback to localStorage only', e);
    }

    set({ isAuthenticated: true, token, userRole: role });
  },

  logout: async () => {
    try {
      // 同时调用：后端登出日志 + 清除 HTTP-only Cookie
      await Promise.allSettled([
        authApi.logout(),
        authApi.clearCookie(),
      ]);
    } catch (error) {
      console.error('[useAuthStore] logout API failed', error);
    } finally {
      localStorage.removeItem('auth_token');
      set({ isAuthenticated: false, token: null, userRole: 'viewer' });
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
