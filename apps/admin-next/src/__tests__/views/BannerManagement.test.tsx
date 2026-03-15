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
  SmartImageMock,
} from '../mocks/view-helpers';

// ── hoisted mock variables ────────────────────────────────────────
const mockUseAntdTable = vi.hoisted(() => vi.fn());
const mockUseRequest = vi.hoisted(() => vi.fn());

// ── mocks ────────────────────────────────────────────────────────
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
vi.mock('@/components/ui/SmartImage', () => ({ SmartImage: SmartImageMock }));
vi.mock('ahooks', () => ({
  useAntdTable: (...args: unknown[]) => mockUseAntdTable(...args),
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));
vi.mock('@/api', () => ({
  bannerApi: {
    getList: vi.fn().mockResolvedValue({ list: [], total: 0 }),
    delete: vi.fn().mockResolvedValue({}),
    updateState: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock('@lucky/shared', () => ({ JUMP_CATE: { PRODUCT: 1, URL: 2 } }));
vi.mock('@/views/banner/BannerFormModal', () => ({
  BannerFormModal: () => <div data-testid="banner-form-modal" />,
}));
vi.mock('@/store/useToastStore', () => ({
  useToastStore: (
    sel: (s: { addToast: ReturnType<typeof vi.fn> }) => unknown,
  ) => sel({ addToast: vi.fn() }),
}));

const BANNERS_MOCK = [
  {
    id: '1',
    title: 'Summer Sale',
    bannerCate: 1,
    state: 1,
    sort: 1,
    imageUrl: '/img.jpg',
  },
  {
    id: '2',
    title: 'Winter Promo',
    bannerCate: 2,
    state: 0,
    sort: 2,
    imageUrl: '/img2.jpg',
  },
];

// ── subject ──────────────────────────────────────────────────────
import { BannerManagement } from '@/views/BannerManagement';

describe('BannerManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAntdTable.mockReturnValue(makeUseAntdTable(BANNERS_MOCK, 2));
    mockUseRequest.mockReturnValue(makeUseRequest(undefined));
  });

  it('renders without crashing', () => {
    const { container } = render(<BannerManagement />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the BaseTable', () => {
    render(<BannerManagement />);
    expect(screen.getByTestId('base-table')).toBeInTheDocument();
  });

  it('renders page header', () => {
    render(<BannerManagement />);
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
  });

  it('shows loading state gracefully', () => {
    mockUseAntdTable.mockReturnValue(makeUseAntdTable([], 0, true));
    const { container } = render(<BannerManagement />);
    expect(container.firstChild).not.toBeNull();
  });
});
