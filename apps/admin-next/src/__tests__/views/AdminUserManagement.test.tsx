import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  repoUiMock,
  makeUseAntdTable,
  makeUseRequest,
  BaseTableMock,
  SchemaSearchFormMock,
  PageHeaderMock,
} from '../mocks/view-helpers';

const mockUseAntdTable = vi.hoisted(() => vi.fn());
const mockUseRequest = vi.hoisted(() => vi.fn());

vi.mock('@repo/ui', () => repoUiMock);
vi.mock('@/components/scaffold/BaseTable', () => ({
  BaseTable: BaseTableMock,
}));
vi.mock('@/components/scaffold/SchemaSearchForm', () => ({
  SchemaSearchForm: SchemaSearchFormMock,
}));
vi.mock('@/components/scaffold/PageHeader', () => ({
  PageHeader: PageHeaderMock,
}));
vi.mock('ahooks', () => ({
  useAntdTable: (...args: unknown[]) => mockUseAntdTable(...args),
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));
vi.mock('@/api', () => ({
  userApi: {
    getUsers: vi.fn().mockResolvedValue({ list: [], total: 0 }),
    createUser: vi.fn().mockResolvedValue({}),
    updateUser: vi.fn().mockResolvedValue({}),
    deleteUser: vi.fn().mockResolvedValue({}),
  },
  applicationApi: {
    pendingCount: vi.fn().mockResolvedValue({ count: 0 }),
  },
}));
vi.mock('@/views/admin/CreateAdminUserModal', () => ({
  CreateAdminUserModal: () => <div data-testid="create-admin-modal" />,
}));
vi.mock('@/views/admin/EditAdminUserModal', () => ({
  EditAdminUserModal: () => <div data-testid="edit-admin-modal" />,
}));
vi.mock('@/views/admin/EditAdminPassowordModal', () => ({
  EditAdminPasswordModal: () => <div data-testid="edit-password-modal" />,
}));
vi.mock('@/store/useToastStore', () => ({
  useToastStore: (
    sel: (s: { addToast: ReturnType<typeof vi.fn> }) => unknown,
  ) => sel({ addToast: vi.fn() }),
}));

import { AdminUserManagement } from '@/components/admin-users/AdminUserManagementClient';

describe('AdminUserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAntdTable.mockReturnValue(makeUseAntdTable([], 0));
    mockUseRequest.mockReturnValue(makeUseRequest(undefined));
  });

  it('renders without crashing', () => {
    expect(render(<AdminUserManagement />).container.firstChild).not.toBeNull();
  });

  it('renders "Admin Users" page header', () => {
    render(<AdminUserManagement />);
    expect(screen.getByTestId('page-header')).toHaveTextContent(/admin users/i);
  });

  it('renders the admin users table', () => {
    render(<AdminUserManagement />);
    expect(screen.getByTestId('base-table')).toBeInTheDocument();
  });

  it('shows loading state gracefully', () => {
    mockUseAntdTable.mockReturnValue(makeUseAntdTable([], 0, true));
    expect(render(<AdminUserManagement />).container.firstChild).not.toBeNull();
  });
});
