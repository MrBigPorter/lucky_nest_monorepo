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
import { Badge } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { BannerFormModal } from '@/pages/banner/BannerFormModal.tsx';
import { BANNER_CATE, JUMP_CATE } from '@lucky/shared';
import { actSectionWithProducts } from '@/type/types.ts';

// --- 组件：可排序的行 (Draggable Row) ---
const SortableRow = ({
  children,
  row,
}: {
  children: React.ReactNode;
  row: Row<actSectionWithProducts>;
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

export const BannerManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(String(BANNER_CATE.HOME));
  const addToast = useToastStore((s) => s.addToast);

  // 1. 获取数据 (依赖 activeTab)
  const getTableData = async ({ current, pageSize }: any) => {
    const res = await bannerApi.getList({
      page: current,
      pageSize,
      //bannerCate: Number(activeTab), // 🌟 核心：只查当前 Tab 的数据
    });
    return { list: res.list, total: res.total };
  };

  const { tableProps, run, refresh } = useAntdTable(getTableData, {
    defaultPageSize: 20, // Banner 一般不多，一页显示多点方便排序
    refreshDeps: [activeTab], // 切换 Tab 自动刷新
  });

  const dataSource = (tableProps.dataSource || []) as any[];
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
  const columnHelper = createColumnHelper<any>();
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
        // 🌟 视觉优化：宽图预览
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

      {/* 顶部 Tabs 导航 */}
      {/*<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value={String(BANNER_CATE.HOME)}>
            🏠 Home Page
          </TabsTrigger>
          <TabsTrigger value={String(BANNER_CATE.ACTIVITY)}>
            🎉 Activity Page
          </TabsTrigger>
          <TabsTrigger value={String(BANNER_CATE.PRODUCT)}>
            📦 Product Page
          </TabsTrigger>
        </TabsList>
      </Tabs>*/}

      <div className="bg-white dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
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
        </DndContext>
      </div>
    </div>
  );
};
