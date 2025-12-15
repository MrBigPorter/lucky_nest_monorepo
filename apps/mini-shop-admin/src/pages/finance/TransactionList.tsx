import React, { useMemo, useCallback, useEffect } from 'react';
import { useAntdTable } from 'ahooks';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { Button, ModalManager } from '@repo/ui';
import { Badge, Card } from '@/components/UIComponents';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm';
import { BaseTable } from '@/components/scaffold/BaseTable';
import { financeApi } from '@/api';
import { ManualAdjustModal } from './ManualAdjustModal';
import {
  TransactionSearchForm,
  TransactionsListParams,
  WalletTransaction,
} from '@/type/types';
import {
  NumHelper,
  TimeHelper,
  TRANSACTION_TYPE,
  TRANSACTION_TYPE_LABEL,
} from '@lucky/shared';

export const TransactionList: React.FC = () => {
  const getTableData = async (
    { current, pageSize }: { current: number; pageSize: number },
    formData: TransactionSearchForm,
  ) => {
    const params: TransactionsListParams = {
      page: current,
      pageSize,
    };

    if (formData?.startDate) {
      params.startDate = formData.startDate;
    }
    if (formData?.endDate) {
      params.endDate = formData.endDate;
    }
    if (formData?.userId) {
      params.userId = formData.userId;
    }
    if (formData?.type && formData?.type !== 'ALL') {
      params.type = formData.type;
    }

    const res = await financeApi.getTransactions(params);

    console.log('Fetched transactions:', res);
    return {
      list: res.list || [],
      total: res.total || 0,
    };
  };

  // 1. 数据获取
  const {
    tableProps,
    run,
    search: { reset },
    refresh,
  } = useAntdTable(getTableData, {
    manual: true,
    defaultPageSize: 10,
    defaultParams: [
      { current: 1, pageSize: 10 },
      {
        userId: '',
        type: '',
        startDate: '',
        endDate: '',
      },
    ],
  });

  // 搜索回调：直接拿到所有值
  const handleSearch = (values: TransactionSearchForm) => {
    // 自动重置到第一页，并带上所有条件
    run({ current: 1, pageSize: 10 }, values);
  };

  // 2. 调账弹窗
  const handleOpenAdjust = useCallback(() => {
    ModalManager.open({
      title: 'Manual Fund Adjustment',
      renderChildren: ({ close, confirm }) => (
        <ManualAdjustModal
          close={close}
          confirm={() => {
            confirm();
            refresh();
          }}
        />
      ),
    });
  }, [refresh]);

  const dataSource = (tableProps.dataSource || []) as WalletTransaction[];

  useEffect(() => {
    run(
      { current: 1, pageSize: 10 },
      {
        userId: '',
        type: '',
        startDate: '',
        endDate: '',
      },
    );
  }, [run]);

  // 3. 列定义
  const columns = useMemo(() => {
    const helper = createColumnHelper<WalletTransaction>();
    return [
      helper.accessor('transactionNo', {
        header: 'Trans No.',
        cell: (info) => (
          <span className="font-mono text-xs text-gray-500">
            {info.getValue()}
          </span>
        ),
      }),
      helper.accessor('user', {
        header: 'User',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {info.getValue()?.nickname}
            </span>
            <span className="text-xs text-gray-400">
              {info.getValue()?.phone}
            </span>
          </div>
        ),
      }),
      helper.accessor('transactionType', {
        header: 'Type',
        cell: (info) => (
          <Badge color="blue">{TRANSACTION_TYPE_LABEL[info.getValue()]}</Badge>
        ),
      }),
      helper.accessor('amount', {
        header: 'Amount',
        cell: (info) => {
          const val = Number(info.getValue());
          return (
            <span
              className={`font-mono font-medium ${val > 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {val > 0 ? '+' : ''}
              {NumHelper.formatMoney(val)}
            </span>
          );
        },
      }),
      helper.accessor('afterBalance', {
        header: 'Balance',
        cell: (info) => (
          <span className="text-gray-500 text-xs">
            {NumHelper.formatMoney(info.getValue())}
          </span>
        ),
      }),
      helper.accessor('createdAt', {
        header: 'Time',
        cell: (info) => (
          <span className="text-gray-400 text-xs">
            {TimeHelper.formatDateTime(info.getValue())}
          </span>
        ),
      }),
    ];
  }, []);

  return (
    <Card className="border-none shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ArrowRightLeft size={20} className="text-primary-500" />
          Transactions Log
        </h3>
        <Button variant="primary" size="sm" onClick={handleOpenAdjust}>
          <Plus size={16} className="mr-1" /> Manual Adjust
        </Button>
      </div>

      <SchemaSearchForm
        schema={[
          { type: 'input', key: 'userId', label: 'User ID' },
          {
            type: 'select',
            key: 'type',
            label: 'Type',
            defaultValue: 'ALL', // 支持默认值
            options: [
              { label: 'All', value: 'ALL' },
              ...Object.entries(TRANSACTION_TYPE).map(([k, v]) => ({
                label: k,
                value: String(v),
              })),
            ],
          },
          { type: 'date', key: 'startDate', label: 'Start Date' },
          { type: 'date', key: 'endDate', label: 'End Date' },
        ]}
        onSearch={handleSearch}
        onReset={reset}
      />

      <div className="mt-4">
        <BaseTable
          data={dataSource}
          columns={columns}
          rowKey="transactionNo"
          pagination={{
            ...tableProps.pagination,
            onChange: (page, pageSize) => {
              tableProps.onChange?.({
                current: page,
                pageSize: pageSize || tableProps.pagination?.pageSize || 10,
              });
            },
          }}
        />
      </div>
    </Card>
  );
};
