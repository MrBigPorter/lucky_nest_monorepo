'use client';

import React, { useRef, useMemo, useCallback, useState } from 'react';
import { Button, ModalManager } from '@repo/ui';
import {
  SmartTable,
  ProColumns,
  ActionType,
} from '@/components/scaffold/SmartTable';
import { financeApi } from '@/api';
import { RechargeListParams, RechargeOrder } from '@/type/types';
import { DepositDetailModal } from './DepositDetailModal';
import { DEPOSIT_STATUS_CONFIG, CHANNEL_OPTIONS } from './type';
import { Search, ArrowDownLeft, RefreshCw } from 'lucide-react'; // Added RefreshCw icon
import { FormSchema } from '@/type/search';
import { Badge } from '@repo/ui';
import { useToastStore } from '@/store/useToastStore';
import { useRequest } from 'ahooks';
import { RECHARGE_STATUS } from '@lucky/shared';

// Assuming your RECHARGE_STATUS enum/const looks something like this:
// const RECHARGE_STATUS = { PENDING: 0, SUCCESS: 1, FAILED: 2 };

interface DepositListProps {
  initialFormParams?: Record<string, unknown>;
  onParamsChange?: (params: Record<string, unknown>) => void;
}

export const DepositList: React.FC<DepositListProps> = ({
  initialFormParams,
  onParamsChange,
}) => {
  const actionRef = useRef<ActionType>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null); // State for loading effect
  const addToast = useToastStore((state) => state.addToast);

  // 1. View Details
  const handleViewDetail = useCallback((record: RechargeOrder) => {
    ModalManager.open({
      title: 'Deposit Order Details',
      renderChildren: ({ close }) => (
        <DepositDetailModal data={record} close={close} />
      ),
    });
  }, []);

  const { run: syncRecharge, loading: syncRechargeLoading } = useRequest(
    financeApi.syncRecharge,
    {
      manual: true,
      onSuccess: (res) => {
        if (res.status === 'SYNCED_SUCCESS') {
          addToast('success', 'Order synced successfully! User credited.');
        } else if (res.status === 'SYNCED_EXPIRED') {
          addToast('info', 'Order expired on Xendit.');
          actionRef.current?.reload();
        } else {
          addToast(
            'info',
            `Sync complete: Order status is ${res.xenditStatus}`,
          );
        }
      },
      onError: (error) => {
        addToast('error', error.message || 'Failed to sync order');
      },
      onFinally: () => {
        actionRef.current?.reload();
        setSyncingId(null);
      },
    },
  );

  const handleSync = useCallback(
    async (record: RechargeOrder) => {
      setSyncingId(record.rechargeId);
      syncRecharge(record.rechargeId);
    },
    [syncRecharge],
  );

  const statusValueEnum = useMemo(() => {
    const enumMap: Record<string, { text: string; status: string }> = {};
    Object.entries(DEPOSIT_STATUS_CONFIG).forEach(([key, config]) => {
      enumMap[key] = { text: config.label, status: config.color };
    });
    return enumMap;
  }, []);

  const columns: ProColumns<RechargeOrder>[] = useMemo(
    () => [
      {
        title: 'Order No.',
        dataIndex: 'rechargeNo',
        copyable: true,
        render: (dom, row) => (
          <div className="flex flex-col">
            <span className="font-mono font-medium">{dom}</span>
            {row.thirdPartyOrderNo && (
              <span className="text-[10px] text-gray-400 font-mono">
                Ref: {row.thirdPartyOrderNo}
              </span>
            )}
          </div>
        ),
      },
      {
        title: 'User',
        dataIndex: 'user',
        render: (_, row) => (
          <div>
            <div className="font-medium">{row.user?.nickname || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{row.user?.phone}</div>
          </div>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'rechargeAmount',
        valueType: 'money',
        render: (dom) => {
          return (
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 dark:text-white">
                {dom}
              </span>
            </div>
          );
        },
      },
      {
        title: 'Channel',
        dataIndex: 'paymentChannel',
        render: (dom) => (
          <Badge
            className="min-w-[50px] max-w-[80px] flex justify-center"
            variant="secondary-soft"
          >
            {dom}
          </Badge>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'rechargeStatus',
        valueType: 'select',
        valueEnum: statusValueEnum,
      },
      {
        title: 'Created At',
        dataIndex: 'createdAt',
        valueType: 'dateTime',
      },
      {
        title: 'Action',
        valueType: 'option',
        width: 180, // Increased width to fit buttons
        render: (_, row) => {
          const button = DEPOSIT_STATUS_CONFIG[row.rechargeStatus];
          // Assuming 0 is PENDING. You might need to import your ENUM here.
          const isPending = row.rechargeStatus === RECHARGE_STATUS.PENDING;

          console.log(
            'Rendering action buttons for row:',
            row,
            'isPending:',
            isPending,
          );
          return (
            <div className="flex gap-2">
              <Button
                variant={button.buttonColor}
                size="sm"
                onClick={() => handleViewDetail(row)}
              >
                <Search size={14} className="mr-1" /> View
              </Button>

              {/* [NEW] Sync Button: Only show for PENDING orders */}
              {isPending && (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={syncRechargeLoading}
                  disabled={syncingId === row.rechargeId}
                  onClick={() => handleSync(row)}
                  className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                  <RefreshCw
                    size={14}
                    className={`mr-1 ${syncingId === row.rechargeId ? 'animate-spin' : ''}`}
                  />
                  {syncingId === row.rechargeId ? 'Syncing' : 'Sync'}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [
      statusValueEnum,
      syncRechargeLoading,
      syncingId,
      handleViewDetail,
      handleSync,
    ], // Added dependencies
  );

  const searchSchema: FormSchema[] = useMemo(
    () => [
      {
        type: 'input',
        key: 'keyword',
        label: 'Keyword',
        placeholder: 'Order No / Ref No / Phone',
      },
      {
        type: 'select',
        key: 'channel',
        label: 'Channel',
        defaultValue: 'ALL',
        options: [{ label: 'All Channels', value: 'ALL' }, ...CHANNEL_OPTIONS],
      },
      {
        type: 'select',
        key: 'status',
        label: 'Status',
        defaultValue: 'ALL',
        options: [
          { label: 'All Status', value: 'ALL' },
          ...Object.entries(DEPOSIT_STATUS_CONFIG).map(([k, v]) => ({
            label: v.label,
            value: k,
          })),
        ],
      },
      {
        type: 'date',
        key: 'dateRange',
        label: 'Date Range',
        mode: 'range',
      },
    ],
    [],
  );

  const requestDeposits = useCallback(async (params: RechargeListParams) => {
    const requestData = { ...params };
    if (requestData.status === 'ALL') delete requestData.status;
    if (requestData.dateRange) {
      requestData.startDate = requestData.dateRange.from;
      requestData.endDate = requestData.dateRange.to;
      delete requestData.dateRange;
    }

    const res = await financeApi.getDeposits(requestData);
    return {
      data: res.list,
      total: res.total,
      success: true,
    };
  }, []);

  const toolBarRender = useCallback(
    () => [
      <Button key="export" variant="outline">
        Export CSV
      </Button>,
    ],
    [],
  );

  return (
    <div className="p-4">
      <SmartTable<RechargeOrder>
        headerTitle={
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="text-emerald-500" size={20} />
            <span>Deposit Orders</span>
          </div>
        }
        rowKey="rechargeId"
        ref={actionRef}
        columns={columns}
        searchSchema={searchSchema}
        initialFormParams={initialFormParams}
        onParamsChange={onParamsChange}
        request={requestDeposits}
        toolBarRender={toolBarRender}
      />
    </div>
  );
};
