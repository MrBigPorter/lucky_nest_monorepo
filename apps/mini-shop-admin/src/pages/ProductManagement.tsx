import React, { useCallback, useMemo, useState } from 'react';
import { Edit3, Trash2, Ban, CheckCircle } from 'lucide-react';
import { Card, Badge } from '@/components/UIComponents';
import { useAntdTable, useRequest } from 'ahooks';
import { createColumnHelper } from '@tanstack/react-table';
import { productApi, categoryApi } from '@/api';
import type { Product, Category } from '@/type/types.ts';
import { Button, ModalManager } from '@repo/ui';
import { CreateProductFormModal } from '@/pages/product/CreateProductFormModal.tsx';
import { EditProductFormModal } from '@/pages/product/EditProductFormModal.tsx';
import { TREASURE_STATE } from '@lucky/shared';
import { useToastStore } from '@/store/useToastStore.ts';
import { SmartImage } from '@/components/ui/SmartImage.tsx';
import { BaseTable } from '@/components/scaffold/BaseTable.tsx';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm.tsx';
import { PageHeader } from '@/components/scaffold/PageHeader.tsx';

type ProductSearchForm = {
  treasureName?: string;
  categoryId?: number | 'ALL';
};

type ProductListParams = {
  page: number;
  pageSize: number;
  treasureName?: string;
  categoryId?: number;
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
      { treasureName: '', categoryId: 'ALL' },
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
      onConfirm: () => refresh(),
      renderChildren: ({ close, confirm }) =>
        CreateProductFormModal(categories, close, confirm),
    });
  };

  const handleOpenEdit = useCallback(
    (p: Product) => {
      ModalManager.open({
        title: 'Edit Product',
        onConfirm: () => refresh(),
        renderChildren: ({ close, confirm }) =>
          EditProductFormModal(categories, close, confirm, p),
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
      updateProductState.run(p.treasureId, p.state === 1 ? 0 : 1);
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
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden border border-gray-200 dark:border-white/5">
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
          <div className="flex justify-end gap-2">
            <Button
              isLoading={deleteProduct.loading}
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
              isLoading={updateProductState.loading}
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
  }, [
    deleteProduct.loading,
    handleOpenEdit,
    handleRemove,
    handleTreasureState,
    updateProductState.loading,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage treasure hunt items & inventory"
        buttonText="Add Product"
        buttonOnClick={handleOpenCreate}
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
