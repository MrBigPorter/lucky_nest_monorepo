import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  repoUiMock,
  repoUiBadgeMock,
  SmartTableMock,
  PageHeaderMock,
} from '../mocks/view-helpers';

// ── mocks ────────────────────────────────────────────────────────
vi.mock('@repo/ui', () => ({
  ...repoUiMock,
  DropdownMenu: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <div role="menuitem" onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuLabel: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));
vi.mock('@repo/ui/components/ui/badge', () => repoUiBadgeMock);
vi.mock('@/components/scaffold/SmartTable', () => ({
  SmartTable: SmartTableMock,
}));
vi.mock('@/components/scaffold/PageHeader', () => ({
  PageHeader: PageHeaderMock,
}));

const mockAddToast = vi.fn();
vi.mock('@/store/useToastStore', () => ({
  useToastStore: (sel: (s: { addToast: typeof mockAddToast }) => unknown) =>
    sel({ addToast: mockAddToast }),
}));

vi.mock('@/api', () => ({
  kycApi: {
    getRecords: vi.fn().mockResolvedValue({ list: [], total: 0 }),
    audit: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({}),
    updateInfo: vi.fn().mockResolvedValue({}),
    revoke: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@lucky/shared', () => ({
  KYC_STATUS: { DRAFT: 0, REVIEWING: 1, APPROVED: 2, REJECTED: 3 },
  KycIdCardType: { PASSPORT: 'PASSPORT', NATIONAL_ID: 'NATIONAL_ID' },
  KycIdCardTypeLabel: { PASSPORT: 'Passport', NATIONAL_ID: 'National ID' },
}));

vi.mock('@/views/kyc/KycAuditModal', () => ({
  KycAuditModal: () => <div data-testid="kyc-audit-modal" />,
}));
vi.mock('@/views/kyc/KycFormModal', () => ({
  KycFormModal: () => <div data-testid="kyc-form-modal" />,
}));

// ── subject ──────────────────────────────────────────────────────
import { KycList } from '@/components/kyc/KycListClient';

describe('KycList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders without crashing', () => {
    const { container } = render(<KycList />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders SmartTable', () => {
    render(<KycList />);
    expect(screen.getByTestId('smart-table')).toBeInTheDocument();
  });

  it('renders page header', () => {
    render(<KycList />);
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
  });
});
