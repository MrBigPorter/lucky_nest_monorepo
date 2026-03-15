import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { makeUseRequest, SmartImageMock } from '../mocks/view-helpers';

// ── hoisted mock variables ────────────────────────────────────────
const mockRouterPush = vi.hoisted(() => vi.fn());
const mockUseRequest = vi.hoisted(() => vi.fn());

// ── mocks ────────────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));
vi.mock('@/components/ui/SmartImage', () => ({ SmartImage: SmartImageMock }));
vi.mock('ahooks', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));
vi.mock('@/api', () => ({
  financeApi: { getStatistics: vi.fn() },
  orderApi: { getList: vi.fn() },
  clientUserApi: { getUsers: vi.fn() },
}));

// ── subject ──────────────────────────────────────────────────────
import { Dashboard } from '@/views/Dashboard';

const FINANCE_MOCK = {
  totalDeposit: '12500.00',
  totalWithdraw: '3200.00',
  pendingWithdraw: '500.00',
  depositTrend: '5.2',
  withdrawTrend: '-1.3',
};
const ORDER_MOCK = {
  list: [
    {
      orderId: '1',
      orderNo: 'ON20240101ABC12345',
      orderStatus: 2,
      finalAmount: 199,
      createdAt: 1700000000,
      treasure: { treasureName: 'Gold Box', treasureCoverImg: '/img.jpg' },
      user: { nickname: 'Alice' },
    },
  ],
  total: 1,
};
const USER_MOCK = { list: [], total: 42 };

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: finance → orders → users (consumed in render order)
    mockUseRequest
      .mockReturnValueOnce(makeUseRequest(FINANCE_MOCK))
      .mockReturnValueOnce(makeUseRequest(ORDER_MOCK))
      .mockReturnValueOnce(makeUseRequest(USER_MOCK));
  });

  it('renders the Dashboard heading', () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders all 4 stat cards when finance data is loaded', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Deposits')).toBeInTheDocument();
    expect(screen.getByText('Total Withdrawals')).toBeInTheDocument();
    expect(screen.getByText('Pending Withdrawals')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('displays finance numbers from API', () => {
    render(<Dashboard />);
    expect(screen.getByText(/12,500/)).toBeInTheDocument();
  });

  it('renders the Recent Orders section heading', () => {
    render(<Dashboard />);
    expect(screen.getByText('Recent Orders')).toBeInTheDocument();
  });

  it('shows order row with product name', () => {
    render(<Dashboard />);
    expect(screen.getByText('Gold Box')).toBeInTheDocument();
  });

  it('shows user nickname in order row', () => {
    render(<Dashboard />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows loading skeleton when all requests are loading', () => {
    // Reset then set loading state — prevents beforeEach queue from interfering
    mockUseRequest.mockReset();
    mockUseRequest
      .mockReturnValueOnce(makeUseRequest(undefined, true))
      .mockReturnValueOnce(makeUseRequest(undefined, true))
      .mockReturnValueOnce(makeUseRequest(undefined, true));
    const { container } = render(<Dashboard />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    );
  });

  it('shows empty orders message when list is empty', () => {
    // Reset then override orders to empty — prevents beforeEach ORDER_MOCK from interfering
    mockUseRequest.mockReset();
    mockUseRequest
      .mockReturnValueOnce(makeUseRequest(FINANCE_MOCK))
      .mockReturnValueOnce(makeUseRequest({ list: [], total: 0 }))
      .mockReturnValueOnce(makeUseRequest(USER_MOCK));
    render(<Dashboard />);
    expect(screen.getByText(/no orders yet/i)).toBeInTheDocument();
  });

  it('clicking View all navigates to /orders', () => {
    render(<Dashboard />);
    screen.getByText(/view all/i).click();
    expect(mockRouterPush).toHaveBeenCalledWith('/orders');
  });
});
