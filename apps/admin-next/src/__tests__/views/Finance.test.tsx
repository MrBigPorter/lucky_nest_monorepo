import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/views/finance/TransactionList', () => ({
  TransactionList: () => <div data-testid="transaction-list">Transactions</div>,
}));
vi.mock('@/views/finance/WithdrawalList', () => ({
  WithdrawalList: () => <div data-testid="withdrawal-list">Withdrawals</div>,
}));
vi.mock('@/views/finance/DepositList', () => ({
  DepositList: () => <div data-testid="deposit-list">Deposits</div>,
}));

import { FinancePage } from '@/components/finance/FinancePageClient';

describe('Finance (FinancePage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(render(<FinancePage />).container.firstChild).not.toBeNull();
  });

  it('shows Transactions tab by default', () => {
    render(<FinancePage />);
    expect(screen.getByTestId('transaction-list')).toBeInTheDocument();
  });

  it('renders tab navigation buttons', () => {
    render(<FinancePage />);
    expect(
      screen.getByRole('button', { name: /transactions flow/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /deposit records/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /withdrawal audits/i }),
    ).toBeInTheDocument();
  });

  it('switches to Deposits tab when clicked', () => {
    render(<FinancePage />);
    fireEvent.click(screen.getByRole('button', { name: /deposit records/i }));
    expect(screen.getByTestId('deposit-list')).toBeInTheDocument();
  });

  it('switches to Withdrawals tab when clicked', () => {
    render(<FinancePage />);
    fireEvent.click(screen.getByRole('button', { name: /withdrawal audits/i }));
    expect(screen.getByTestId('withdrawal-list')).toBeInTheDocument();
  });
});
