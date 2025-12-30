import React, { useCallback, useMemo, useState } from 'react';
import { Edit3, Trash2, Ban, CheckCircle, RotateCcw } from 'lucide-react';
import { Card, Badge } from '@/components/UIComponents';
import { useAntdTable, useRequest } from 'ahooks';
import { createColumnHelper } from '@tanstack/react-table';
import { productApi, categoryApi } from '@/api';
import type { Product, Category } from '@/type/types.ts';
import { Button, ModalManager } from '@repo/ui';
import { CreateProductFormModal } from '@/pages/product/CreateProductFormModal.tsx';
import { EditProductFormModal } from '@/pages/product/EditProductFormModal.tsx';
import { TREASURE_STATE, TreasureFilterType } from '@lucky/shared';
import { useToastStore } from '@/store/useToastStore.ts';
import { SmartImage } from '@/components/ui/SmartImage.tsx';
import { BaseTable } from '@/components/scaffold/BaseTable.tsx';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm.tsx';
import { PageHeader } from '@/components/scaffold/PageHeader.tsx';
import { format } from 'date-fns'; // 建议安装 date-fns: yarn add date-fns

// 扩展 Product 类型以包含后端动态计算的 statusTag
// 如果你的 types.ts 还没更新，这里临时扩展一下
type ProductWithTag = Product & {
  statusTag?: 'PRE_SALE' | 'ON_SALE';
};

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

// ✅ 优化 1: 增加 try-catch 和空值兜底，防止表格崩溃
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

export const ProductManagement: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);
  const [categories, setCategories] = useState<Category[]>([]);

  useRequest(categoryApi.getCategories, {
    onSuccess: (data) => setCategories(data || []),
  });

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

  const pagination = tableProps.pagination || {};
  const pageSize = pagination.pageSize ?? 10;

  const dataSource = (tableProps.dataSource || []) as ProductWithTag[];

  const handleSearch = (values: ProductSearchForm) => {
    run({ current: 1, pageSize: pageSize }, values);
  };

  // ✅ 优化 2: 创建成功后重置到第一页，确保看到新数据
  const handleOpenCreate = () => {
    ModalManager.open({
      title: 'Create Product',
      size: 'xl',
      onConfirm: () => {
        // 重置搜索条件并回到第一页
        reset();
      },
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
        content: 'Product will be removed permanently!!',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: () => {
          deleteProduct.run(p.treasureId);
        },
      });
    },
    [deleteProduct],
  );

  const handleTreasureState = useCallback(
    (p: Product) => {
      ModalManager.open({
        title: 'Are you sure?',
        content:
          p.state === TREASURE_STATE.ACTIVE
            ? 'Product will be taken offline.'
            : 'Product will be put online.',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: () => {
          const newState =
            p.state === TREASURE_STATE.ACTIVE
              ? TREASURE_STATE.INACTIVE
              : TREASURE_STATE.ACTIVE;
          updateProductState.run(p.treasureId, newState);
        },
      });
    },
    [updateProductState],
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<ProductWithTag>();

    return [
      columnHelper.accessor('treasureName', {
        header: 'Product',
        // 设置最小宽度防止挤压
        size: 250,
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 min-w-[48px] rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden border border-gray-200 dark:border-white/5">
              <SmartImage
                src={info.row.original.treasureCoverImg}
                width={48}
                height={48}
                alt={info.getValue()}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div
                className="font-medium text-gray-900 dark:text-white line-clamp-1"
                title={info.getValue()}
              >
                {info.getValue()}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {info.row.original.treasureId}
              </div>
            </div>
          </div>
        ),
      }),
      // ✅ 优化 3: 进度条可视化
      columnHelper.accessor('buyQuantityRate', {
        header: 'Sales Progress',
        size: 140,
        cell: (info) => {
          const rate = info.getValue() || 0;
          return (
            <div className="w-full max-w-[120px]">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-900 font-medium">{rate}%</span>
                <span className="text-gray-400 text-[10px]">
                  {info.row.original.seqBuyQuantity}/
                  {info.row.original.seqShelvesQuantity}
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(rate, 100)}%` }}
                />
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('unitAmount', {
        header: 'Unit Price',
        cell: (info) => (
          <span className="font-mono text-sm font-medium">
            ₱{info.getValue()}
          </span>
        ),
      }),
      // ✅ 优化 4: 状态展示增强 (Pre-sale 标签)
      columnHelper.accessor('state', {
        header: 'Status',
        cell: (info) => {
          const isOnline = info.getValue() === TREASURE_STATE.ACTIVE;
          const tag = info.row.original.statusTag;

          return (
            <div className="flex flex-col items-start gap-1.5">
              <Badge color={isOnline ? 'green' : 'gray'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>

              {/* 只有上架状态才显示业务标签 */}
              {isOnline && tag === 'PRE_SALE' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Pre-sale
                </span>
              )}
              {isOnline && tag === 'ON_SALE' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
                  Hot Sale
                </span>
              )}
            </div>
          );
        },
      }),
      // ✅ 优化 5: 增加时间列，方便运营查看
      columnHelper.accessor('createdAt', {
        header: 'Created At',
        cell: (info) => (
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {info.getValue()
              ? format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm')
              : '-'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
              onClick={() => handleOpenEdit(info.row.original)}
              title="Edit"
            >
              <Edit3 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
              onClick={() => handleRemove(info.row.original)}
              title="Delete"
            >
              <Trash2 size={16} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${info.row.original.state === TREASURE_STATE.ACTIVE ? 'text-gray-500 hover:text-orange-600' : 'text-gray-500 hover:text-green-600'}`}
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
          </div>
        ),
      }),
    ];
  }, [handleOpenEdit, handleRemove, handleTreasureState]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage treasure hunt items & inventory"
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
        {/* 筛选区 */}
        <div className="space-y-3 mb-6">
          <SchemaSearchForm<ProductSearchForm>
            schema={[
              {
                type: 'input',
                key: 'treasureName',
                label: 'Product Name',
                placeholder: 'Search product...',
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
                // ✅ 优化 6: 严谨处理 Enum，防止出现数字 key
                options: [
                  ...Object.keys(TreasureFilterType)
                    .filter((k) => isNaN(Number(k))) // 过滤掉数字反向映射
                    .map((type) => ({
                      label: type.replace(/_/g, ' '), // PRE_SALE -> PRE SALE
                      value: type,
                    })),
                ],
              },
            ]}
            onSearch={handleSearch}
            onReset={reset}
          />
        </div>

        <BaseTable
          data={dataSource}
          columns={columns}
          // ✅ 优化 7: 加上 Loading 状态
          loading={tableProps.loading}
          rowKey="treasureId"
          pagination={{
            ...tableProps.pagination,
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
