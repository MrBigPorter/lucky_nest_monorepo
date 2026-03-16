'use client';

import React, { useRef, useMemo, useCallback } from 'react';
import { Badge } from '@repo/ui'; // 假设有 Tag 组件
import {
  SmartTable,
  ProColumns,
  ActionType,
} from '@/components/scaffold/SmartTable';
import { financeApi } from '@/api';
import { TransactionListParams, TransactionRecord } from '@/type/types';
import { TRANSACTION_TYPES_OPTIONS, NumHelper } from '@lucky/shared';
import { ArrowDownRight, ArrowUpRight, Repeat } from 'lucide-react';
import { FormSchema } from '@/type/search';

interface TransactionListProps {
  initialFormParams?: Record<string, unknown>;
  onParamsChange?: (params: Record<string, unknown>) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  initialFormParams,
  onParamsChange,
}) => {
  const actionRef = useRef<ActionType>(null);

  // 金额渲染组件
  const AmountDisplay = ({
    amount,
    type,
  }: {
    amount: string | number;
    type: string;
  }) => {
    const isIncome = type === 'INCOME'; // 假设类型中区分了收入和支出
    const color = isIncome ? 'text-emerald-500' : 'text-rose-500';
    const sign = isIncome ? '+' : '-';

    return (
      <div className={`font-mono font-bold ${color}`}>
        {sign}
        {NumHelper.formatMoney(amount)}
      </div>
    );
  };

  const columns: ProColumns<TransactionRecord>[] = useMemo(
    () => [
      {
        title: 'Transaction No.',
        dataIndex: 'transactionId',
        copyable: true,
        width: 180,
      },
      {
        title: 'User Info',
        dataIndex: 'user',
        width: 150,
        render: (_, row) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {row.user?.nickname || '-'}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              {row.user?.phone}
            </span>
          </div>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'transactionType',
        width: 120,
        valueType: 'select',
        valueEnum: TRANSACTION_TYPES_OPTIONS.reduce(
          (acc, item) => {
            acc[item.value] = { text: item.label };
            return acc;
          },
          {} as Record<string, { text: string }>,
        ),
        render: (_, row) => {
          // 你可以根据实际的 transactionType 返回不同的 Badge 颜色和图标
          let icon = <Repeat size={14} className="mr-1 inline" />;
          let color: 'default' | 'success' | 'warning' | 'error' | 'info' =
            'default';

          if (row.transactionType.includes('RECHARGE')) {
            icon = <ArrowDownRight size={14} className="mr-1 inline" />;
            color = 'success';
          } else if (row.transactionType.includes('WITHDRAW')) {
            icon = <ArrowUpRight size={14} className="mr-1 inline" />;
            color = 'warning';
          }

          const label =
            TRANSACTION_TYPES_OPTIONS.find(
              (o) => o.value === row.transactionType,
            )?.label || row.transactionType;

          return (
            <Badge variant="outline" color={color}>
              {icon}
              {label}
            </Badge>
          );
        },
      },
      {
        title: 'Amount (Cash)',
        dataIndex: 'amount',
        width: 140,
        align: 'right',
        render: (_, row) => (
          <AmountDisplay
            amount={row.amount}
            type={row.transactionType.includes('WITHDRAW') ? 'EXPENSE' : 'INCOME'} // 简化判断，实际按你的业务逻辑
          />
        ),
      },
      {
        title: 'Balance After',
        dataIndex: 'balanceAfter',
        width: 120,
        align: 'right',
        render: (dom) => (
          <span className="font-mono text-gray-600">
            {NumHelper.formatMoney(dom as string)}
          </span>
        ),
      },
      {
        title: 'Remark / Ref',
        dataIndex: 'remark',
        width: 200,
        render: (_, row) => (
          <div className="flex flex-col">
            <span className="text-sm text-gray-700">
              {row.remark || '-'}
            </span>
            {row.referenceId && (
              <span className="text-xs text-gray-400 font-mono mt-1">
                Ref: {row.referenceId}
              </span>
            )}
          </div>
        ),
      },
      {
        title: 'Time',
        dataIndex: 'createdAt',
        valueType: 'dateTime',
        width: 160,
        sorter: true,
      },
    ],
    [],
  );

  const searchSchema: FormSchema[] = useMemo(
    () => [
      {
        type: 'input',
        key: 'keyword',
        label: 'Search',
        placeholder: 'Transaction No / Phone / User',
      },
      {
        type: 'select',
        key: 'transactionType',
        label: 'Type',
        defaultValue: 'ALL',
        options: [
          { label: 'All Types', value: 'ALL' },
          ...TRANSACTION_TYPES_OPTIONS.map((opt) => ({
            label: opt.label,
            value: opt.value,
          })),
        ],
      },
      {
        type: 'date',
        key: 'dateRange',
        label: 'Time Range',
        props: {
          placeholder: ['Start Date', 'End Date'],
        },
      },
    ],
    [],
  );

  const requestTransactions = useCallback(
    async (params: TransactionListParams) => {
      const { dateRange, ...rest } = params;
      const requestData = { ...rest };

      if (requestData.transactionType === 'ALL')
        delete requestData.transactionType;

      if (dateRange?.to && dateRange.from) {
        requestData.startDate = dateRange.from;
        requestData.endDate = dateRange.to;
      }

      const res = await financeApi.getTransactions(requestData);
      return {
        data: res.list,
        total: res.total,
        success: true,
      };
    },
    [],
  );

  return (
    <div className="p-4">
      <SmartTable<TransactionRecord>
        rowKey="transactionId"
        headerTitle="Wallet Transactions"
        ref={actionRef}
        columns={columns}
        searchSchema={searchSchema}
        initialFormParams={initialFormParams}
        onParamsChange={onParamsChange}
        request={requestTransactions}
      />
    </div>
  );
};
