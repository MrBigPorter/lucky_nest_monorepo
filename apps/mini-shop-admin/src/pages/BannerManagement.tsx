import React, { useCallback, useMemo } from 'react';
import { useAntdTable, useRequest } from 'ahooks';
import { bannerApi } from '@/api';
import { Button, ModalManager } from '@repo/ui';
import { createColumnHelper } from '@tanstack/react-table';
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
import { JUMP_CATE } from '@lucky/shared';
import { Banner, BannerListParams } from '@/type/types.ts';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm.tsx';
import { BaseTable } from '@/components/scaffold/BaseTable.tsx';
import { PageHeader } from '@/components/scaffold/PageHeader.tsx';
import { SmartImage } from '@/components/ui/SmartImage.tsx';

type BannerSearchForm = {
  title: string;
  bannerCate: string;
};

export const BannerManagement: React.FC = () => {
  const addToast = useToastStore((s) => s.addToast);

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
    mutate,
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
  const handleSearch = (values: BannerSearchForm) => {
    // 自动重置到第一页，并带上所有条件
    run({ current: 1, pageSize: 10 }, values);
  };

  const dataSource = useMemo(
    () => tableProps.dataSource || [],
    [tableProps.dataSource],
  );
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
    onBefore: ([id, state]) => {
      mutate((old) => {
        if (!old) return old;
        return {
          ...old,
          list: old.list.map((item) =>
            item.id === id ? { ...item, state } : item,
          ),
        };
      });
    },
    onSuccess: () => {
      addToast('success', 'Status updated');
    },
    onError: () => {
      // Revert on error
      refresh();
    },
  });

  // --- Handlers ---
  const handleOpenModal = useCallback(
    (record?: Banner) => {
      ModalManager.open({
        title: record ? 'Edit Banner' : 'Create Banner',
        renderChildren: ({ close, confirm }) => (
          <BannerFormModal
            key={record ? `edit-${record.id}` : 'create-banner'}
            close={close}
            confirm={() => {
              confirm();
              refresh();
            }}
            editingData={record}
          />
        ),
      });
    },
    [refresh],
  );

  const handleDelete = useCallback(
    (record: Banner) => {
      ModalManager.open({
        title: 'Delete Banner?',
        content: 'This action cannot be undone.',
        confirmText: 'Delete',
        onConfirm: () => deleteBanner(record.id),
      });
    },
    [deleteBanner],
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Banner>();
    return [
      columnHelper.display({
        id: 'dragHandle',
        header: '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          <div className="w-32 h-16 bg-gray-100 rounded-md overflow-hidden  relative group">
            <SmartImage
              src={info.getValue()}
              width={128}
              height={64}
              className="w-full h-full object-cover"
              alt=""
            />
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
  }, [handleDelete, handleOpenModal, updateStatus]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banner Management"
        description="Manage the banners displayed in the mini shop."
        buttonText="Create Banner"
        buttonOnClick={() => handleOpenModal()}
      />

      <Card>
        <div className="space-y-3 mb-6">
          <SchemaSearchForm<BannerSearchForm>
            schema={[
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
            ]}
            onSearch={handleSearch}
            onReset={reset}
          />
        </div>
        <BaseTable
          data={dataSource}
          rowKey="id"
          columns={columns}
          pagination={{
            ...tableProps.pagination,
            onChange: (page, pageSize) => {
              tableProps.onChange?.(page, pageSize);
            },
          }}
        />
      </Card>
    </div>
  );
};
