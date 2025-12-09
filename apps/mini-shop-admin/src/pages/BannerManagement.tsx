import React, { useState, useMemo } from 'react';
import { useAntdTable, useRequest } from 'ahooks';
import { bannerApi } from '@/api';
import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ModalManager,
} from '@repo/ui';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  Row,
  useReactTable,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import {
  Edit3,
  Trash2,
  GripVertical,
  ExternalLink,
  Box,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { Badge, Card } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { BannerFormModal } from '@/pages/banner/BannerFormModal.tsx';
import { BANNER_CATE, JUMP_CATE } from '@lucky/shared';
import { Banner, BannerListParams } from '@/type/types.ts';
import { SchemaSearchForm } from '@/components/SchemaSearchForm.tsx';
import { SearchFieldSchema } from '@/type/search.ts';

// --- 组件：可排序的行 (Draggable Row) ---
const SortableRow = ({
  children,
  row,
}: {
  children: React.ReactNode;
  row: Row<Banner>;
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
    // transform: CSS.Transform.toString(transform),
    transform: transform,
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

type BannerSearchForm = {
  title: string;
  bannerCate: string;
};

export const BannerManagement: React.FC = () => {
  const [activeTab] = useState<string>(String(BANNER_CATE.HOME));
  const addToast = useToastStore((s) => s.addToast);

  const searchSchema: SearchFieldSchema[] = useMemo(
    () => [
      {
        type: 'input',
        key: 'title',
        label: 'Search Title',
        placeholder: 'Enter keywords...',
      },
      {
        type: 'select',
        key: 'bannerCate',
        label: 'Position',
        defaultValue: 'ALL', // 支持默认值
        options: [
          { label: 'All', value: 'ALL' },
          { label: 'Home', value: '1' },
          { label: 'Product', value: '2' },
        ],
      },
    ],
    [],
  );

  const getTableData = async (
    {
      current,
      pageSize,
    }: {
      current: number;
      pageSize: number;
    },
    formData: BannerSearchForm,
  ) => {
    const params: BannerListParams = {
      page: current,
      pageSize,
    };
    if (formData?.bannerCate && formData?.bannerCate !== 'ALL') {
      params.bannerCate = Number(formData.bannerCate);
    }
    if (formData?.title) {
      params.title = formData.title;
    }
    const res = await bannerApi.getList(params);
    return { list: res.list, total: res.total };
  };

  const {
    tableProps,
    refresh,
    run,
    search: { reset },
  } = useAntdTable(getTableData, {
    defaultPageSize: 20,
    defaultParams: [
      { current: 1, pageSize: 10 },
      {
        title: '',
        bannerCate: 'ALL',
      },
    ],
  });

  // 搜索回调：直接拿到所有值
  const handleSearch = (values: any) => {
    // 自动重置到第一页，并带上所有条件
    run({ current: 1, pageSize: 10 }, values);
  };

  const dataSource = useMemo(
    () => tableProps.dataSource || [],
    [tableProps.dataSource],
  );
  const items = useMemo(() => dataSource.map((x) => x.id), [dataSource]);

  // --- Actions ---
  const { run: deleteBanner } = useRequest(bannerApi.delete, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Deleted');
      refresh();
    },
  });

  const { run: updateStatus } = useRequest(bannerApi.updateState, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Status updated');
      refresh();
    },
  });

  // 排序逻辑 (这里简化，实际需要调 updateSortOrder 接口)
  const handleDragEnd = (event: any) => {
    // ... 复用 ActSection 的排序逻辑，调用后端 sort 接口
    console.log('Sort changed', event);
  };

  // --- Handlers ---
  const handleOpenModal = (record?: any) => {
    ModalManager.open({
      title: record ? 'Edit Banner' : 'Create Banner',
      renderChildren: ({ close, confirm }) => (
        <BannerFormModal
          close={close}
          confirm={() => {
            confirm();
            refresh();
          }}
          editingData={record}
          defaultCate={Number(activeTab)}
        />
      ),
    });
  };

  const handleDelete = (record: any) => {
    ModalManager.open({
      title: 'Delete Banner?',
      content: 'This action cannot be undone.',
      confirmText: 'Delete',
      onConfirm: () => deleteBanner(record.id),
    });
  };

  // --- Columns ---
  const columnHelper = createColumnHelper<Banner>();
  const columns = [
    columnHelper.display({
      id: 'dragHandle',
      header: '',
      cell: ({ listeners }: any) => (
        <div
          {...listeners}
          className="cursor-move text-gray-400 hover:text-blue-500"
        >
          <GripVertical size={16} />
        </div>
      ),
      size: 40,
    }),
    columnHelper.accessor('bannerImgUrl', {
      header: 'Visual',
      cell: (info) => (
        <div className="w-32 h-16 bg-gray-100 rounded-md overflow-hidden border border-gray-200 relative group">
          <img src={info.getValue()} className="w-full h-full object-cover" />
          {info.row.original.fileType === 2 && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs">
              Video
            </div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('title', {
      header: 'Info',
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue()}</div>
          <div className="text-xs text-gray-500 mt-1">
            {/* 智能排期展示 */}
            {info.row.original.activityAtStart
              ? `${new Date(info.row.original.activityAtStart).toLocaleDateString()} - ${new Date(info.row.original.activityAtEnd).toLocaleDateString()}`
              : 'Permanent (No expiry)'}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('jumpCate', {
      header: 'Target',
      cell: (info) => {
        const type = info.getValue();
        if (type === JUMP_CATE.EXTERNAL)
          return (
            <div className="flex items-center gap-1 text-blue-600 text-xs">
              <ExternalLink size={12} /> Web Link
            </div>
          );
        if (type === JUMP_CATE.TREASURE)
          return (
            <div className="flex items-center gap-1 text-purple-600 text-xs">
              <Box size={12} /> Product
            </div>
          );
        return <span className="text-gray-400 text-xs">No Action</span>;
      },
    }),
    columnHelper.accessor('state', {
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
        <div className="flex  gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              updateStatus(
                info.row.original.id,
                info.row.original.state === 1 ? 0 : 1,
              )
            }
          >
            {info.row.original.state === 1 ? (
              <Ban size={14} />
            ) : (
              <CheckCircle size={14} />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenModal(info.row.original)}
          >
            <Edit3 size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(info.row.original)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: dataSource,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Banner Management</h1>
          <p className="text-gray-500 text-sm">
            Manage carousels and ad spaces
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>+ New Banner</Button>
      </div>

      <Card>
        <div className="space-y-3 mb-6">
          <SchemaSearchForm
            schema={searchSchema}
            onSearch={handleSearch}
            onReset={reset}
          />
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto rounded-xl ">
            <Table>
              <TableHeader className="bg-gray-50/60 dark:bg-white/5">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead
                        key={h.id}
                        className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
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
                    <SortableRow key={row.id} row={row}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {React.cloneElement(
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            ) as React.ReactElement,
                            { cell },
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
                      className="h-24 text-center text-gray-500"
                    >
                      No banners in this section.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DndContext>
      </Card>
    </div>
  );
};
