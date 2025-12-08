import React, { useEffect, useState } from 'react';
import { useAntdTable, useRequest } from 'ahooks';
import { actSectionApi, productApi } from '@/api'; // 复用你现有的 productApi
import { actSectionWithProducts, Product } from '@/type/types'; // 复用现有的类型
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
import { useToastStore } from '@/store/useToastStore.ts';

interface Props {
  onClose: () => void;
  onConfirm: () => void;
  editingData: actSectionWithProducts;
}

export const ActSectionEditorModal: React.FC<Props> = ({
  onClose,
  onConfirm,
  editingData,
}) => {
  const [selectedRows, setSelectedRows] = useState<Record<string, Product>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const addToast = useToastStore((s) => s.addToast);

  const getTableData = async (
    { current, pageSize }: { current: number; pageSize: number },
    formData: { name: string },
  ) => {
    const res = await productApi.getProducts({
      page: current,
      pageSize,
      treasureName: formData.name,
    });
    return { list: res.list ?? [], total: res.total ?? 0 };
  };

  const { tableProps, run } = useAntdTable(getTableData, {
    manual: true,
    defaultPageSize: 5, // 弹窗里显示少一点
    defaultParams: [{ current: 1, pageSize: 5 }, { name: '' }],
  });
  const { run: bindProduct, loading } = useRequest(actSectionApi.bindProduct, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Products added to activity section successfully');
      onConfirm();
    },
  });

  useEffect(() => {
    run({ current: 1, pageSize: 5 }, { name: '' });
  }, [run]);

  const confirm = () => {
    const products = Object.values(selectedRows).map(
      (product) => product.treasureId,
    );
    bindProduct(editingData.id, { treasureIds: products });
  };

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
        const existingIds = editingData.items.map((item) => item.treasureId);
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

  return (
    <div className="rounded-xl shadow-2xl w-[600px] max-w-[90vw] flex flex-col max-h-[85vh]">
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) =>
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

        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/5">
          <Table>
            <TableHeader className="bg-gray-50/60 dark:bg-white/5">
              {table.getHeaderGroups().map((hg) => (
                <TableRow className="border-0" key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead
                      key={h.id}
                      className="border-b border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
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
                tableProps.pagination.current * 5 >= tableProps.pagination.total
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

      <div className="p-4  flex justify-end gap-3 ">
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
        <Button isLoading={loading} onClick={confirm}>
          Confirm Add
        </Button>
      </div>
    </div>
  );
};
