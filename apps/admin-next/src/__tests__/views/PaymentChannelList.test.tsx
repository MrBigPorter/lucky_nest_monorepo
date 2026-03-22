import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  repoUiMock,
  BaseTableMock,
  SchemaSearchFormMock,
  PageHeaderMock,
  makeUseAntdTable,
} from '../mocks/view-helpers';

const mockUseAntdTable = vi.hoisted(() => vi.fn());

// ── mocks ────────────────────────────────────────────────────────
vi.mock('@repo/ui', () => repoUiMock);
vi.mock('ahooks', () => ({
  useAntdTable: (...args: unknown[]) => mockUseAntdTable(...args),
}));
vi.mock('@/components/scaffold/BaseTable', () => ({
  BaseTable: BaseTableMock,
}));
vi.mock('@/components/scaffold/SchemaSearchForm', () => ({
  SchemaSearchForm: SchemaSearchFormMock,
}));
vi.mock('@/components/scaffold/PageHeader', () => ({
  PageHeader: PageHeaderMock,
}));
vi.mock('@/store/useToastStore', () => ({
  useToastStore: (
    sel: (s: { addToast: ReturnType<typeof vi.fn> }) => unknown,
  ) => sel({ addToast: vi.fn() }),
}));
vi.mock('@/api', () => ({
  paymentChannelApi: {
    getList: vi.fn().mockResolvedValue({ list: [], total: 0 }),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('@/views/payment-channel/PaymentChannelModal', () => ({
  PaymentChannelModal: () => <div data-testid="payment-channel-modal" />,
}));

// ── subject ──────────────────────────────────────────────────────
import { PaymentChannelList } from '@/components/payment/PaymentChannelListClient';

describe('PaymentChannelList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAntdTable.mockReturnValue(makeUseAntdTable([], 0));
  });

  it('renders without crashing', () => {
    expect(render(<PaymentChannelList />).container.firstChild).not.toBeNull();
  });

  it('renders BaseTable', () => {
    render(<PaymentChannelList />);
    expect(screen.getByTestId('base-table')).toBeInTheDocument();
  });

  it('renders page header', () => {
    render(<PaymentChannelList />);
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
  });
});
