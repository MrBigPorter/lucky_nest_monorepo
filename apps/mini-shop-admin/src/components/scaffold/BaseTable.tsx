import React, { memo, useMemo, useRef, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Checkbox,
} from '@repo/ui';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  Row,
  SortingState,
  getSortedRowModel,
  getExpandedRowModel,
  RowSelectionState,
  Cell,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { Pagination } from '@/components/scaffold/Pagination';
import { Loader2, ArrowUpDown, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@repo/ui';

// --- 内部组件：可排序行 ---
const SortableRow = ({
  row,
  children,
  className,
  onClick,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: Row<any>;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    id: (row.original as any).id,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative' as const,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        className,
        'bg-white dark:bg-gray-950',
        isDragging && 'bg-blue-50 dark:bg-blue-900/20 shadow-lg',
      )}
      onClick={onClick}
      {...attributes}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const childProps = child.props as Record<string, any>;
          if (childProps['data-drag-handle']) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return React.cloneElement(child, { listeners } as any);
          }
        }
        return child;
      })}
    </tr>
  );
};

/**
 * 基础表格组件，支持排序、分页、行选择、可展开行和拖拽排序等功能。
 * @template T - 表格数据的类型
 * @param {BaseTableProps<T>} props - 组件属性
 * @returns {JSX.Element} 渲染的表格组件
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface BaseTableProps<T extends Record<string, any>> {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  loading?: boolean;
  rowKey?: keyof T;

  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };

  enableDrag?: boolean;
  onDragEnd?: (event: DragEndEvent) => void;

  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;

  expandable?: boolean;
  renderSubComponent?: (row: Row<T>) => React.ReactNode;

  onRowClick?: (row: T) => void;

  defaultSelectedRowKeys?: string[];
  disabledRowKeys?: string[];
}

/**
 * 基础表格组件
 * @param data - 表格数据
 * @param propColumns - 列定义
 * @param loading - 加载状态
 * @param rowKey - 唯一行标识字段
 * @param pagination - 分页配置
 * @param enableDrag - 是否启用拖拽排序
 * @param onDragEnd - 拖拽结束回调
 * @param selectable - 是否启用行选择
 * @param onSelectionChange  - 选择变化回调
 * @param expandable - 是否启用可展开行
 * @param renderSubComponent - 渲染子组件函数
 * @param onRowClick - 行点击回调
 * @param defaultSelectedRowKeys - 默认选中的行键
 * @param disabledRowKeys - 禁用选择的行键
 * @returns 渲染的表格组件
 * @constructor
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BaseTable = <T extends Record<string, any>>({
  data,
  columns: propColumns,
  loading,
  rowKey = 'id',
  pagination,
  enableDrag = false,
  onDragEnd,
  selectable = false,
  onSelectionChange,
  expandable = false,
  renderSubComponent,
  onRowClick,
  defaultSelectedRowKeys,
  disabledRowKeys,
}: BaseTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const prevSelectionRef = useRef<string>('');
  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols = [...propColumns] as ColumnDef<T, any>[];

    if (selectable) {
      cols.unshift({
        id: 'select',
        header: ({ table }) => {
          const isAllSelected = table.getIsAllPageRowsSelected();
          const isSomeSelected = table.getIsSomePageRowsSelected();
          const checked = isAllSelected
            ? true
            : isSomeSelected
              ? 'indeterminate'
              : false;

          const handleToggleAll = (val: boolean) => {
            // 拿到当前的选中状态副本
            const newSelection = { ...table.getState().rowSelection };

            // 获取当前页的所有行
            const pageRows = table.getRowModel().rows;

            pageRows.forEach((row) => {
              // 关键点：row.getCanSelect() 会根据你之前写的 enableRowSelection 逻辑返回结果
              // 如果 ID 在 disabledRowKeys 里，getCanSelect() 就是 false

              // 只有“允许被选”的行，我们才去修改它的状态
              // 这样“禁用”的行（locked rows）就会保持原样，不会被选中，也不会被取消
              if (row.getCanSelect()) {
                if (val) {
                  // 全选：把当前页所有可选行设为 true
                  newSelection[row.id] = true;
                } else {
                  // 取消全选：把当前页所有可选行删掉 (delete)
                  delete newSelection[row.id];
                }
              }
            });

            // 更新表格状态
            table.setRowSelection(newSelection);
          };

          return (
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => handleToggleAll(!!value)}
              aria-label="Select all"
            />
          );
        },
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              disabled={!row.getCanSelect()}
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        size: 40,
      });
    }

    if (expandable) {
      cols.unshift({
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          return row.getCanExpand() ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                row.toggleExpanded();
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {row.getIsExpanded() ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          ) : null;
        },
        size: 30,
      });
    }

    return cols;
  }, [propColumns, selectable, expandable]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => String(row[rowKey]),
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
    },
    enableRowSelection: (row) => {
      const id = String(row.original[rowKey]);
      // 如果 disabledRowKeys 存在，且当前行的 id 在其中，则禁用选择
      return !(disabledRowKeys && disabledRowKeys.includes(id));
    },
  });

  console.log('table rowSelection:', table);

  React.useEffect(() => {
    // 初始化默认选中行
    if (defaultSelectedRowKeys && defaultSelectedRowKeys.length > 0) {
      const initialSelection: RowSelectionState = {};
      defaultSelectedRowKeys.forEach((key) => {
        initialSelection[key] = true;
      });
      setRowSelection(initialSelection);
    }
  }, [defaultSelectedRowKeys]);

  React.useEffect(() => {
    if (onSelectionChange) {
      // 简单粗暴但有效：把选中的 ID 拼成字符串进行比对
      // 假设 rowKey 是 'id' 或 'productId'，这里用 map 提取一下
      const currentSelectionIds = Object.keys(rowSelection).sort().join(',');

      // 如果当前的选中状态 ID 组合，和上一次通知父组件的一样，就直接 return，不回调！
      if (currentSelectionIds === prevSelectionRef.current) {
        return;
      }
      // 记录这一次的 ID 组合
      prevSelectionRef.current = currentSelectionIds;

      const selectedData = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);
      onSelectionChange(selectedData);
    }
  }, [rowSelection, table, onSelectionChange]);

  const items = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => data.map((item) => String((item as any)[rowKey])),
    [data, rowKey],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const renderTableBody = () => {
    if (loading && data.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-40 text-center">
            <Loader2 className="animate-spin w-6 h-6 mx-auto text-gray-400" />
          </TableCell>
        </TableRow>
      );
    }

    if (data.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className="h-40 text-center text-gray-500"
          >
            No data available.
          </TableCell>
        </TableRow>
      );
    }

    const tableRows = table.getRowModel().rows.map((row) => {
      const cells = row.getVisibleCells().map((cell) => {
        return (
          <MemoizedCell
            key={cell.id}
            cell={cell}
            isSelected={row.getIsSelected()}
            isDisabled={!row.getCanSelect()}
          />
        );
      });

      return (
        <React.Fragment key={row.id}>
          <TableRowComponent
            row={row}
            enableDrag={enableDrag}
            onClick={() => onRowClick?.(row.original)}
          >
            {cells}
          </TableRowComponent>
          {row.getIsExpanded() && renderSubComponent && (
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
              <TableCell colSpan={columns.length}>
                {renderSubComponent(row)}
              </TableCell>
            </TableRow>
          )}
        </React.Fragment>
      );
    });

    if (enableDrag) {
      return (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {tableRows}
        </SortableContext>
      );
    }
    return tableRows;
  };

  const content = (
    <div className="overflow-x-auto rounded-xl">
      <Table className="border-separate border-spacing-0">
        <TableHeader className="bg-gray-50/60 dark:bg-white/5 [&_tr]:border-0">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="border-0">
              {hg.headers.map((h) => {
                return (
                  <TableHead key={h.id} style={{ width: h.getSize() }}>
                    <div
                      className={cn(
                        'flex items-center gap-2',
                        h.column.getCanSort() && 'cursor-pointer select-none',
                      )}
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && (
                        <ArrowUpDown size={14} className="text-gray-400" />
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="dark:divide-white/5 bg-white dark:bg-black/20 [&_tr:last-child_td]:border-b-0">
          {renderTableBody()}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      {enableDrag && onDragEnd ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          {content}
        </DndContext>
      ) : (
        content
      )}
      {pagination && <Pagination {...pagination} />}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TableRowComponent = ({
  row,
  onClick,
  enableDrag,
  children,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: Row<any>;
  onClick?: () => void;
  enableDrag?: boolean;
  children: React.ReactNode;
}) => {
  if (enableDrag) {
    return (
      <SortableRow row={row} onClick={onClick}>
        {children}
      </SortableRow>
    );
  }

  return (
    <TableRow
      className={cn(
        'group hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer',
        row.getIsSelected() && 'bg-blue-50/50 dark:bg-blue-900/10',
      )}
      onClick={onClick}
    >
      {children}
    </TableRow>
  );
};

// 只有当 cell 的值变化，或者它是“操作列”(没有值)时，才更新
const MemoizedCell = memo(
  ({
    cell,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cell: Cell<any, any>;
    isSelected: boolean;
    isDisabled: boolean;
  }) => {
    // 渲染逻辑移到这里
    const content = flexRender(cell.column.columnDef.cell, cell.getContext());
    const isDragHandle =
      cell.column.id === 'dragHandle' && React.isValidElement(content);

    return (
      <TableCell
        style={{ width: cell.column.getSize() }}
        className="border-b border-gray-100 dark:border-white/5"
      >
        {isDragHandle
          ? React.cloneElement(
              content as React.ReactElement,
              {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                'data-drag-handle': true,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any,
            )
          : content}
      </TableCell>
    );
  },
  (prev, next) => {
    // 1. 如果是 Select 列，直接对比传入的 boolean 值
    // 因为 boolean 是基础类型，不涉及引用问题，绝对准确

    if (next.cell.column.id === 'actions') {
      return false; // 强制返回 false，允许重渲染
    }

    if (next.cell.column.id === 'select') {
      return (
        prev.isSelected === next.isSelected &&
        prev.isDisabled === next.isDisabled
      );
    }

    // 3. 如果行数据没变，单元格肯定不用变 (继承 Row 的优化)
    if (prev.cell.row.original === next.cell.row.original) return true;

    // 4. 检查单元格的值(getValue)有没有变
    const prevValue = prev.cell.getValue();
    const nextValue = next.cell.getValue();

    return (
      prevValue === nextValue &&
      typeof prevValue !== 'object' &&
      prevValue !== undefined
    );
  },
);
MemoizedCell.displayName = 'MemoizedCell';
