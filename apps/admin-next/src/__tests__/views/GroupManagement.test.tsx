import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  repoUiMock,
  SmartTableMock,
  PageHeaderMock,
  SmartImageMock,
} from '../mocks/view-helpers';

// ── mocks ────────────────────────────────────────────────────────
vi.mock('@repo/ui', () => repoUiMock);
vi.mock('@/components/scaffold/SmartTable', () => ({
  SmartTable: SmartTableMock,
}));
vi.mock('@/components/scaffold/PageHeader', () => ({
  PageHeader: PageHeaderMock,
}));
vi.mock('@/components/ui/SmartImage', () => ({ SmartImage: SmartImageMock }));

const mockUseRequest = vi.fn();
vi.mock('ahooks', () => ({
  useRequest: (fn: () => unknown, opts?: unknown) => mockUseRequest(fn, opts),
}));

vi.mock('@/api', () => ({
  groupApi: {
    getList: vi.fn().mockResolvedValue({ list: [], total: 0 }),
    getDetail: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@lucky/shared', () => ({
  GROUP_STATUS: { OPEN: 1, FULL: 2, EXPIRED: 3, CANCELLED: 4 },
}));

const mockAddToast = vi.fn();
vi.mock('@/store/useToastStore', () => ({
  useToastStore: (sel: (s: { addToast: typeof mockAddToast }) => unknown) =>
    sel({ addToast: mockAddToast }),
}));

// ── subject ──────────────────────────────────────────────────────
import { GroupManagement } from '@/views/GroupManagement';

describe('GroupManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRequest.mockReturnValue({
      data: undefined,
      loading: false,
      run: vi.fn(),
      refresh: vi.fn(),
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<GroupManagement />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders SmartTable', () => {
    render(<GroupManagement />);
    expect(screen.getByTestId('smart-table')).toBeInTheDocument();
  });
});
