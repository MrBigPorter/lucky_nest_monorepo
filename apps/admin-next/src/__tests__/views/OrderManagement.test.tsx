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
  orderApi: {
    getList: vi.fn().mockResolvedValue({ list: [], total: 0 }),
    updateState: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    getOrderDetailById: vi.fn().mockResolvedValue(null),
  },
}));
vi.mock('@lucky/shared', () => ({
  ORDER_STATUS: { PENDING: 1, PAID: 2, CANCELLED: 3, REFUNDED: 4 },
  ORDER_STATUS_LABEL: {
    1: 'Pending',
    2: 'Paid',
    3: 'Cancelled',
    4: 'Refunded',
  },
}));
vi.mock('@/consts', () => ({ ORDER_STATUS_COLORS: {} }));
vi.mock('@/store/useToastStore', () => ({
  useToastStore: (
    sel: (s: { addToast: ReturnType<typeof vi.fn> }) => unknown,
  ) => sel({ addToast: vi.fn() }),
}));

import { OrderManagement } from '@/views/OrderManagement';

describe('OrderManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAntdTable.mockReturnValue(makeUseAntdTable([], 0));
    mockUseRequest.mockReturnValue(makeUseRequest(undefined));
  });

  it('renders without crashing', () => {
    expect(render(<OrderManagement />).container.firstChild).not.toBeNull();
  });

  it('renders page header with "Order Management"', () => {
    render(<OrderManagement />);
    expect(screen.getByText(/order management/i)).toBeInTheDocument();
  });

  it('renders the order table', () => {
    render(<OrderManagement />);
    expect(screen.getByTestId('base-table')).toBeInTheDocument();
  });

  it('shows loading state gracefully', () => {
    mockUseAntdTable.mockReturnValue(makeUseAntdTable([], 0, true));
    expect(render(<OrderManagement />).container.firstChild).not.toBeNull();
  });
});
