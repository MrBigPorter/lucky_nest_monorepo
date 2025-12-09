import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  Ban,
  CheckCircle,
  GripVertical,
  LayoutGrid,
  Image as ImageIcon,
  BadgeIndianRupee,
  ArrowBigDownDash,
} from 'lucide-react';
import { Card, Badge, Input } from '@/components/UIComponents';
import { useAntdTable, useRequest } from 'ahooks';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  Row,
} from '@tanstack/react-table';
// 引入 dnd-kit 相关组件
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
import { useToastStore } from '@/store/useToastStore';
import { ActSection, actSectionWithProducts } from '@/type/types.ts';
import { actSectionApi } from '@/api';
import { ActSectionBindProductModal } from '@/pages/act-section/ActSectionBindProductModal.tsx';
import { ProductSelectorModal } from '@/pages/act-section/ProductSelectorModal.tsx';

// --- 组件：可排序的行 (Draggable Row) ---
const SortableRow = ({
  children,
  row,
}: {
  children: React.ReactNode;
  row: Row<ActSection>;
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
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto', // 拖拽时层级提高
    position: 'relative' as const,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-150 ${
        isDragging ? 'bg-blue-50 dark:bg-blue-900/20 shadow-lg' : ''
      }`}
      {...attributes} // 将属性应用到行
    >
      {/* 这里我们不把 listeners 加到 tr 上，
         而是通过 Context 传给具体的 DragHandle 单元格，
         这样用户只能通过拖拽手柄排序，不影响复制文字
      */}
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement(child) &&
          child.props.cell?.column?.id === 'dragHandle'
        ) {
          return React.cloneElement(child, { listeners } as any);
        }
        return child;
      })}
    </tr>
  );
};

// --- 主页面组件 ---
export const ActSectionManagement: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ActSection | null>(null);

  // 筛选状态
  const [filters, setFilters] = useState<{
    title: string;
    status: string | number;
  }>({
    title: '',
    status: 'ALL',
  });

  // 获取数据 (useAntdTable 模式)
  const getTableData = async ({
    current,
    pageSize,
  }: {
    current: number;
    pageSize: number;
  }) => {
    const res = await actSectionApi.getList({
      page: current,
      pageSize,
      //title: formData.title,
      //status: formData.status === 'ALL' ? undefined : Number(formData.status),
    });
    return { list: res.list, total: res.total };
  };

  const {
    tableProps,
    run,
    refresh,
    search: { reset },
  } = useAntdTable(getTableData, {
    defaultPageSize: 10,
    defaultParams: [
      { current: 1, pageSize: 10 },
      { title: '', status: 'ALL' },
    ],
  });

  const dataSource = (tableProps.dataSource || []) as ActSection[];

  // 乐观更新：为了拖拽流畅，我们需要维护一个本地的 data state，虽然 useAntdTable 也有，但我们需要实时修改顺序
  // 注意：实际开发中，可以直接修改 dataSource，但 readonly 可能会报错，最好 copy 一份
  const items = useMemo(() => dataSource.map((x) => x.id), [dataSource]);

  // --- API Actions ---

  const updateStatus = useRequest(actSectionApi.update, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Section status updated');
      refresh();
    },
  });

  const deleteSection = useRequest(actSectionApi.delete, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Section deleted');
      refresh();
    },
  });

  const updateSortOrder = useRequest(actSectionApi.updateSortOrder, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Order saved');
      // 排序后最好刷新一下，确保后端返回的顺序一致
      refresh();
    },
  });

  // --- Handlers ---

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = dataSource.findIndex((item) => item.id === active.id);
      const newIndex = dataSource.findIndex((item) => item.id === over?.id);

      // 1. 前端UI立刻更新 (通过直接修改 cache 或者重新触发渲染，这里我们简单处理，依赖 refresh)
      // 在复杂场景下，你应该先 setData(arrayMove(...)) 实现无闪烁

      const newOrderIds = arrayMove(dataSource, oldIndex, newIndex).map(
        (item) => item.id,
      );

      // 2. 发送请求给后端
      updateSortOrder.run({ ids: newOrderIds });
    }
  };

  const handleToggleStatus = (record: ActSection) => {
    updateStatus.run(record.id, { status: record.status === 1 ? 0 : 1 });
  };

  const handleDelete = (record: ActSection) => {
    ModalManager.open({
      title: 'Delete Section?',
      content: `Are you sure you want to delete "${record.title}"?`,
      confirmText: 'Delete',
      onConfirm: () => deleteSection.run(record.id),
    });
  };

  const handleEdit = async (record: ActSection) => {
    ModalManager.open({
      title: 'Edit Product Section',
      renderChildren: ({ close, confirm }) => (
        <ProductSelectorModal
          close={close}
          confirm={confirm}
          editingData={record}
        />
      ),
      onConfirm: refresh,
    });
  };

  const handleBindProduct = async (record: actSectionWithProducts) => {
    ModalManager.open({
      title: 'Bind Products',
      renderChildren: ({ close, confirm }) => (
        <ActSectionBindProductModal
          onClose={close}
          onConfirm={confirm}
          editingData={record}
        />
      ),
      onConfirm: refresh,
    });
  };

  const handleCreate = () => {
    ModalManager.open({
      title: 'Create New Section',
      renderChildren: ({ close, confirm }) => (
        <ProductSelectorModal close={close} confirm={confirm} />
      ),
      onConfirm: refresh,
    });
  };

  // --- DnD Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // --- Table Columns ---
  const columnHelper = createColumnHelper<ActSection>();

  const columns = [
    // 1. 拖拽手柄列
    columnHelper.display({
      id: 'dragHandle',
      header: '',
      cell: ({ row, listeners }: any) => (
        <div
          {...listeners}
          className="cursor-move text-gray-400 hover:text-gray-600 flex items-center justify-center"
        >
          <GripVertical size={16} />
        </div>
      ),
      size: 40,
    }),
    columnHelper.accessor('title', {
      header: 'Section Title',
      cell: (info) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {info.getValue()}
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {info.row.original.key}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('imgStyleType', {
      header: 'Style',
      cell: (info) => {
        const val = info.getValue();
        // 简单映射，你可以根据实际 UI 需求修改
        const label =
          val === 0 ? 'Carousel' : val === 1 ? 'Grid (2)' : 'Grid (3)';
        const icon =
          val === 0 ? <ImageIcon size={14} /> : <LayoutGrid size={14} />;
        return (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
            {icon} <span>{label}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('_count.items', {
      header: 'Items',
      cell: (info) => (
        <Badge color="gray">
          {info.row.original.items?.length || 0} Products
        </Badge>
      ),
    }),
    columnHelper.accessor('startAt', {
      header: 'Schedule',
      cell: (info) => {
        const start = info.getValue()
          ? new Date(info.getValue()!).toLocaleDateString()
          : 'Now';
        const end = info.row.original.endAt
          ? new Date(info.row.original.endAt!).toLocaleDateString()
          : 'Forever';
        return (
          <span className="text-xs text-gray-500">
            {start} - {end}
          </span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <Badge color={info.getValue() === 1 ? 'green' : 'gray'}>
          {info.getValue() === 1 ? 'Active' : 'Disabled'}
        </Badge>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(info.row.original)}
          >
            <Edit3 size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBindProduct(info.row.original)}
          >
            <ArrowBigDownDash size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(info.row.original)}
            isLoading={
              updateStatus.loading &&
              updateStatus.params[0] === info.row.original.id
            }
          >
            {info.row.original.status === 1 ? (
              <Ban size={16} className="text-red-500" />
            ) : (
              <CheckCircle size={16} className="text-green-500" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(info.row.original)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: dataSource,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id, // 这一步对 DnD 很重要
  });

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Activity Sections
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage homepage sections and product layout
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={18} /> New Section
        </Button>
      </div>

      <Card>
        {/* Filter Bar (Same logic as ProductManagement) */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Search Title"
              value={filters.title}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, title: e.target.value }))
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                e.key === 'Enter' && run({ current: 1, pageSize: 10 }, filters)
              }
            />
            <Select
              label="Status"
              value={String(filters.status)}
              onChange={(val) =>
                setFilters((prev) => ({ ...prev, status: val }))
              }
              options={[
                { label: 'All Status', value: 'ALL' },
                { label: 'Active', value: '1' },
                { label: 'Disabled', value: '0' },
              ]}
            />
            <div className="flex items-end">
              <Button
                onClick={() => run({ current: 1, pageSize: 10 }, filters)}
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* DnD Context & Table */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-white/5">
            <Table className="text-left">
              <TableHeader className="bg-gray-50/60 dark:bg-white/5">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-black/20">
                <SortableContext
                  items={items}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    // 这里我们渲染自定义的 SortableRow
                    <SortableRow key={row.id} row={row}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3 text-sm">
                          {/* 将 listeners 传递给 cell，以便 dragHandle 可以接收 */}
                          {React.cloneElement(
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            ) as React.ReactElement,
                            { cell }, // 传递 cell info
                          )}
                        </TableCell>
                      ))}
                    </SortableRow>
                  ))}
                </SortableContext>

                {dataSource.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="py-8 text-center text-gray-500"
                    >
                      No sections found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DndContext>

        {/* Pagination (Copy from your existing code) */}
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          {/* ... standard pagination code ... */}
          <div>Total {tableProps.pagination.total} items</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={tableProps.pagination.current === 1}
              onClick={() =>
                tableProps.pagination.onChange(
                  tableProps.pagination.current - 1,
                  10,
                )
              }
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                tableProps.pagination.current * 10 >=
                tableProps.pagination.total
              }
              onClick={() =>
                tableProps.pagination.onChange(
                  tableProps.pagination.current + 1,
                  10,
                )
              }
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
