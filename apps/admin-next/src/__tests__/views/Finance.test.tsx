import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { makeUseRequest } from '../mocks/view-helpers';

const mockUseRequest = vi.hoisted(() => vi.fn());

vi.mock('ahooks', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));
vi.mock('@/api', () => ({
  financeApi: { getStatistics: vi.fn().mockResolvedValue({}) },
}));
vi.mock('@lucky/shared', () => ({
  NumHelper: { formatMoney: (v: number) => `₱${v}` },
}));
vi.mock('@/views/finance/TransactionList', () => ({
  TransactionList: () => <div data-testid="transaction-list">Transactions</div>,
}));
vi.mock('@/views/finance/WithdrawalList', () => ({
  WithdrawalList: () => <div data-testid="withdrawal-list">Withdrawals</div>,
}));
vi.mock('@/views/finance/DepositList', () => ({
  DepositList: () => <div data-testid="deposit-list">Deposits</div>,
}));

const STATS_MOCK = {
  totalDeposit: '100000.00',
  totalWithdraw: '30000.00',
  pendingWithdraw: '5000.00',
  depositTrend: '3.5',
  withdrawTrend: '-1.2',
};

import { FinancePage } from '@/views/FinancePage';

describe('Finance (FinancePage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRequest.mockReturnValue(makeUseRequest(STATS_MOCK));
  });

  it('renders without crashing', () => {
    expect(render(<FinancePage />).container.firstChild).not.toBeNull();
  });

  it('renders the "Finance Center" heading', () => {
    render(<FinancePage />);
    expect(screen.getByText(/finance center/i)).toBeInTheDocument();
  });

  it('renders Total Deposits stat', () => {
    render(<FinancePage />);
    expect(screen.getByText(/total deposits/i)).toBeInTheDocument();
  });

  it('renders Pending Withdrawals stat', () => {
    render(<FinancePage />);
    // The text appears in multiple places (sidebar + card), so use getAllByText
    expect(screen.getAllByText(/pending withdrawals/i).length).toBeGreaterThan(
      0,
    );
  });

  it('shows Transactions tab by default', () => {
    render(<FinancePage />);
    expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
  });

  it('shows loading skeleton when stats are loading', () => {
    mockUseRequest.mockReturnValue(makeUseRequest(undefined, true));
    const { container } = render(<FinancePage />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    );
  });

  it('switches to Deposits tab when clicked', () => {
    render(<FinancePage />);
    fireEvent.click(screen.getByRole('button', { name: /deposit/i }));
    expect(screen.getByTestId('deposit-list')).toBeInTheDocument();
  });

  it('switches to Withdrawals tab when clicked', () => {
    render(<FinancePage />);
    fireEvent.click(screen.getByRole('button', { name: /withdraw/i }));
    expect(screen.getByTestId('withdrawal-list')).toBeInTheDocument();
  });
});
