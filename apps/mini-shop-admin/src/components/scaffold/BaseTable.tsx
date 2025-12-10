import React, { memo, useMemo, useState } from 'react';
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

// --- BaseTable Props ---
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
}: BaseTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols = [...propColumns] as ColumnDef<T, any>[];

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
    enableRowSelection: true,
  });

  React.useEffect(() => {
    if (onSelectionChange) {
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
        //  先计算 content，再判断是否是 Element，最后 clone
        const content = flexRender(
          cell.column.columnDef.cell,
          cell.getContext(),
        );

        return (
          <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
            {cell.column.id === 'dragHandle' && React.isValidElement(content)
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TableRowComponent = memo(
  ({
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
  },
  (prev, next) => {
    const dataChanged = prev.row.original !== next.row.original;
    const selectionChanged =
      prev.row.getIsSelected() !== next.row.getIsSelected();
    const expandedChanged =
      prev.row.getIsExpanded() !== next.row.getIsExpanded();
    return !(dataChanged || selectionChanged || expandedChanged);
  },
);

TableRowComponent.displayName = 'TableRowComponent';
