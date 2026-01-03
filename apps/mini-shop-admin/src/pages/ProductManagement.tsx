import React, { useCallback, useMemo, useState } from 'react';
import {
  Edit3,
  Trash2,
  Ban,
  CheckCircle,
  RotateCcw,
  Truck,
  Package,
  Users,
  Gift,
  Clock,
  Calendar,
} from 'lucide-react';
import { Card, Badge, BadgeColor } from '@/components/UIComponents'; // 确保你的 UI 库有 Tooltip
import { useAntdTable, useRequest } from 'ahooks';
import { createColumnHelper } from '@tanstack/react-table';
import { productApi, categoryApi } from '@/api';
import type { Product, Category, BonusConfig } from '@/type/types.ts';
import {
  Button,
  ModalManager,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui';
import { CreateProductFormModal } from '@/pages/product/CreateProductFormModal.tsx';
import { EditProductFormModal } from '@/pages/product/EditProductFormModal.tsx';
import { TREASURE_STATE, TreasureFilterType } from '@lucky/shared';
import { useToastStore } from '@/store/useToastStore.ts';
import { SmartImage } from '@/components/ui/SmartImage.tsx';
import { BaseTable } from '@/components/scaffold/BaseTable.tsx';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm.tsx';
import { PageHeader } from '@/components/scaffold/PageHeader.tsx';
import { format, formatDistanceToNow } from 'date-fns';

// -----------------------------------------------------------------------------
// 类型定义补充 (如果 types.ts 还没更新，这里做临时补充)
// -----------------------------------------------------------------------------
type ProductSearchForm = {
  treasureName?: string;
  categoryId?: number | 'ALL';
  filterType?: TreasureFilterType | 'ALL';
};

type ProductListParams = {
  page: number;
  pageSize: number;
  treasureName?: string;
  categoryId?: number;
  filterType?: TreasureFilterType;
};

// -----------------------------------------------------------------------------
// 辅助函数与组件 (提取出来保持主组件整洁)
// -----------------------------------------------------------------------------

/**
 * 核心逻辑：计算商品的"运营状态"
 * 优先级：下架 > 售罄 > 活动结束 > 预售中 > 正常售卖
 */
const getOperationStatus = (product: Product) => {
  if (product.state !== TREASURE_STATE.ACTIVE) {
    return { label: 'Offline', color: 'gray', icon: <Ban size={12} /> };
  }

  const now = Date.now();
  const start = product.salesStartAt || 0;
  const end = product.salesEndAt || 0;
  const isSoldOut = product.buyQuantityRate >= 100;

  if (isSoldOut) {
    return { label: 'Sold Out', color: 'red', icon: <Package size={12} /> };
  }

  // 活动结束 (设置了结束时间 且 当前时间 > 结束时间)
  if (end > 0 && now > end) {
    return { label: 'Ended', color: 'gray', icon: <Calendar size={12} /> };
  }

  // 预售中 (设置了开始时间 且 当前时间 < 开始时间)
  if (start > 0 && now < start) {
    return { label: 'Pre-sale', color: 'blue', icon: <Clock size={12} /> };
  }

  // 正常热卖
  return { label: 'On Sale', color: 'green', icon: <CheckCircle size={12} /> };
};

/**
 * 组件：赠品标签 (带 Tooltip)
 */
const BonusTag = ({ config }: { config?: BonusConfig }) => {
  if (!config) return null;

  return (
    // 1. 最外层包裹 Provider (通常在 App 根目录包一次即可，但在这里包也行)
    <TooltipProvider>
      <Tooltip>
        {/* 2. 触发器：鼠标放上去的地方 */}
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200 cursor-help transition-colors hover:bg-purple-100">
            <Gift size={10} />
            Bonus
          </span>
        </TooltipTrigger>

        {/* 3. 内容：浮层显示的内容 */}
        <TooltipContent>
          <div className="text-xs">
            <div className="font-bold mb-1 text-purple-700">
              Gift Configuration:
            </div>
            <div>Name: {config.bonusItemName}</div>
            <div>Winners: {config.winnerCount}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * 组件：时间区间展示
 */
const DateRangeDisplay = ({ start, end }: { start?: number; end?: number }) => {
  if (!start && !end) return <span className="text-gray-300">-</span>;

  return (
    <div className="flex flex-col text-[10px] text-gray-500 font-mono leading-tight gap-0.5">
      {start ? (
        <div
          className="flex items-center gap-1"
          title={`Sales Start: ${format(new Date(start), 'yyyy-MM-dd HH:mm:ss')}`}
        >
          <span className="text-green-600 font-bold w-2">S</span>
          {format(new Date(start), 'MM-dd HH:mm')}
        </div>
      ) : null}
      {end ? (
        <div
          className="flex items-center gap-1"
          title={`Sales End: ${format(new Date(end), 'yyyy-MM-dd HH:mm:ss')}`}
        >
          <span className="text-red-600 font-bold w-2">E</span>
          {format(new Date(end), 'MM-dd HH:mm')}
        </div>
      ) : null}
    </div>
  );
};

/**
 * 请求函数：获取列表 (带错误处理)
 */
const getProductsTableData = async (
  { current, pageSize }: { current: number; pageSize: number },
  formData: ProductSearchForm,
) => {
  const params: ProductListParams = {
    page: current,
    pageSize,
  };

  if (formData?.treasureName) params.treasureName = formData.treasureName;
  if (formData?.categoryId && formData.categoryId !== 'ALL') {
    params.categoryId = Number(formData.categoryId);
  }
  if (formData?.filterType && formData.filterType !== 'ALL') {
    params['filterType'] = formData.filterType;
  }

  try {
    const data = await productApi.getProducts(params);
    return {
      list: data?.list ?? [],
      total: data?.total ?? 0,
    };
  } catch (error) {
    console.error('Fetch products failed:', error);
    return { list: [], total: 0 };
  }
};

// -----------------------------------------------------------------------------
// 主页面组件
// -----------------------------------------------------------------------------
export const ProductManagement: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);
  const [categories, setCategories] = useState<Category[]>([]);

  // 1. 获取分类数据
  useRequest(categoryApi.getCategories, {
    onSuccess: (data) => setCategories(data || []),
  });

  // 2. 表格 Hooks
  const {
    tableProps,
    run,
    refresh,
    search: { reset },
  } = useAntdTable(getProductsTableData, {
    defaultPageSize: 10,
    defaultParams: [
      { current: 1, pageSize: 10 },
      { treasureName: '', categoryId: 'ALL', filterType: 'ALL' },
    ],
  });

  // 3. 业务操作 Hooks
  const deleteProduct = useRequest(productApi.deleteProduct, {
    manual: true,
    onSuccess: () => {
      refresh();
      addToast('success', 'Product deleted successfully');
    },
  });

  const purgeCacheReq = useRequest(productApi.pureHomeCache, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Home cache purged successfully.');
    },
  });

  const updateProductState = useRequest(productApi.updateProductState, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Product state updated.');
      refresh();
    },
  });

  // 4. 操作 Handlers
  const pagination = tableProps.pagination || {};
  const pageSize = pagination.pageSize ?? 10;
  const dataSource = (tableProps.dataSource || []) as Product[];

  const handleSearch = (values: ProductSearchForm) => {
    run({ current: 1, pageSize: pageSize }, values);
  };

  const handleOpenCreate = () => {
    ModalManager.open({
      title: 'Create Product',
      size: 'xl',
      onConfirm: () => reset(), // 创建后重置回第一页
      renderChildren: ({ confirm }) =>
        CreateProductFormModal(categories, confirm),
    });
  };

  const handleOpenEdit = useCallback(
    (p: Product) => {
      ModalManager.open({
        title: 'Edit Product',
        size: 'xl',
        onConfirm: () => refresh(),
        renderChildren: ({ confirm }) =>
          EditProductFormModal(categories, confirm, p),
      });
    },
    [categories, refresh],
  );

  const handleRemove = useCallback(
    (p: Product) => {
      ModalManager.open({
        title: 'Are you sure?',
        content: `Delete product "${p.treasureName}"? This cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: () => deleteProduct.run(p.treasureId),
      });
    },
    [deleteProduct],
  );

  const handleTreasureState = useCallback(
    (p: Product) => {
      const isOnline = p.state === TREASURE_STATE.ACTIVE;
      ModalManager.open({
        title: isOnline ? 'Take Offline?' : 'Put Online?',
        content: isOnline
          ? 'Users will not see this product anymore.'
          : 'Users will be able to buy this product immediately.',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: () => {
          const newState = isOnline
            ? TREASURE_STATE.INACTIVE
            : TREASURE_STATE.ACTIVE;
          updateProductState.run(p.treasureId, newState);
        },
      });
    },
    [updateProductState],
  );

  // -----------------------------------------------------------------------------
  // Columns 定义 (核心视觉优化)
  // -----------------------------------------------------------------------------
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Product>();

    return [
      // 列 1: 商品综合信息 (图片 + 名称 + 属性Tag + ID)
      columnHelper.accessor('treasureName', {
        header: 'Product Info',
        size: 280, // 给足够宽度
        cell: (info) => {
          const p = info.row.original;
          const isGroup = (p.groupSize || 0) > 1;
          const isReal = p.shippingType === 1; // 1-实物

          return (
            <div className="flex items-start gap-3 group">
              {/* 图片容器 */}
              <div className="relative w-12 h-12 min-w-[48px] rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700">
                <SmartImage
                  src={p.treasureCoverImg}
                  width={48}
                  height={48}
                  alt={p.treasureName}
                  className="w-full h-full object-cover"
                />

                {/* 图片左上角：业务类型角标 */}
                <div className="absolute top-0 left-0 flex flex-col gap-0.5 p-0.5 pointer-events-none">
                  {isGroup && (
                    <div
                      className="bg-orange-500/90 text-white p-[2px] rounded-[3px] shadow-sm backdrop-blur-sm"
                      title={`Group Buy: ${p.groupSize}P`}
                    >
                      <Users size={10} strokeWidth={3} />
                    </div>
                  )}
                  {isReal && (
                    <div
                      className="bg-blue-500/90 text-white p-[2px] rounded-[3px] shadow-sm backdrop-blur-sm"
                      title="Physical Item"
                    >
                      <Truck size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>

              {/* 文本信息 */}
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div
                  className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors cursor-default"
                  title={p.treasureName}
                >
                  {p.treasureName}
                </div>

                {/* 标签行：ID | 赠品 | 拼团 */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-gray-400 font-mono select-all">
                    ID: {p.treasureId.slice(-6)}
                  </span>

                  <BonusTag config={p.bonusConfig} />

                  {isGroup && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
                      {p.groupSize}P Group
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      }),

      // 列 2: 销售进度条
      columnHelper.accessor('buyQuantityRate', {
        header: 'Progress',
        size: 140,
        cell: (info) => {
          const rate = info.getValue() || 0;
          const p = info.row.original;
          return (
            <div className="w-full max-w-[120px]">
              <div className="flex justify-between text-xs mb-1">
                <span
                  className={`font-bold ${rate >= 100 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}
                >
                  {rate}%
                </span>
                <span className="text-gray-400 text-[10px] font-mono">
                  {p.seqBuyQuantity}/{p.seqShelvesQuantity}
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    rate >= 100 ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(rate, 100)}%` }}
                />
              </div>
            </div>
          );
        },
      }),

      // 列 3: 价格体系 (售价 + 成本)
      columnHelper.accessor('unitAmount', {
        header: 'Price',
        size: 110,
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
              ₱{info.getValue()}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              Cost: ₱{info.row.original.costAmount}
            </span>
          </div>
        ),
      }),

      // 列 4: 运营状态与时间 (合并展示)
      columnHelper.display({
        id: 'status_time',
        header: 'Status / Time',
        size: 180,
        cell: (info) => {
          const p = info.row.original;
          const status = getOperationStatus(p);

          return (
            <div className="flex flex-col gap-1.5 items-start">
              <Badge color={status.color as BadgeColor}>
                {status.icon}
                <span className="uppercase tracking-wide text-[10px] font-bold">
                  {status.label}
                </span>
              </Badge>

              {/* 时间展示 */}
              <DateRangeDisplay start={p.salesStartAt} end={p.salesEndAt} />

              {/* 预售倒计时增强提示 */}
              {status.label === 'Pre-sale' && p.salesStartAt && (
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded font-medium">
                  Starts{' '}
                  {formatDistanceToNow(p.salesStartAt, { addSuffix: true })}
                </span>
              )}
            </div>
          );
        },
      }),

      // 列 5: 操作区
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        size: 120,
        cell: (info) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => handleOpenEdit(info.row.original)}
              title="Edit Product"
            >
              <Edit3 size={16} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${
                info.row.original.state === TREASURE_STATE.ACTIVE
                  ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              }`}
              onClick={() => handleTreasureState(info.row.original)}
              title={
                info.row.original.state === TREASURE_STATE.ACTIVE
                  ? 'Take Offline'
                  : 'Put Online'
              }
            >
              {info.row.original.state === TREASURE_STATE.ACTIVE ? (
                <Ban size={16} />
              ) : (
                <CheckCircle size={16} />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => handleRemove(info.row.original)}
              title="Delete Product"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      }),
    ];
  }, [handleOpenEdit, handleRemove, handleTreasureState]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage treasure hunt items, inventory & sales schedule."
        buttonText="Add Product"
        buttonOnClick={handleOpenCreate}
        action={
          <Button
            variant="outline"
            className="mr-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
            isLoading={purgeCacheReq.loading}
            onClick={() => purgeCacheReq.run()}
          >
            <RotateCcw size={16} className="mr-2" />
            Purge Home Cache
          </Button>
        }
      />
      <Card>
        {/* 筛选区域 */}
        <div className="mb-6">
          <SchemaSearchForm<ProductSearchForm>
            schema={[
              {
                type: 'input',
                key: 'treasureName',
                label: 'Product Name',
                placeholder: 'Search name or ID...',
              },
              {
                type: 'select',
                key: 'categoryId',
                label: 'Category',
                defaultValue: 'ALL',
                options: [
                  { label: 'All Categories', value: 'ALL' },
                  ...categories.map((c) => ({
                    label: c.name,
                    value: String(c.id),
                  })),
                ],
              },
              {
                type: 'select',
                key: 'filterType',
                label: 'Filter Type',
                defaultValue: 'ALL',
                options: [
                  ...Object.keys(TreasureFilterType)
                    .filter((k) => isNaN(Number(k))) // 过滤数字 Key
                    .map((type) => ({
                      label: type.replace(/_/g, ' '),
                      value: type,
                    })),
                ],
              },
            ]}
            onSearch={handleSearch}
            onReset={reset}
          />
        </div>

        {/* 表格区域 */}
        <BaseTable
          data={dataSource}
          columns={columns}
          loading={tableProps.loading}
          rowKey="treasureId"
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              tableProps.onChange?.({
                current: page,
                pageSize: pageSize || tableProps.pagination?.pageSize || 10,
              });
            },
          }}
        />
      </Card>
    </div>
  );
};
