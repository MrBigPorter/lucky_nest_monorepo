import React, { useMemo, useCallback, useEffect } from 'react';
import { useAntdTable } from 'ahooks';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowRightLeft, Plus, RefreshCw, EyeIcon } from 'lucide-react';
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
  // 假设你在 shared 中有这些定义，如果没有，请参考代码下方的常量补充
  BALANCE_TYPE,
  TRANSACTION_STATUS,
  BALANCE_TYPE_LABEL,
} from '@lucky/shared';
import { TransactionDetailModal } from '@/pages/finance/TransactionDetailModal.tsx';

// --- 补充常量定义 (如果 shared 包里没有，请取消注释使用) ---
/*
const BALANCE_TYPE = { CASH: 1, COIN: 2 };
const TRANSACTION_STATUS = { PENDING: 1, SUCCESS: 2, FAILED: 3 };
*/

export const TransactionList: React.FC = () => {
  // 1. 数据获取逻辑
  const getTableData = async (
    { current, pageSize }: { current: number; pageSize: number },
    formData: TransactionSearchForm,
  ) => {
    const query = formData || {};

    const params: TransactionsListParams = {
      page: current,
      pageSize,
    };

    // 组装查询参数
    if (query.transactionNo) params.transactionNo = query.transactionNo;
    if (query.userId) params.userId = query.userId;
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;

    // 类型过滤
    if (query.type && query.type !== 'ALL') {
      params.type = query.type;
    }

    const res = await financeApi.getTransactions(params);

    return {
      list: res.list || [],
      total: res.total || 0,
    };
  };

  // 2. 使用 ahooks 管理表格状态
  const {
    tableProps,
    run,
    search: { reset },
    refresh,
  } = useAntdTable(getTableData, {
    manual: true, // 手动触发首次请求，防止参数未初始化
    defaultPageSize: 10,
    defaultParams: [
      { current: 1, pageSize: 10 },
      {
        transactionNo: '',
        userId: '',
        type: 'ALL',
        startDate: '',
        endDate: '',
      },
    ],
  });

  const handleViewDetail = useCallback((record: WalletTransaction) => {
    ModalManager.open({
      title: 'Transaction Details',
      renderChildren: ({ close }) => (
        <TransactionDetailModal data={record} close={close} />
      ),
    });
  }, []);

  // 搜索处理
  const handleSearch = (values: TransactionSearchForm) => {
    run({ current: 1, pageSize: 10 }, values);
  };

  // 打开人工调账弹窗
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

  // 首次加载触发
  useEffect(() => {
    // 确保组件挂载时带默认参数请求一次
    reset();
  }, [reset]);

  const dataSource = (tableProps.dataSource || []) as WalletTransaction[];

  // 3. 列定义 (核心业务展示)
  const columns = useMemo(() => {
    const helper = createColumnHelper<WalletTransaction>();

    return [
      // --- Column: Transaction Info ---
      helper.accessor('transactionNo', {
        header: 'Trans No. / Ref',
        cell: (info) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-200">
              {info.getValue()}
            </span>
            {/* 展示关联单号 (如订单号、提现单号) */}
            {info.row.original.relatedId && (
              <span className="font-mono text-[10px] text-gray-400">
                Ref: {info.row.original.relatedId}
              </span>
            )}
          </div>
        ),
      }),

      // --- Column: User ---
      helper.accessor('user', {
        header: 'User',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-sm text-gray-900 dark:text-white">
              {info.getValue()?.nickname || 'Unknown'}
            </span>
            <span className="text-xs text-gray-400">
              {info.getValue()?.phone}
            </span>
          </div>
        ),
      }),

      // --- Column: Asset Type (Cash vs Coin) ---
      helper.accessor('balanceType', {
        header: 'Asset',
        cell: (info) => {
          const type = info.getValue();
          const isCash = type === BALANCE_TYPE?.CASH;
          return (
            <Badge color={isCash ? 'green' : 'yellow'}>
              {BALANCE_TYPE_LABEL[type] || '--'}
            </Badge>
          );
        },
      }),

      // --- Column: Transaction Type ---
      helper.accessor('transactionType', {
        header: 'Type',
        cell: (info) => (
          <Badge color="blue">
            {TRANSACTION_TYPE_LABEL[info.getValue()] || 'Unknown'}
          </Badge>
        ),
      }),

      // --- Column: Amount & Status ---
      helper.accessor('amount', {
        header: 'Amount',
        cell: (info) => {
          const val = Number(info.getValue());
          const status = info.row.original.status;
          // 假设 2=SUCCESS (请根据你的 TRANSACTION_STATUS 常量调整)
          const isSuccess =
            status === TRANSACTION_STATUS?.SUCCESS || status === 2;

          return (
            <div className="flex flex-col">
              <span
                className={`font-mono font-bold ${val > 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {val > 0 ? '+' : ''}
                {NumHelper.formatMoney(val)}
              </span>

              {/* 如果状态不是成功，显示红色警告标签 */}
              {!isSuccess && (
                <span className="text-[10px] font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-1 rounded w-fit mt-0.5">
                  FAILED
                </span>
              )}
            </div>
          );
        },
      }),

      // --- Column: Balance Snapshot ---
      helper.accessor('afterBalance', {
        header: 'After Balance',
        cell: (info) => (
          <span className="text-gray-500 text-xs font-mono">
            {NumHelper.formatMoney(info.getValue())}
          </span>
        ),
      }),

      // --- Column: Time ---
      helper.accessor('createdAt', {
        header: 'Time',
        cell: (info) => (
          <span className="text-gray-400 text-xs whitespace-nowrap">
            {TimeHelper.formatDateTime(info.getValue())}
          </span>
        ),
      }),

      helper.display({
        id: 'actions',
        header: 'Action',
        cell: (info) => (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20"
            onClick={() => handleViewDetail(info.row.original)}
            title="View Details"
          >
            <EyeIcon size={16} />
          </Button>
        ),
      }),
    ];
  }, [handleViewDetail]);

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-dark-900">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <ArrowRightLeft size={20} className="text-primary-500" />
            Transactions Log
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Monitor real-time financial flow and audit adjustments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw size={16} />
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdjust}>
            <Plus size={16} className="mr-1" /> Manual Adjust
          </Button>
        </div>
      </div>

      {/* Search Form */}
      <SchemaSearchForm
        schema={[
          {
            type: 'input',
            key: 'transactionNo',
            label: 'Trans No. / Ref',
            placeholder: 'Search ID...',
          },
          {
            type: 'input',
            key: 'userId',
            label: 'User ID',
          },
          {
            type: 'select',
            key: 'type',
            label: 'Type',
            defaultValue: 'ALL',
            options: [
              { label: 'All Types', value: 'ALL' },
              ...Object.entries(TRANSACTION_TYPE).map(([k, v]) => ({
                label: k, // 这里可以使用 map 转换成中文
                value: String(v),
              })),
            ],
          },
          {
            type: 'date',
            key: 'startDate',
            label: 'Start Date',
            mode: 'single', // 使用你刚刚修复好的单选模式
          },
          {
            type: 'date',
            key: 'endDate',
            label: 'End Date',
            mode: 'single',
          },
        ]}
        onSearch={handleSearch}
        onReset={reset}
      />

      {/* Data Table */}
      <div className="mt-4">
        <BaseTable
          data={dataSource}
          columns={columns}
          rowKey="transactionNo"
          loading={tableProps.loading}
          pagination={{
            ...tableProps.pagination,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              tableProps.onChange?.({
                current: page,
                pageSize: pageSize || 10,
              });
            },
          }}
        />
      </div>
    </Card>
  );
};
