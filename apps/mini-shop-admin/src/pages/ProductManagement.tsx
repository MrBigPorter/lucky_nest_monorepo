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

  const data = await productApi.getProducts(params);
  return {
    list: data.list ?? [],
    total: data.total ?? 0,
  };
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

  const dataSource = (tableProps.dataSource || []) as Product[];

  // 搜索
  const handleSearch = (values: ProductSearchForm) => {
    // 自动重置到第一页，并带上所有条件
    run({ current: 1, pageSize: pageSize }, values);
  };

  const handleOpenCreate = () => {
    ModalManager.open({
      title: 'Create Product',
      size: 'xl',
      onConfirm: () => refresh(),
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
        confirmText: 'confirm',
        cancelText: 'cancel',
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
        title: ' Are you sure?',
        content:
          p.state === TREASURE_STATE.ACTIVE
            ? 'Product will be taken offline.'
            : 'Product will be put online.',
        confirmText: 'confirm',
        cancelText: 'cancel',
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
    // 列定义
    const columnHelper = createColumnHelper<Product>();

    return [
      columnHelper.accessor('treasureName', {
        header: 'Product',
        cell: (info) => (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 min-w-[46px] rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden border border-gray-200 dark:border-white/5">
              <SmartImage
                src={info.row.original.treasureCoverImg}
                width={46}
                height={46}
                alt={info.getValue()}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {info.getValue()}
              </div>
              <div className="text-xs text-gray-500">
                ID: {info.row.original.treasureId}
              </div>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('seqShelvesQuantity', {
        header: 'Shares',
        cell: (info) => (
          <span className="font-mono text-sm">
            {info.row.original.seqBuyQuantity}/{info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('unitAmount', {
        header: 'Unit Price',
        cell: (info) => (
          <span className="font-mono text-sm">₱{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('state', {
        header: 'Status',
        cell: (info) => (
          <Badge color={info.getValue() === 1 ? 'green' : 'gray'}>
            {info.getValue() === 1 ? 'Online' : 'Offline'}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex  gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(info.row.original)}
            >
              <Trash2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(info.row.original)}
            >
              <Edit3 size={16} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTreasureState(info.row.original)}
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
            className="mr-2 border-orange-200 text-orange-600 hover:bg-orange-50"
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
                defaultValue: 'ALL', // 支持默认值
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
                options: Object.values(TreasureFilterType).map((type) => ({
                  label: type,
                  value: type,
                })),
              },
            ]}
            onSearch={handleSearch}
            onReset={reset}
          />
        </div>

        <BaseTable
          data={dataSource}
          columns={columns}
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
