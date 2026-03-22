import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  repoUiMock,
  makeUseRequest,
  SmartTableMock,
  PageHeaderMock,
  SmartImageMock,
} from '../mocks/view-helpers';

const mockUseRequest = vi.hoisted(() => vi.fn());

vi.mock('@repo/ui', () => repoUiMock);
vi.mock('@/components/scaffold/SmartTable', () => ({
  SmartTable: SmartTableMock,
}));
vi.mock('@/components/scaffold/PageHeader', () => ({
  PageHeader: PageHeaderMock,
}));
vi.mock('@/components/ui/SmartImage', () => ({ SmartImage: SmartImageMock }));
vi.mock('ahooks', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));
vi.mock('@/api', () => ({
  productApi: {
    getProducts: vi.fn().mockResolvedValue({ list: [], total: 0 }),
    createProduct: vi.fn().mockResolvedValue({}),
    updateProduct: vi.fn().mockResolvedValue({}),
    deleteProduct: vi.fn().mockResolvedValue({}),
    updateProductState: vi.fn().mockResolvedValue({}),
    pureHomeCache: vi.fn().mockResolvedValue({}),
  },
  categoryApi: { getCategories: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@lucky/shared', () => ({
  TREASURE_STATE: { ACTIVE: 1, INACTIVE: 0 },
  TreasureFilterType: { ALL: 'ALL', ACTIVE: 'ACTIVE' },
}));
vi.mock('@/views/product/CreateProductFormModal', () => ({
  CreateProductFormModal: () => <div data-testid="create-product-modal" />,
}));
vi.mock('@/views/product/EditProductFormModal', () => ({
  EditProductFormModal: () => <div data-testid="edit-product-modal" />,
}));
vi.mock('@/store/useToastStore', () => ({
  useToastStore: (
    sel: (s: { addToast: ReturnType<typeof vi.fn> }) => unknown,
  ) => sel({ addToast: vi.fn() }),
}));

// ── subject ──────────────────────────────────────────────────────
import { ProductManagement } from '@/components/products/ProductManagementClient';

describe('ProductManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRequest.mockReturnValue(makeUseRequest([]));
  });

  it('renders without crashing', () => {
    expect(render(<ProductManagement />).container.firstChild).not.toBeNull();
  });

  it('renders SmartTable', () => {
    render(<ProductManagement />);
    expect(screen.getByTestId('smart-table')).toBeInTheDocument();
  });

  it('shows loading state gracefully', () => {
    mockUseRequest.mockReturnValue(makeUseRequest(undefined, true));
    expect(render(<ProductManagement />).container.firstChild).not.toBeNull();
  });
});
