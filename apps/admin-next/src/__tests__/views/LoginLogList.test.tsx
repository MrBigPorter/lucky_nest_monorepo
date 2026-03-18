import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

const mockUseRequest = vi.hoisted(() => vi.fn());

vi.mock('ahooks', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));

vi.mock('@/components/scaffold/PageHeader', () => ({
  PageHeader: ({ title }: { title?: React.ReactNode }) => (
    <div data-testid="page-header">{title}</div>
  ),
}));

vi.mock('@/api', () => ({
  loginLogApi: {
    getList: vi.fn().mockResolvedValue({ list: [], total: 0 }),
  },
}));

import { loginLogApi } from '@/api';
import { LoginLogList } from '@/views/LoginLogList';

const createLoginLog = (overrides?: Record<string, unknown>) => ({
  id: 'log-1',
  userId: 'user_1234567890',
  userNickname: 'Alice',
  userAvatar: null,
  loginTime: Date.UTC(2026, 2, 17, 6, 30, 0),
  loginType: 1,
  loginMethod: 'password',
  loginIp: '127.0.0.1',
  loginDevice: 'Chrome on macOS',
  countryCode: 'PH',
  city: 'Cebu',
  loginStatus: 1,
  failReason: null,
  tokenIssued: 1,
  ...overrides,
});

const mockLoginLogRequest = ({
  list,
  total = list.length,
  loading = false,
}: {
  list: ReturnType<typeof createLoginLog>[];
  total?: number;
  loading?: boolean;
}) => {
  const refresh = vi.fn();
  mockUseRequest.mockImplementation((service: () => unknown) => {
    void service();

    return {
      data: { list, total },
      loading,
      run: refresh,
    };
  });

  return refresh;
};

describe('LoginLogList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when login logs are empty', () => {
    mockLoginLogRequest({ list: [] });

    render(<LoginLogList />);

    expect(screen.getByTestId('page-header')).toHaveTextContent('Login Logs');
    expect(screen.getByText('No login logs found')).toBeInTheDocument();
  });

  it('renders login log rows with key fields', () => {
    mockLoginLogRequest({ list: [createLoginLog()] });

    render(<LoginLogList />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    const row = screen.getByText('Alice').closest('tr');
    expect(row).not.toBeNull();

    expect(
      within(row as HTMLTableRowElement).getByText('127.0.0.1'),
    ).toBeInTheDocument();
    expect(
      within(row as HTMLTableRowElement).getByText('Success'),
    ).toBeInTheDocument();
    expect(
      within(row as HTMLTableRowElement).getByText('Chrome on macOS'),
    ).toBeInTheDocument();
  });

  it('applies filters and sends updated query params', async () => {
    mockLoginLogRequest({ list: [] });

    render(<LoginLogList />);

    fireEvent.change(screen.getByPlaceholderText('User ID…'), {
      target: { value: 'user_1001' },
    });
    fireEvent.change(screen.getByPlaceholderText('IP…'), {
      target: { value: '192.168.0.1' },
    });
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(loginLogApi.getList).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 20,
        userId: 'user_1001',
        loginIp: '192.168.0.1',
        loginStatus: 1,
      });
    });
  });

  it('triggers refresh action from toolbar', () => {
    const refresh = mockLoginLogRequest({ list: [createLoginLog()] });

    render(<LoginLogList />);

    const searchButton = screen.getByRole('button', { name: 'Search' });
    const toolbar = searchButton.parentElement;
    expect(toolbar).not.toBeNull();

    const refreshButton = within(toolbar as HTMLElement).getAllByRole(
      'button',
    )[1];

    fireEvent.click(refreshButton);

    expect(refresh).toHaveBeenCalled();
  });
});
