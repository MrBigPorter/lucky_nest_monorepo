import React, { useMemo, useCallback } from 'react';
import { useAntdTable, useRequest } from 'ahooks';
import { createColumnHelper } from '@tanstack/react-table';
import {
  ArrowDownLeft, // 用这个图标表示“入账”
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button, ModalManager } from '@repo/ui';
import { Badge, Card } from '@/components/UIComponents';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm';
import { BaseTable } from '@/components/scaffold/BaseTable';
import { financeApi } from '@/api';
import { RechargeOrder } from '@/type/types'; // 需定义 RechargeOrder 类型
import { NumHelper, TimeHelper, RECHARGE_STATUS } from '@lucky/shared';
import { DEPOSIT_STATUS_CONFIG, CHANNEL_OPTIONS } from './type';
import { DepositDetailModal } from './DepositDetailModal';
import { useToastStore } from '@/store/useToastStore.ts'; // 下面会写

export const DepositList: React.FC = () => {
  const addToast = useToastStore((state) => state.addToast);
  // 1. 表格数据源
  const { tableProps, run, search, refresh } = useAntdTable(
    async ({ current, pageSize }, formData) => {
      // 清理空参数
      const params = { ...formData };
      if (params.status === 'ALL') delete params.status;

      const res = await financeApi.getRechargeOrders({
        page: current,
        pageSize,
        ...params,
      });
      return { list: res.list, total: res.total };
    },
    { defaultPageSize: 10 },
  );

  // 2. 补单/同步状态逻辑 (Admin 强力工具)
  const { run: runSync, loading: syncLoading } = useRequest(
    financeApi.syncRechargeStatus,
    { manual: true },
  );

  const handleSyncStatus = async (orderNo: string) => {
    try {
      await runSync({ orderNo });
      addToast('success', 'Order status synced successfully');
      refresh(); // 刷新列表看状态变了没
    } catch (err) {
      addToast('error', 'Failed to sync order status');
    }
  };

  const handleViewDetail = useCallback((record: RechargeOrder) => {
    ModalManager.open({
      title: 'Deposit Order Details',
      renderChildren: ({ close }) => (
        <DepositDetailModal data={record} close={close} />
      ),
    });
  }, []);

  // 搜索桥接
  const handleSearch = (values: any) => {
    run({ current: 1, pageSize: 10 }, values);
  };

  // 3. 列定义
  const columns = useMemo(() => {
    const helper = createColumnHelper<RechargeOrder>();
    return [
      helper.accessor('rechargeNo', {
        header: 'Order No.',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-mono font-medium text-xs">
              {info.getValue()}
            </span>
            {/* 显示第三方单号 (External ID) */}
            {info.row.original.thirdPartyOrderNo && (
              <span className="text-[10px] text-gray-400 font-mono">
                Ref: {info.row.original.thirdPartyOrderNo}
              </span>
            )}
          </div>
        ),
      }),
      helper.accessor('user', {
        header: 'User',
        cell: (info) => (
          <div className="flex items-center gap-2">
            {/* 这里可以加个小头像 if needed */}
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {info.getValue()?.nickname || 'Unknown'}
              </span>
              <span className="text-xs text-gray-400">
                {info.getValue()?.phone}
              </span>
            </div>
          </div>
        ),
      }),
      // 🔥 重点：金额展示 (本金 + 赠金)
      helper.accessor('rechargeAmount', {
        header: 'Amount',
        cell: (info) => {
          const amount = Number(info.getValue());
          const bonus = Number(info.row.original.bonusAmount || 0);

          return (
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 dark:text-white">
                {NumHelper.formatMoney(amount)}
              </span>
              {bonus > 0 && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1 rounded w-fit">
                  + {NumHelper.formatMoney(bonus)} Bonus
                </span>
              )}
            </div>
          );
        },
      }),
      // 渠道展示
      helper.accessor('paymentChannel', {
        header: 'Channel',
        cell: (info) => {
          const channel = info.getValue();
          // 简单的映射，最好有个 icon map
          return (
            <Badge color="blue" className="uppercase text-[10px]">
              {channel || 'Unknown'}
            </Badge>
          );
        },
      }),
      helper.accessor('rechargeStatus', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          const { color, label } = DEPOSIT_STATUS_CONFIG[status] || {
            color: 'gray',
            label: 'Unknown',
          };
          return <Badge color={color}>{label}</Badge>;
        },
      }),
      helper.accessor('createdAt', {
        header: 'Created Time',
        cell: (info) => (
          <span className="text-gray-400 text-xs whitespace-nowrap">
            {TimeHelper.formatDateTime(info.getValue())}
          </span>
        ),
      }),
      helper.display({
        header: 'Action',
        cell: (info) => {
          const status = info.row.original.rechargeStatus;
          const isPending = status === RECHARGE_STATUS.PENDING;

          return (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewDetail(info.row.original)}
              >
                <Search size={14} />
              </Button>

              {/* 只有 Pending 状态才显示“同步”按钮 */}
              {isPending && (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={syncLoading}
                  onClick={() => handleSyncStatus(info.row.original.rechargeNo)}
                  title="Sync Status with Xendit"
                >
                  <RefreshCw size={14} className="mr-1" /> Sync
                </Button>
              )}
            </div>
          );
        },
      }),
    ];
  }, [handleViewDetail, handleSyncStatus, syncLoading]);

  return (
    <Card className="border-none shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <ArrowDownLeft size={20} className="text-emerald-500" />
          Deposit Orders
        </h3>
        {/* 右上角可以放“导出报表”按钮 */}
        <Button variant="outline" size="sm">
          Export CSV
        </Button>
      </div>

      <SchemaSearchForm
        schema={[
          {
            type: 'input',
            key: 'keyword',
            label: 'Order / User',
            placeholder: 'Search No. or Phone',
          },
          {
            type: 'select',
            key: 'channel',
            label: 'Channel',
            defaultValue: 'ALL',
            options: [
              { label: 'All Channels', value: 'ALL' },
              ...CHANNEL_OPTIONS,
            ],
          },
          {
            type: 'select',
            key: 'status',
            label: 'Status',
            defaultValue: 'ALL',
            options: [
              { label: 'All Status', value: 'ALL' },
              // 映射 Status Config 为 Options
              ...Object.entries(DEPOSIT_STATUS_CONFIG).map(([k, v]) => ({
                label: v.label,
                value: k,
              })),
            ],
          },
          {
            type: 'date',
            key: 'startDate',
            label: 'Start Date',
          },
          {
            type: 'date',
            key: 'endDate',
            label: 'End Date',
          },
        ]}
        onSearch={handleSearch}
        onReset={search.reset}
      />

      <div className="mt-4">
        <BaseTable
          data={tableProps.dataSource}
          columns={columns}
          loading={tableProps.loading}
          pagination={tableProps.pagination}
          rowKey="rechargeId"
        />
      </div>
    </Card>
  );
};
