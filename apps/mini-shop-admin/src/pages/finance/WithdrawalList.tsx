import React, { useRef, useMemo, useCallback } from 'react';
import { Button, ModalManager } from '@repo/ui';
import {
  SmartTable,
  ProColumns,
  ActionType,
} from '@/components/scaffold/SmartTable';
import { financeApi } from '@/api';
import { WithdrawListParams, WithdrawOrder } from '@/type/types';
import { WithdrawAuditModal } from './WithdrawAuditModal';
import { STATUS_CONFIG } from '@/pages/finance/type.ts';
import { WITHDRAW_STATUS, WITHDRAW_STATUS_OPTIONS } from '@lucky/shared';
import { EyeIcon, ShieldCheck } from 'lucide-react';
import { FormSchema } from '@/type/search.ts';

export const WithdrawalList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const handleAudit = useCallback((record: WithdrawOrder) => {
    ModalManager.open({
      title: 'Withdrawal Audit',
      renderChildren: ({ confirm }) => (
        <WithdrawAuditModal
          data={record}
          confirm={() => {
            confirm();
            actionRef.current?.reload(true);
          }}
        />
      ),
    });
  }, []);

  const statusValueEnum = useMemo(() => {
    return WITHDRAW_STATUS_OPTIONS.reduce(
      (acc, item) => {
        const config = STATUS_CONFIG[item.value] || {
          color: 'gray',
          label: item.label,
        };
        acc[item.value] = { text: config.label, status: config.color };
        return acc;
      },
      {} as Record<number, { text: string; status?: string; color?: string }>,
    );
  }, []);

  const columns: ProColumns<WithdrawOrder>[] = useMemo(
    () => [
      {
        title: 'Order No.',
        dataIndex: 'withdrawNo',
        copyable: true,
      },
      {
        title: 'User',
        dataIndex: 'user',
        render: (_, row) => (
          <div>
            <div className="font-medium">{row.user?.nickname}</div>
            <div className="text-xs text-gray-500">{row.user?.phone}</div>
          </div>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'withdrawAmount',
        valueType: 'money',
      },
      {
        title: 'Status',
        dataIndex: 'withdrawStatus',
        valueType: 'select',
        valueEnum: statusValueEnum,
      },
      {
        title: 'Applied At',
        dataIndex: 'appliedAt',
        valueType: 'dateTime',
      },
      {
        title: 'Action',
        valueType: 'option',
        width: 120,
        render: (_, row) => {
          const isPending =
            row.withdrawStatus === WITHDRAW_STATUS.PENDING_AUDIT;
          const color = isPending ? 'danger' : 'primary';
          return (
            <Button variant={color} size="sm" onClick={() => handleAudit(row)}>
              {isPending ? (
                <ShieldCheck size={14} className="mr-1" />
              ) : (
                <EyeIcon size={14} className="mr-1" />
              )}
              {isPending ? 'Audit' : 'View'}
            </Button>
          );
        },
      },
    ],
    [handleAudit, statusValueEnum],
  );

  const searchSchema: FormSchema[] = useMemo(
    () => [
      {
        type: 'input',
        key: 'keyword', // 搜索字段：keyword
        label: 'Keyword',
        placeholder: 'Order No / Phone / Nickname', // 聚合搜索提示
      },
      {
        type: 'select',
        key: 'status',
        label: 'Status',
        defaultValue: 'ALL',
        options: [
          { label: 'All Status', value: 'ALL' },
          ...WITHDRAW_STATUS_OPTIONS.map((opt) => ({
            label: opt.label,
            value: String(opt.value),
          })),
        ],
      },
      {
        type: 'date',
        key: 'startDate',
        label: 'Start Date',
        mode: 'single',
      },
      {
        type: 'date',
        key: 'endDate',
        label: 'End Date',
        mode: 'single',
      },
    ],
    [],
  );

  const requestWithdrawals = useCallback(async (params: WithdrawListParams) => {
    const requestData = { ...params };

    if (requestData.status === 'ALL') delete requestData.status;

    const res = await financeApi.getWithdrawals(requestData);
    return {
      data: res.list,
      total: res.total,
      success: true,
    };
  }, []);

  const toolBarRender = useCallback(
    () => [
      <Button key="export" variant="outline">
        Export Data
      </Button>,
    ],
    [],
  );

  return (
    <div className="p-4">
      <SmartTable<WithdrawOrder>
        rowKey="withdrawId"
        ref={actionRef}
        columns={columns}
        searchSchema={searchSchema}
        request={requestWithdrawals}
        toolBarRender={toolBarRender}
      />
    </div>
  );
};
