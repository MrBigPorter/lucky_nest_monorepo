import React, { useMemo, useState } from 'react';
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
import { Pagination } from '@/components/Pagination';
import { Loader2, ArrowUpDown, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@repo/ui';

// --- 内部组件：可排序行 ---
const SortableRow = ({
  row,
  children,
  className,
  onClick,
}: {
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
  } = useSortable({ id: row.original.id });

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
        isDragging && 'bg-blue-50 dark:bg-blue-900/20 shadow-lg',
      )}
      onClick={onClick}
      {...attributes}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props['data-drag-handle']) {
          return React.cloneElement(child, { listeners } as any);
        }
        return child;
      })}
    </tr>
  );
};

// --- BaseTable Props ---
interface BaseTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  loading?: boolean;
  /** 唯一主键字段名，默认 'id' */
  rowKey?: keyof T;

  // 分页
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };

  // 功能开关
  enableDrag?: boolean; // 开启拖拽
  onDragEnd?: (event: DragEndEvent) => void;

  selectable?: boolean; // 开启多选
  onSelectionChange?: (selectedRows: T[]) => void; // 多选回调

  expandable?: boolean; // 开启展开
  renderSubComponent?: (row: Row<T>) => React.ReactNode; // 展开的内容

  onRowClick?: (row: T) => void; // 行点击
}

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
}: BaseTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 1. 动态注入 Select 列和 Expand 列
  const columns = useMemo(() => {
    const cols = [...propColumns];

    // 如果开启多选，在最前面插入 Checkbox 列
    if (selectable) {
      cols.unshift({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
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

    // 如果开启展开，在最前面插入箭头列 (或者合并到 Select 后面)
    if (expandable) {
      cols.unshift({
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          return row.getCanExpand() ? (
            <button
              onClick={(e) => {
                e.stopPropagation(); // 防止触发 onRowClick
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
    getSortedRowModel: getSortedRowModel(), // 开启排序
    getExpandedRowModel: getExpandedRowModel(), // 开启展开
    getRowId: (row) => String(row[rowKey]), // 自定义主键
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      setRowSelection(updater);
      // Hack: React Table 的 updater 可能是函数，我们需要在下一次 render 拿到值
      // 这里建议使用 useEffect 监听 rowSelection 来触发外部回调，或者简单处理
    },
    enableRowSelection: true,
  });

  // 监听多选变化，通知父组件
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedData = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);
      onSelectionChange(selectedData);
    }
  }, [rowSelection, table, onSelectionChange]);

  const items = useMemo(() => data.map((item) => item[rowKey]), [data, rowKey]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 渲染逻辑
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

    const rows = table.getRowModel().rows.map((row) => {
      const cells = row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
          {React.cloneElement(
            // 标记 DragHandle 列
            flexRender(
              cell.column.columnDef.cell,
              cell.getContext(),
            ) as React.ReactElement,
            { 'data-drag-handle': cell.column.id === 'dragHandle' }, // 标记
          )}
        </TableCell>
      ));

      const rowProps = {
        key: row.id,
        className: cn(
          'group hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer',
          row.getIsSelected() && 'bg-blue-50/50 dark:bg-blue-900/10',
        ),
        onClick: () => onRowClick?.(row.original),
      };

      const RowComponent = enableDrag ? (
        <SortableRow row={row} {...rowProps}>
          {cells}
        </SortableRow>
      ) : (
        <TableRow {...rowProps}>{cells}</TableRow>
      );

      return (
        <React.Fragment key={row.id}>
          {RowComponent}
          {/* 渲染展开的内容 */}
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
          {rows}
        </SortableContext>
      );
    }
    return rows;
  };

  const content = (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/10">
      <Table>
        <TableHeader className="bg-gray-50/60 dark:bg-white/5">
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
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
                      {/* 排序图标 */}
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
        <TableBody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-black/20">
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
