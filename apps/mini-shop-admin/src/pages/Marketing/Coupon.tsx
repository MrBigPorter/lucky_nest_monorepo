import React, { useMemo, useCallback } from 'react';
import { useAntdTable, useRequest } from 'ahooks';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Edit3,
  Trash2,
  Tag,
  Calendar,
  Percent,
  Hash,
  Copy,
  Plus,
} from 'lucide-react';

import { Button, ModalManager } from '@repo/ui';
import { Badge, Card } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm.tsx';
import { BaseTable } from '@/components/scaffold/BaseTable.tsx';
import { PageHeader } from '@/components/scaffold/PageHeader.tsx';

// 引入你之前定义的常量和 Modal
import {
  CreateCouponModal, // 假设这是你上一段代码里的 Modal 组件
} from './CreateCouponModal'; // 请确保路径正确

import {
  COUPON_STATUS,
  COUPON_TYPE,
  COUPON_TYPE_OPTIONS,
  DISCOUNT_TYPE,
  ISSUE_TYPE,
  VALID_TYPE,
} from '@lucky/shared';
import { Coupon } from '@/type/types.ts';
import { couponApi } from '@/api';

// 这里模拟一个 API，实际项目中替换为 import { couponApi } from '@/api';
const mockCouponApi = {
  getList: async (params: any) => {
    console.log('Fetching coupons with params:', params);
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));
    // 模拟返回数据
    return {
      list: Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `coupon-${i}`,
          couponName: `New User Promo ${i}`,
          couponCode: i % 2 === 0 ? `VIP${i}00` : null,
          couponType:
            i % 3 === 0 ? COUPON_TYPE.FULL_REDUCTION : COUPON_TYPE.DISCOUNT,
          discountType:
            i % 2 === 0 ? DISCOUNT_TYPE.FIXED_AMOUNT : DISCOUNT_TYPE.PERCENTAGE,
          discountValue: i % 2 === 0 ? 100 : 0.15,
          minPurchase: 500,
          issueType: ISSUE_TYPE.CLAIM,
          totalQuantity: 1000,
          usedCount: 50 * i,
          perUserLimit: 1,
          validType: VALID_TYPE.RANGE,
          validStartAt: new Date().toISOString(),
          validEndAt: new Date(Date.now() + 86400000 * 7).toISOString(),
          status: i % 4 === 0 ? 0 : 1, // 0 disabled, 1 active
          createdAt: new Date().toISOString(),
        })),
      total: 100,
    };
  },
  delete: async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log('Deleted', id);
    return true;
  },
  updateStatus: async (id: string, status: number) => {
    console.log('Updated status', id, status);
    return true;
  },
};

// 搜索表单类型定义
type CouponSearchForm = {
  keyword: string;
  status: string; // 'ALL' | '1' | '0'
  couponType: string;
};

// --- Helper Components ---

const StatusBadge: React.FC<{ status: number }> = ({ status }) => (
  <Badge color={status === 1 ? 'green' : 'gray'}>
    {status === 1 ? 'Active' : 'Disabled'}
  </Badge>
);

const formatCurrency = (n?: number | null) =>
  typeof n === 'number' ? `₱${n.toFixed(2)}` : '-';

const formatDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString() : '-';

export const CouponList: React.FC = () => {
  const addToast = useToastStore((s) => s.addToast);

  // 1. 数据获取逻辑 (useAntdTable)
  const getTableData = async (
    { current, pageSize }: { current: number; pageSize: number },
    formData: CouponSearchForm,
  ) => {
    // 组装 API 参数
    const params: any = {
      page: current,
      pageSize,
      keyword: formData.keyword,
    };
    if (formData.status && formData.status !== 'ALL') {
      params.status = Number(formData.status);
    }
    if (formData.couponType && formData.couponType !== 'ALL') {
      params.couponType = Number(formData.couponType);
    }

    const res = await couponApi.getList(params);
    return { list: res.list, total: res.total };
  };

  const {
    tableProps,
    refresh,
    run,
    search: { reset },
  } = useAntdTable(getTableData, {
    defaultPageSize: 10,
    defaultParams: [
      { current: 1, pageSize: 10 },
      { keyword: '', status: 'ALL', couponType: 'ALL' },
    ],
  });

  // 搜索处理
  const handleSearch = (values: CouponSearchForm) => {
    run({ current: 1, pageSize: 10 }, values);
  };

  const dataSource = useMemo(
    () => tableProps.dataSource || [],
    [tableProps.dataSource],
  );

  // 2. 操作逻辑 (Delete / Create / Edit)
  const { run: deleteCoupon } = useRequest(couponApi.delete, {
    manual: true,
    onSuccess: () => {
      addToast('success', 'Coupon deleted');
      refresh();
    },
  });

  const handleOpenModal = useCallback(
    (record?: Coupon) => {
      ModalManager.open({
        title: record ? 'Edit Coupon' : 'Create Coupon',
        // 这里的 CreateCouponModal 就是你上一段代码里的组件
        renderChildren: ({ close, confirm }) => (
          <CreateCouponModal
            close={close}
            confirm={() => {
              confirm(); // 关闭弹窗
              refresh(); // 刷新表格
              addToast(
                'success',
                record ? 'Updated successfully' : 'Created successfully',
              );
            }}
            // 注意：CreateCouponModal 需要支持 initialValues 或者 editingData 才能做编辑回显
            // editingData={record}
          />
        ),
      });
    },
    [refresh, addToast],
  );

  const handleDelete = useCallback(
    (record: Coupon) => {
      ModalManager.open({
        title: 'Delete Coupon?',
        content: `Are you sure you want to delete "${record.couponName}"?`,
        confirmText: 'Delete',
        onConfirm: () => deleteCoupon(record.id),
      });
    },
    [deleteCoupon],
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Coupon>();
    return [
      columnHelper.accessor('couponName', {
        header: 'Coupon Info',
        cell: (info) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {info.getValue()}
              </span>
              {info.row.original.couponCode && (
                <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <Hash size={10} className="mr-0.5" />
                  {info.row.original.couponCode}
                </span>
              )}
            </div>
            <div className="mt-1 flex gap-2">
              <StatusBadge status={info.row.original.status} />
              {/* 这里可以加更多 Badge，比如 IssueType */}
              <Badge color="blue" variant="outline">
                {info.row.original.issueType === ISSUE_TYPE.CLAIM
                  ? 'Claim'
                  : 'System'}
              </Badge>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('discountValue', {
        header: 'Benefit',
        cell: (info) => {
          const { discountType, minPurchase } = info.row.original;
          const isPercent = discountType === DISCOUNT_TYPE.PERCENTAGE;
          const valueStr = isPercent
            ? `${(info.getValue() * 100).toFixed(0)}% OFF`
            : `-${formatCurrency(info.getValue())}`;

          return (
            <div className="flex flex-col">
              <span className="font-semibold text-pink-600">{valueStr}</span>
              <span className="text-xs text-gray-500">
                Min: {formatCurrency(minPurchase)}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'usage',
        header: 'Usage',
        cell: (info) => {
          const { usedCount, totalQuantity } = info.row.original;
          const percent =
            totalQuantity > 0
              ? Math.round((usedCount / totalQuantity) * 100)
              : 0;
          return (
            <div className="w-24">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Used</span>
                <span>{percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {usedCount} / {totalQuantity === -1 ? '∞' : totalQuantity}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor('validType', {
        header: 'Validity',
        cell: (info) => {
          const row = info.row.original;
          if (row.validType === VALID_TYPE.RANGE) {
            return (
              <div className="text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar size={12} className="text-gray-400" />
                  {formatDate(row.validStartAt)}
                </div>
                <div className="pl-4 text-gray-400">
                  to {formatDate(row.validEndAt)}
                </div>
              </div>
            );
          }
          return (
            <div className="text-xs flex items-center gap-1 text-orange-600">
              <Calendar size={12} />
              {row.validDays} days after claim
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex gap-2">
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
  }, [handleDelete, handleOpenModal]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Coupon Management"
        description="Create and manage discount coupons for your customers."
        buttonText="Create Coupon"
        buttonOnClick={() => handleOpenModal()}
      />

      <Card>
        {/* 2. Search Form */}
        <div className="space-y-3 mb-6">
          <SchemaSearchForm<CouponSearchForm>
            schema={[
              {
                type: 'input',
                key: 'keyword',
                label: 'Search',
                placeholder: 'Coupon name or code...',
              },
              {
                type: 'select',
                key: 'status',
                label: 'Status',
                defaultValue: 'ALL',
                options: [{ label: 'All Status', value: 'ALL' }].concat(
                  Object.entries(COUPON_STATUS).map(([key, val]) => ({
                    label: key.charAt(0) + key.slice(1).toLowerCase(),
                    value: val.toString(),
                  })),
                ),
              },
              {
                type: 'select',
                key: 'couponType',
                label: 'Type',
                defaultValue: 'ALL',
                options: [{ label: 'All Types', value: 'ALL' }].concat(
                  COUPON_TYPE_OPTIONS.map((option) => ({
                    label: option.label,
                    value: option.value.toString(),
                  })),
                ),
              },
            ]}
            onSearch={handleSearch}
            onReset={reset}
          />
        </div>

        {/* 3. Data Table */}
        <BaseTable
          data={dataSource}
          rowKey="id"
          columns={columns}
          loading={tableProps.loading}
          pagination={{
            ...tableProps.pagination,
            onChange: (page, pageSize) => {
              tableProps.onChange?.({
                current: page,
                pageSize: pageSize || 10,
              });
            },
          }}
        />
      </Card>
    </div>
  );
};
