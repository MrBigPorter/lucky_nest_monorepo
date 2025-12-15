import React, { useMemo, useCallback } from 'react';
import { useAntdTable } from 'ahooks';
import { createColumnHelper } from '@tanstack/react-table';
import { ShieldCheck } from 'lucide-react';
import { Button, ModalManager } from '@repo/ui';
import { Badge, Card } from '@/components/UIComponents';
import { SchemaSearchForm } from '@/components/scaffold/SchemaSearchForm';
import { BaseTable } from '@/components/scaffold/BaseTable';
import { financeApi } from '@/api';
import { WithdrawAuditModal } from './WithdrawAuditModal';
import { WithdrawOrder } from '@/type/types';
import { WITHDRAW_STATUS, NumHelper, TimeHelper } from '@lucky/shared';

export const WithdrawalList: React.FC = () => {
  const { tableProps, search, refresh } = useAntdTable(
    async ({ current, pageSize }, formData) => {
      const res = await financeApi.getWithdrawals({
        page: current,
        pageSize,
        ...formData,
      });
      return { list: res.list, total: res.total };
    },
    { defaultPageSize: 10 },
  );

  const handleAudit = useCallback(
    (record: WithdrawOrder) => {
      ModalManager.open({
        title: 'Withdrawal Audit',
        renderChildren: ({ confirm }) => (
          <WithdrawAuditModal
            data={record}
            confirm={() => {
              confirm();
              refresh();
            }}
          />
        ),
      });
    },
    [refresh],
  );

  const columns = useMemo(() => {
    const helper = createColumnHelper<WithdrawOrder>();
    return [
      helper.accessor('withdrawNo', { header: 'Order No.' }),
      helper.accessor('user', {
        header: 'User',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{info.getValue()?.nickname}</span>
          </div>
        ),
      }),
      helper.accessor('withdrawAmount', {
        header: 'Amount',
        cell: (info) => (
          <span className="font-bold">
            {NumHelper.formatMoney(info.getValue())}
          </span>
        ),
      }),
      helper.accessor('withdrawStatus', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          const color =
            status === WITHDRAW_STATUS.SUCCESS
              ? 'green'
              : status === WITHDRAW_STATUS.REJECTED
                ? 'red'
                : status === WITHDRAW_STATUS.PENDING_AUDIT
                  ? 'yellow'
                  : 'gray';
          return <Badge color={color}>{WITHDRAW_STATUS[status]}</Badge>;
        },
      }),
      helper.accessor('createdAt', {
        header: 'Applied At',
        cell: (info) => (
          <span className="text-gray-400 text-xs">
            {TimeHelper.formatDateTime(info.getValue())}
          </span>
        ),
      }),
      helper.display({
        header: 'Action',
        cell: (info) => {
          const status = info.row.original.withdrawStatus;
          if (status !== WITHDRAW_STATUS.PENDING_AUDIT) return null;
          return (
            <Button
              size="sm"
              variant="ghost"
              className="text-blue-600 bg-blue-50 hover:bg-blue-100"
              onClick={() => handleAudit(info.row.original)}
            >
              <ShieldCheck size={14} className="mr-1" /> Audit
            </Button>
          );
        },
      }),
    ];
  }, [handleAudit]);

  return (
    <Card className="border-none shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck size={20} className="text-primary-500" />
          Withdrawal Requests
        </h3>
      </div>

      <SchemaSearchForm
        schema={[
          {
            type: 'input',
            key: 'keyword',
            label: 'Keyword',
            placeholder: 'Order No / User',
          },
          {
            type: 'select',
            key: 'status',
            label: 'Status',
            options: Object.keys(WITHDRAW_STATUS)
              .filter((k) => isNaN(Number(k)))
              .map((k) => ({ label: k, value: WITHDRAW_STATUS[k as any] })),
          },
        ]}
        onSearch={search.submit}
        onReset={search.reset}
      />

      <div className="mt-4">
        <BaseTable
          data={tableProps.dataSource}
          columns={columns}
          loading={tableProps.loading}
          pagination={tableProps.pagination}
          rowKey="withdrawId"
        />
      </div>
    </Card>
  );
};
