import { create } from 'zustand';
import { UserRole } from '@/type/types';
import { authApi } from '@/api';

interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  token: string | null;
  login: (token: string, role?: UserRole) => void;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userRole: 'viewer',
  token: null,
  login: (token, role = 'admin') => {
    localStorage.setItem('auth_token', token);
    // Also set cookie for middleware
    document.cookie = `auth_token=${token}; path=/; max-age=86400`;
    set({ isAuthenticated: true, token, userRole: role });
  },
  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error(
        'Logout API call failed, but proceeding with client-side logout.',
        error,
      );
    } finally {
      localStorage.removeItem('auth_token');
      document.cookie = 'auth_token=; path=/; max-age=0';
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
