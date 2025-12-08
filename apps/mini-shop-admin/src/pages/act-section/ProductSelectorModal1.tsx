import React, { useState } from 'react';
import { useAntdTable } from 'ahooks';
import { productApi } from '@/api'; // 复用你现有的 productApi
import { Product } from '@/type/types'; // 复用现有的类型
import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@repo/ui';
import { Input } from '@/components/UIComponents.tsx';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedProducts: Product[]) => void;
  existingIds: string[]; // 已经添加过的商品ID，需要禁用或隐藏
}

export const ProductSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  existingIds,
}) => {
  const [selectedRows, setSelectedRows] = useState<Record<string, Product>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // 1. 获取商品列表 API
  const getTableData = async (
    { current, pageSize }: any,
    formData: { name: string },
  ) => {
    const res = await productApi.getProducts({
      page: current,
      pageSize,
      treasureName: formData.name,
      // categoryId: 'ALL' // 如果需要分类筛选可加上
    });
    return { list: res.list ?? [], total: res.total ?? 0 };
  };

  const {
    tableProps,
    run,
    search: { submit },
  } = useAntdTable(getTableData, {
    defaultPageSize: 5, // 弹窗里显示少一点
    defaultParams: [{ current: 1, pageSize: 5 }, { name: '' }],
  });

  // 2. 处理多选逻辑
  const toggleSelection = (product: Product) => {
    setSelectedRows((prev) => {
      const next = { ...prev };
      if (next[product.treasureId]) {
        delete next[product.treasureId];
      } else {
        next[product.treasureId] = product;
      }
      return next;
    });
  };

  // 3. 表格列定义
  const columnHelper = createColumnHelper<Product>();
  const columns = [
    columnHelper.display({
      id: 'select',
      header: 'Select',
      cell: (info) => {
        const id = info.row.original.treasureId;
        const isDisabled = existingIds.includes(id);
        const isChecked = !!selectedRows[id];

        return (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={isDisabled}
            checked={isChecked || isDisabled} // 如果已存在，强制显示选中或禁用
            onChange={() => !isDisabled && toggleSelection(info.row.original)}
          />
        );
      },
    }),
    columnHelper.accessor('treasureName', {
      header: 'Product Info',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <img
            src={info.row.original.treasureCoverImg}
            className="w-10 h-10 rounded object-cover bg-gray-100"
            alt=""
          />
          <div className="text-sm font-medium line-clamp-1">
            {info.getValue()}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('unitAmount', {
      header: 'Price',
      cell: (info) => (
        <span className="font-mono text-xs">₱{info.getValue()}</span>
      ),
    }),
  ];

  const table = useReactTable({
    data: (tableProps.dataSource || []) as Product[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[600px] max-w-[90vw] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-lg">Select Products</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e: any) =>
                e.key === 'Enter' &&
                run({ current: 1, pageSize: 5 }, { name: searchTerm })
              }
            />
            <Button
              onClick={() =>
                run({ current: 1, pageSize: 5 }, { name: searchTerm })
              }
            >
              <Search size={16} />
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            {/* 复用你的 Table 组件结构 */}
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id} className="py-2 px-4 bg-gray-50">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2 px-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination (Simplified) */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Total: {tableProps.pagination.total}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={tableProps.pagination.current === 1}
                onClick={() =>
                  tableProps.pagination.onChange(
                    tableProps.pagination.current - 1,
                    5,
                  )
                }
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={
                  tableProps.pagination.current * 5 >=
                  tableProps.pagination.total
                }
                onClick={() =>
                  tableProps.pagination.onChange(
                    tableProps.pagination.current + 1,
                    5,
                  )
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 dark:bg-white/5 rounded-b-xl">
          <div className="flex-1 content-center text-sm text-gray-500">
            Selected:{' '}
            <span className="font-bold text-blue-600">
              {Object.keys(selectedRows).length}
            </span>{' '}
            items
          </div>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(Object.values(selectedRows))}>
            Confirm Add
          </Button>
        </div>
      </div>
    </div>
  );
};
