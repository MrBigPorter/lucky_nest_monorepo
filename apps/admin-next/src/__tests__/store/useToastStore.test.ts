import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useToastStore } from '@/store/useToastStore';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('useToastStore', () => {
  describe('addToast', () => {
    it('添加 success toast', () => {
      act(() => {
        useToastStore.getState().addToast('success', 'Saved!');
      });
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('Saved!');
      expect(toasts[0].id).toBeTruthy();
    });

    it('添加 error toast', () => {
      act(() => {
        useToastStore.getState().addToast('error', 'Something went wrong');
      });
      expect(useToastStore.getState().toasts[0].type).toBe('error');
    });

    it('连续添加多个 toast 都保留', () => {
      act(() => {
        useToastStore.getState().addToast('success', 'First');
        useToastStore.getState().addToast('error', 'Second');
        useToastStore.getState().addToast('info', 'Third');
      });
      expect(useToastStore.getState().toasts).toHaveLength(3);
    });

    it('每个 toast 有唯一 id', () => {
      // Date.now() 在同一毫秒可能返回相同值，强制递增
      let time = 100000;
      const spy = vi.spyOn(Date, 'now').mockImplementation(() => time++);
      act(() => {
        useToastStore.getState().addToast('info', 'A');
        useToastStore.getState().addToast('info', 'B');
      });
      spy.mockRestore();
      const { toasts } = useToastStore.getState();
      const ids = toasts.map((t) => t.id);
      expect(new Set(ids).size).toBe(2);
    });
  });

  describe('removeToast', () => {
    it('按 id 移除指定 toast', () => {
      act(() => {
        useToastStore.getState().addToast('info', 'Removable');
      });
      const id = useToastStore.getState().toasts[0].id;

      act(() => {
        useToastStore.getState().removeToast(id);
      });
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('移除时不影响其他 toast', () => {
      let time = 200000;
      const spy = vi.spyOn(Date, 'now').mockImplementation(() => time++);
      act(() => {
        useToastStore.getState().addToast('info', 'Keep me');
        useToastStore.getState().addToast('error', 'Remove me');
      });
      spy.mockRestore();
      const toasts = useToastStore.getState().toasts;
      const removeId = toasts[1].id;

      act(() => {
        useToastStore.getState().removeToast(removeId);
      });
      const remaining = useToastStore.getState().toasts;
      expect(remaining).toHaveLength(1);
      expect(remaining[0].message).toBe('Keep me');
    });

    it('移除不存在的 id 不报错', () => {
      act(() => {
        useToastStore.getState().addToast('info', 'Existing');
      });
      expect(() => {
        act(() => {
          useToastStore.getState().removeToast('non-existent-id');
        });
      }).not.toThrow();
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });
});
