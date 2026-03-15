import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

// ── 模拟 authApi (防止真实网络调用) ─────────────────────────────
vi.mock('@/api', () => ({
  authApi: {
    logout: vi.fn().mockResolvedValue(undefined),
  },
}));

// ── 导入被测模块 ─────────────────────────────────────────────────
import { useAuthStore } from '@/store/useAuthStore';

// 每个测试前重置 store 和 localStorage
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({
    isAuthenticated: false,
    userRole: 'viewer',
    token: null,
  });
});

describe('useAuthStore', () => {
  describe('checkAuth', () => {
    it('token 存在时应标记为已登录', () => {
      localStorage.setItem('auth_token', 'test-token-123');
      act(() => {
        useAuthStore.getState().checkAuth();
      });
      const { isAuthenticated, token, userRole } = useAuthStore.getState();
      expect(isAuthenticated).toBe(true);
      expect(token).toBe('test-token-123');
      expect(userRole).toBe('admin');
    });

    it('token 不存在时应标记为未登录', () => {
      act(() => {
        useAuthStore.getState().checkAuth();
      });
      const { isAuthenticated, token } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
      expect(token).toBeNull();
    });
  });

  describe('login', () => {
    it('应正确存储 token 并更新状态', () => {
      act(() => {
        useAuthStore.getState().login('my-jwt-token', 'admin');
      });
      const { isAuthenticated, token, userRole } = useAuthStore.getState();
      expect(isAuthenticated).toBe(true);
      expect(token).toBe('my-jwt-token');
      expect(userRole).toBe('admin');
      expect(localStorage.getItem('auth_token')).toBe('my-jwt-token');
    });

    it('不传 role 时默认为 admin', () => {
      act(() => {
        useAuthStore.getState().login('token-xyz');
      });
      expect(useAuthStore.getState().userRole).toBe('admin');
    });
  });

  describe('logout', () => {
    it('应清除 token 并重置状态', async () => {
      // 先模拟已登录
      localStorage.setItem('auth_token', 'existing-token');
      useAuthStore.setState({ isAuthenticated: true, token: 'existing-token' });

      // 模拟 window.location.href
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, href: '/' },
      });

      await act(async () => {
        await useAuthStore.getState().logout();
      });

      const { isAuthenticated, token } = useAuthStore.getState();
      expect(isAuthenticated).toBe(false);
      expect(token).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(window.location.href).toBe('/login');

      // 还原
      Object.defineProperty(window, 'location', { value: originalLocation });
    });
  });
});
