import { create } from 'zustand';
import { UserRole } from '../types';
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
      set({ isAuthenticated: false, token: null, userRole: 'viewer' });
    }
  },
  checkAuth: () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      set({ isAuthenticated: true, token, userRole: 'admin' }); // Default role on re-auth
    } else {
      set({ isAuthenticated: false, token: null, userRole: 'viewer' });
    }
  },
}));
