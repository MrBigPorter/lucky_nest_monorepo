import React, { useRef, useMemo, useCallback } from 'react';
import { Button, ModalManager } from '@repo/ui';
import {
  SmartTable,
  ProColumns,
  ActionType,
} from '@/components/scaffold/SmartTable';
import { financeApi } from '@/api';
import { WithdrawOrder } from '@/type/types';
import { WithdrawAuditModal } from './WithdrawAuditModal';
import { STATUS_CONFIG } from '@/pages/finance/type.ts';
import { WITHDRAW_STATUS, WITHDRAW_STATUS_OPTIONS } from '@lucky/shared';
import { EyeIcon, ShieldCheck } from 'lucide-react';

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
            actionRef.current?.reload(true); // ✅ 建议审核后回到第一页并刷新
          }}
        />
      ),
    });
  }, []);

  // ✅ 把 valueEnum 也单独 memo（避免 columns 里 reduce 产生新对象的风险）
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
        search: {
          title: 'Order No',
          formItemProps: { placeholder: 'Search Order No' },
        },
      },
      {
        title: 'User',
        dataIndex: 'user',
        search: false,
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
        search: false,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        valueType: 'select',
        valueEnum: statusValueEnum,
      },
      {
        title: 'Start Date',
        dataIndex: 'startDate',
        valueType: 'dateTime',
        search: {
          valueType: 'dateTime',
          transform: (value) => ({ startDate: value[0], endDate: value[1] }),
        },
      },
      {
        title: 'Action',
        valueType: 'option',
        width: 120,
        render: (_, row) => {
          const isPending =
            row.withdrawStatus === WITHDRAW_STATUS.PENDING_AUDIT;

          return (
            <Button
              variant={isPending ? 'danger' : 'ghost'}
              size="sm"
              onClick={() => handleAudit(row)}
            >
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

  // ✅ 关键修复：request 用 useCallback 固定引用
  const requestWithdrawals = useCallback(async (params: any) => {
    const requestData = { ...params };
    if (requestData.status === 'ALL') delete requestData.status;

    const res = await financeApi.getWithdrawals(requestData);
    return {
      data: res.list,
      total: res.total,
      success: true,
    };
  }, []);

  // ✅ toolBarRender 也固定引用（SmartTable 内部如果 useEffect 依赖它会抖）
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
        headerTitle="Withdrawal Requests"
        rowKey="withdrawId"
        ref={actionRef}
        columns={columns}
        request={requestWithdrawals}
        toolBarRender={toolBarRender}
      />
    </div>
  );
};
