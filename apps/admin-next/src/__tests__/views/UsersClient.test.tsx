import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { repoUiMock } from '../mocks/view-helpers';

const smartTablePropsSpy = vi.hoisted(() => vi.fn());
const mockReplace = vi.hoisted(() => vi.fn());

vi.mock('@repo/ui', () => repoUiMock);
vi.mock('@/components/scaffold/SmartTable', () => ({
  SmartTable: Object.assign(
    React.forwardRef(function SmartTableMock(
      props: { headerTitle?: React.ReactNode },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _ref: React.ForwardedRef<unknown>,
    ) {
      smartTablePropsSpy(props);
      return <div data-testid="smart-table">{props.headerTitle}</div>;
    }),
    { displayName: 'SmartTableMock' },
  ),
}));
vi.mock('@/components/UIComponents', () => ({
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('next/image', () => ({
  default: () => <div data-testid="next-image" />,
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams('userId=u-1&status=1'),
}));
vi.mock('@/store/useToastStore', () => ({
  useToastStore: (
    sel: (s: { addToast: (t: string, m: string) => void }) => unknown,
  ) => sel({ addToast: vi.fn() }),
}));
vi.mock('@/api', () => ({
  clientUserApi: {
    getUsers: vi.fn().mockResolvedValue({ list: [], total: 0 }),
    updateUser: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('@/views/user-management/UserDetailModal', () => ({
  UserDetailModal: () => <div data-testid="user-detail-modal" />,
}));

import { UsersClient } from '@/components/users/UsersClient';

describe('UsersClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<UsersClient />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders SmartTable', () => {
    render(<UsersClient />);
    expect(screen.getByTestId('smart-table')).toBeInTheDocument();
  });

  it('passes hydration props and URL params to SmartTable', () => {
    render(<UsersClient />);

    expect(smartTablePropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        initialFormParams: { userId: 'u-1', status: '1' },
        enableHydration: true,
        hydrationQueryKey: ['users', 1, 10, 'u-1', '', 1, 'all', '', ''],
      }),
    );
  });
});
