import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  repoUiMock,
  repoUiBadgeMock,
  SmartTableMock,
} from '../mocks/view-helpers';

// ── mocks ────────────────────────────────────────────────────────
vi.mock('@repo/ui', () => repoUiMock);
vi.mock('@repo/ui/components/ui/badge', () => repoUiBadgeMock);
vi.mock('@/components/scaffold/SmartTable', () => ({
  SmartTable: SmartTableMock,
}));

const mockAddToast = vi.fn();
vi.mock('@/store/useToastStore', () => ({
  useToastStore: (sel: (s: { addToast: typeof mockAddToast }) => unknown) =>
    sel({ addToast: mockAddToast }),
}));

vi.mock('@/api', () => ({
  addressApi: {
    list: vi.fn().mockResolvedValue({ list: [], total: 0 }),
    deleteAddress: vi.fn().mockResolvedValue({}),
    updateAddress: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/views/address/AddressEditModal', () => ({
  AddressEditModal: () => <div data-testid="address-edit-modal" />,
}));

// ── subject ──────────────────────────────────────────────────────
import { AddressList } from '@/components/address/AddressListClient';

describe('AddressList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders without crashing', () => {
    const { container } = render(<AddressList />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders SmartTable', () => {
    render(<AddressList />);
    expect(screen.getByTestId('smart-table')).toBeInTheDocument();
  });
});
