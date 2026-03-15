'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { Button, ModalManager, cn } from '@repo/ui';
import {
  ActionType,
  ProColumns,
  SmartTable,
} from '@/components/scaffold/SmartTable';
import { Edit, CreditCard, ArrowRightLeft, Power } from 'lucide-react';
import { FormSchema } from '@/type/search';
import { PaymentChannel, PaymentChannelListParams } from '@/type/types';
import { Card } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { paymentChannelApi } from '@/api';
import { PageHeader } from '@/components/scaffold/PageHeader';
import { PaymentChannelModal } from './payment-channel/PaymentChannelModal';

// --- 辅助组件：状态标签 ---
const StatusBadge = ({ status }: { status: number }) => {
  const config = useMemo(() => {
    switch (status) {
      case 1:
        return {
          label: 'Active',
          className: 'bg-green-100 text-green-700 border-green-200',
        };
      case 2:
        return {
          label: 'Maintenance',
          className: 'bg-amber-100 text-amber-700 border-amber-200',
        }; // 用 Amber 醒目一点
      case 0:
      default:
        return {
          label: 'Disabled',
          className: 'bg-gray-100 text-gray-500 border-gray-200',
        };
    }
  }, [status]);

  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-[11px] font-bold uppercase border tracking-wide',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
};

// --- 辅助组件：类型标签 ---
const TypeBadge = ({ type }: { type: number }) => {
  const isRecharge = type === 1;
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors',
        isRecharge
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-orange-50 text-orange-700 border-orange-200',
      )}
    >
      {isRecharge ? <CreditCard size={12} /> : <ArrowRightLeft size={12} />}
      {isRecharge ? 'Money In' : 'Money Out'}
    </div>
  );
};

// --- 主组件 ---
export const PaymentChannelList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const addToast = useToastStore((s) => s.addToast);

  // 打开弹窗
  const handleEdit = useCallback((record?: PaymentChannel) => {
    ModalManager.open({
      title: record ? `Edit Channel` : 'Create New Channel',
      size: 'xl',
      renderChildren: ({ close }) => (
        <PaymentChannelModal
          data={record}
          close={close}
          reload={() => actionRef.current?.reload()}
        />
      ),
    });
  }, []);

  // 删除操作 (使用 ModalManager 而不是原生 confirm 会更好，这里保持逻辑不变但优化体验)
  const handleDelete = useCallback(
    async (id: number) => {
      // 建议后期替换为 ModalManager.confirm
      if (
        !window.confirm(
          'Are you sure you want to disable this channel? Users will not be able to see it.',
        )
      )
        return;

      try {
        await paymentChannelApi.delete(id, 0);
        addToast('success', 'Channel disabled successfully');
        actionRef.current?.reload();
      } catch (e) {
        addToast('error', 'Failed to disable channel');
      }
    },
    [addToast],
  );

  const columns: ProColumns<PaymentChannel>[] = useMemo(
    () => [
      {
        title: 'Channel Info',
        dataIndex: 'name',
        width: 240,
        render: (_, row) => (
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 p-1.5 flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-all">
              {row.icon ? (
                <img
                  src={row.icon}
                  className="w-full h-full object-contain"
                  alt={row.name}
                />
              ) : (
                <CreditCard size={20} className="text-gray-400" />
              )}
            </div>
            <div className="flex flex-col">
              <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm">
                {row.name}
                {row.isCustom && (
                  <span className="text-[10px] leading-none bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-medium">
                    Custom
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                <span className="bg-gray-100 px-1 rounded text-[10px] text-gray-600">
                  CODE
                </span>
                {row.code}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        width: 120,
        valueType: 'select',
        valueEnum: {
          '1': { text: 'Recharge' },
          '2': { text: 'Withdraw' },
        },
        render: (_, row) => <TypeBadge type={row.type} />,
      },
      {
        title: 'Limits Range',
        dataIndex: 'minAmount',
        width: 180,
        render: (_, row) => (
          <div className="flex flex-col justify-center">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
              ₱{row.minAmount.toLocaleString()} - ₱
              {row.maxAmount.toLocaleString()}
            </div>
          </div>
        ),
      },
      {
        title: 'Fees',
        dataIndex: 'feeFixed',
        width: 150,
        render: (_, row) => {
          if (row.type === 1)
            return <span className="text-gray-400 text-xs italic">No Fee</span>;

          const isFree = row.feeFixed === 0 && row.feeRate === 0;
          if (isFree)
            return (
              <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-full">
                FREE
              </span>
            );

          return (
            <div className="flex items-center gap-1 text-xs">
              {row.feeFixed > 0 && (
                <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200 font-medium">
                  ₱{row.feeFixed}
                </span>
              )}
              {row.feeFixed > 0 && row.feeRate > 0 && (
                <span className="text-gray-400">+</span>
              )}
              {row.feeRate > 0 && (
                <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200 font-medium">
                  {(row.feeRate * 100).toFixed(1)}%
                </span>
              )}
            </div>
          );
        },
      },
      {
        title: 'Sort',
        dataIndex: 'sortOrder',
        width: 80,
        render: (val) => (
          <span className="font-mono text-gray-500 text-xs">#{val}</span>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 100,
        valueType: 'select',
        valueEnum: {
          '1': { text: 'Active', status: 'Success' },
          '0': { text: 'Disabled', status: 'Default' },
          '2': { text: 'Maintenance', status: 'Error' },
        },
        render: (_, row) => <StatusBadge status={row.status} />,
      },
      {
        title: 'Action',
        valueType: 'option',
        fixed: 'right',
        width: 100,
        render: (_, row) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-primary-600 hover:bg-primary-50"
              onClick={() => handleEdit(row)}
              title="Edit Configuration"
            >
              <Edit size={16} />
            </Button>
            {row.status !== 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleDelete(row.id)}
                title="Disable Channel"
              >
                <Power size={16} />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [handleEdit, handleDelete],
  );

  const searchSchema: FormSchema[] = useMemo(
    () => [
      {
        type: 'input',
        key: 'name',
        label: 'Channel Name',
        placeholder: 'Search name...',
      },
      {
        type: 'select',
        key: 'type',
        label: 'Type',
        options: [
          { label: 'Money In (Recharge)', value: '1' },
          { label: 'Money Out (Withdraw)', value: '2' },
        ],
      },
      {
        type: 'select',
        key: 'status',
        label: 'Status',
        options: [
          { label: 'Active', value: '1' },
          { label: 'Maintenance', value: '2' },
          { label: 'Disabled', value: '0' },
        ],
      },
    ],
    [],
  );

  const requestList = useCallback(async (params: PaymentChannelListParams) => {
    const res = await paymentChannelApi.getList(params);
    return {
      data: res.list,
      total: res.total,
      success: true,
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Channels"
        description="Configure payment gateways, limits, and fees for money in/out."
        buttonText="Add Channel"
        buttonOnClick={() => handleEdit()}
      />

      <Card className="border-none shadow-sm">
        <div className="p-0">
          {/* SmartTable 内部通常自带 padding，或者保持 p-0 让表格贴边 */}
          <SmartTable<PaymentChannel>
            rowKey="id"
            ref={actionRef}
            columns={columns}
            searchSchema={searchSchema}
            request={requestList}
            // 移除 headerTitle，因为 PageHeader 已经有了，界面会更清爽
            // 也可以保留，看你的设计规范
            toolBarRender={() => []}
          />
        </div>
      </Card>
    </div>
  );
};
