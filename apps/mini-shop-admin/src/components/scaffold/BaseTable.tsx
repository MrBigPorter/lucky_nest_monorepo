import React, { useMemo, useRef, useState } from 'react';
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

// ----------------------------------------------------------------------------
// 1. 内部组件：可排序行包装器 (DnD Logic Wrapper)
// ----------------------------------------------------------------------------
const SortableRowWrapper = ({
  rowId,
  children,
  className,
  onClick,
  isDragging: isDraggingProp, // 假如外部想控制样式
}: {
  rowId: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isDragging?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rowId });

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
        (isDragging || isDraggingProp) &&
          'bg-blue-50 dark:bg-blue-900/20 shadow-lg relative z-10',
      )}
      onClick={onClick}
      {...attributes}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const childProps = child.props as Record<string, any>;
          // 只有标记了 data-drag-handle 的单元格才绑定 listeners
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

// ----------------------------------------------------------------------------
// 2. 内部组件：表头 (Header) - 只有排序变化时才刷新
// ----------------------------------------------------------------------------
const TableHeaderComponent = React.memo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ table }: { table: any }) => {
    return (
      <TableHeader className="bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm [&_tr]:border-0">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {table.getHeaderGroups().map((hg: any) => (
          <TableRow key={hg.id} className="border-0">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {hg.headers.map((h: any) => {
              return (
                <TableHead
                  key={h.id}
                  style={{ width: h.getSize() }}
                  className="h-11 font-medium text-gray-500 dark:text-gray-400"
                >
                  <div
                    className={cn(
                      'flex items-center gap-2',
                      h.column.getCanSort() &&
                        'cursor-pointer select-none hover:text-gray-900 dark:hover:text-white transition-colors',
                    )}
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getCanSort() && (
                      <ArrowUpDown size={13} className="opacity-50" />
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
    );
  },
  (prev, next) => {
    // 比较 Sorting 状态，如果没变，就不刷新表头
    return (
      prev.table.getState().sorting === next.table.getState().sorting &&
      prev.table.options.columns === next.table.options.columns
    );
  },
);
TableHeaderComponent.displayName = 'TableHeaderComponent';

// ----------------------------------------------------------------------------
// 3. 内部组件：行实现 (Row Implementation)
// ----------------------------------------------------------------------------
const TableRowImpl = ({
  row,
  enableDrag,
  onClick,
  renderSubComponent,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: Row<any>;
  enableDrag?: boolean;
  onClick?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderSubComponent?: (row: Row<any>) => React.ReactNode;
}) => {
  // 1. 渲染当前行的 Cells
  const cells = row.getVisibleCells().map((cell) => {
    const content = flexRender(cell.column.columnDef.cell, cell.getContext());
    const isDragHandle =
      cell.column.id === 'dragHandle' && React.isValidElement(content);

    return (
      <TableCell
        key={cell.id}
        style={{ width: cell.column.getSize() }}
        className="border-b border-gray-100 dark:border-white/5 py-3 transition-colors"
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
  });

  // 2. 包装逻辑 (修复：已移除多余的 content 变量)
  return (
    <>
      {enableDrag ? (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <SortableRowWrapper rowId={(row.original as any).id} onClick={onClick}>
          {cells}
        </SortableRowWrapper>
      ) : (
        <TableRow
          className={cn(
            'group hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors',
            row.getIsSelected() && 'bg-blue-50/50 dark:bg-blue-900/10',
          )}
          onClick={onClick}
        >
          {cells}
        </TableRow>
      )}

      {/* 3. 展开行逻辑 (如果展开了，这一行肯定需要重绘，不需要 memo) */}
      {row.getIsExpanded() && renderSubComponent && (
        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
          <TableCell
            colSpan={row.getVisibleCells().length}
            className="p-0 border-b"
          >
            {renderSubComponent(row)}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

// 🔥 核心优化：加上 memo，切断“全表刷新”的传染链
const MemoizedTableRow = React.memo(TableRowImpl, (prev, next) => {
  // 只有这三个状态变了，才允许重渲染这一行
  const isDataSame = prev.row.original === next.row.original;
  const isSelectionSame = prev.row.getIsSelected() === next.row.getIsSelected();
  const isExpandedSame = prev.row.getIsExpanded() === next.row.getIsExpanded();

  return isDataSame && isSelectionSame && isExpandedSame;
});
MemoizedTableRow.displayName = 'MemoizedTableRow';

// ----------------------------------------------------------------------------
// 4. 主组件：BaseTable
// ----------------------------------------------------------------------------
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

  // --- 构造 Columns ---
  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols = [...propColumns] as ColumnDef<T, any>[];

    // 插入 Select 列
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
            const newSelection = { ...table.getState().rowSelection };
            const pageRows = table.getRowModel().rows;

            pageRows.forEach((row) => {
              if (row.getCanSelect()) {
                if (val) {
                  newSelection[row.id] = true;
                } else {
                  delete newSelection[row.id];
                }
              }
            });
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

    // 插入 Expand 列
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
              className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
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
    onRowSelectionChange: setRowSelection,
    enableRowSelection: (row) => {
      const id = String(row.original[rowKey]);
      return !(disabledRowKeys && disabledRowKeys.includes(id));
    },
  });

  // --- Side Effects ---
  React.useEffect(() => {
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
      const currentSelectionIds = Object.keys(rowSelection).sort().join(',');
      if (currentSelectionIds === prevSelectionRef.current) {
        return;
      }
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

  // --- Render Body ---
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

    const rows = table
      .getRowModel()
      .rows.map((row) => (
        <MemoizedTableRow
          key={row.id}
          row={row}
          enableDrag={enableDrag}
          onClick={() => onRowClick?.(row.original)}
          renderSubComponent={renderSubComponent}
        />
      ));

    if (enableDrag) {
      return (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {rows}
        </SortableContext>
      );
    }
    return rows;
  };

  const content = (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/10">
      <Table className="border-separate border-spacing-0 w-full">
        {/* 使用 MemoizedTableHeader */}
        <TableHeaderComponent table={table} />

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
      {pagination && (
        <div className="py-2">
          <Pagination {...pagination} />
        </div>
      )}
    </div>
  );
};
