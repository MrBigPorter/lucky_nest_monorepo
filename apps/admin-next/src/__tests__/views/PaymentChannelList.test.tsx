import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  repoUiMock,
  SmartTableMock,
  PageHeaderMock,
} from '../mocks/view-helpers';

// ── mocks ────────────────────────────────────────────────────────
vi.mock('@repo/ui', () => repoUiMock);
vi.mock('@/components/scaffold/SmartTable', () => ({
  SmartTable: SmartTableMock,
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
import { PaymentChannelList } from '@/views/PaymentChannelList';

describe('PaymentChannelList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders without crashing', () => {
    expect(render(<PaymentChannelList />).container.firstChild).not.toBeNull();
  });

  it('renders SmartTable', () => {
    render(<PaymentChannelList />);
    expect(screen.getByTestId('smart-table')).toBeInTheDocument();
  });

  it('renders page header', () => {
    render(<PaymentChannelList />);
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
  });
});
