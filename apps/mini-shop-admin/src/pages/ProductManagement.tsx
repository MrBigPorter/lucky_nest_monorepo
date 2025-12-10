import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Ban, CheckCircle } from 'lucide-react';
import { Card, Badge, Input } from '@/components/UIComponents';
import { useAntdTable, useRequest } from 'ahooks';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { productApi, categoryApi } from '@/api';
import type { Product, Category } from '@/type/types.ts';
import {
  Button,
  BaseSelect as Select,
  ModalManager,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@repo/ui';
import { CreateProductFormModal } from '@/pages/product/CreateProductFormModal.tsx';
import { EditProductFormModal } from '@/pages/product/EditProductFormModal.tsx';
import { TREASURE_STATE } from '@lucky/shared';
import { useToastStore } from '@/store/useToastStore.ts';
import { Pagination } from '@/components/Pagination.tsx';

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

  const [filters, setFilters] = useState<ProductSearchForm>({
    treasureName: '',
    categoryId: 'ALL',
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
  const handleSearch = () => {
    run(
      { current: 1, pageSize },
      {
        treasureName: filters.treasureName?.trim() ?? '',
        categoryId: filters.categoryId,
      },
    );
  };

  const handleResetFilters = () => {
    const init = { treasureName: '', categoryId: 'ALL' as const };
    setFilters(init);
    reset();
  };

  const handleOpenCreate = () => {
    ModalManager.open({
      title: 'Create Product',
      onConfirm: () => refresh(),
      renderChildren: ({ close, confirm }) =>
        CreateProductFormModal(categories, close, confirm),
    });
  };

  const handleOpenEdit = (p: Product) => {
    ModalManager.open({
      title: 'Edit Product',
      onConfirm: () => refresh(),
      renderChildren: ({ close, confirm }) =>
        EditProductFormModal(categories, close, confirm, p),
    });
  };

  const handleRemove = (p: Product) => {
    ModalManager.open({
      title: 'Are you sure?',
      content: 'Product will be removed permanently!!',
      confirmText: 'confirm',
      cancelText: 'cancel',
      onConfirm: () => {
        deleteProduct.run(p.treasureId);
      },
    });
  };

  const handleTreasureState = (p: Product) => {
    updateProductState.run(p.treasureId, p.state === 1 ? 0 : 1);
  };

  // 列定义
  const columnHelper = createColumnHelper<Product>();

  const columns = [
    columnHelper.accessor('treasureName', {
      header: 'Product',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/10 overflow-hidden border border-gray-200 dark:border-white/5">
            <img
              src={info.row.original.treasureCoverImg}
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

  const table = useReactTable({
    data: dataSource,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage treasure hunt items & inventory
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus size={18} /> Add Product
        </Button>
      </div>

      <Card>
        {/* 筛选区 */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Product Name"
              placeholder="Search product"
              value={filters.treasureName}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  treasureName: e.target.value,
                }))
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <Select
              label="Category"
              value={
                filters.categoryId === 'ALL'
                  ? 'ALL'
                  : String(filters.categoryId)
              }
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  categoryId: value === 'ALL' ? 'ALL' : Number(value),
                }))
              }
              options={[
                { label: 'All Categories', value: 'ALL' },
                ...categories.map((c) => ({
                  label: c.name,
                  value: String(c.id),
                })),
              ]}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleResetFilters}>
              Reset
            </Button>
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/5">
          <Table className="text-left">
            <TableHeader className="bg-gray-50/60 dark:bg-white/5">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-4 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-black/20">
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {dataSource.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-8 text-center text-gray-500"
                  >
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          current={tableProps.pagination.current}
          pageSize={10}
          total={tableProps.pagination.total}
          onChange={(page, pageSize) =>
            tableProps.pagination.onChange(page, pageSize)
          }
        />
      </Card>
    </div>
  );
};
