import React, { useRef, useMemo, useCallback } from 'react';
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
import { Search, ArrowDownLeft } from 'lucide-react';
import { FormSchema } from '@/type/search.ts';
import { Badge } from '@repo/ui/components/ui/badge.tsx';

export const DepositList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const handleViewDetail = useCallback((record: RechargeOrder) => {
    ModalManager.open({
      title: 'Deposit Order Details',
      renderChildren: ({ close }) => (
        <DepositDetailModal data={record} close={close} />
      ),
    });
  }, []);

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
        width: 140,
        render: (_, row) => {
          const button = DEPOSIT_STATUS_CONFIG[row.rechargeStatus];
          return (
            <div className="flex gap-2">
              <Button
                variant={button.buttonColor}
                size="sm"
                onClick={() => handleViewDetail(row)}
              >
                <Search size={14} className="mr-1" /> View
              </Button>
            </div>
          );
        },
      },
    ],
    [handleViewDetail, statusValueEnum],
  );

  // 6. 独立的搜索表单配置
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
          // 将配置对象转为 select options
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

  // 7. 数据请求处理
  const requestDeposits = useCallback(async (params: RechargeListParams) => {
    const requestData = { ...params };

    // 清理 'ALL'
    if (requestData.status === 'ALL') delete requestData.status;

    // 处理日期范围转换 (dateRange -> startDate, endDate)
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

  // 8. 顶部工具栏
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
        request={requestDeposits}
        toolBarRender={toolBarRender}
      />
    </div>
  );
};
