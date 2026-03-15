'use client';

import React, { useRef, useMemo, useCallback } from 'react';
import { Button, ModalManager } from '@repo/ui'; // 假设有 Tag 组件
import {
  SmartTable,
  ProColumns,
  ActionType,
} from '@/components/scaffold/SmartTable';
import { financeApi } from '@/api';
import { WithdrawListParams, WithdrawOrder } from '@/type/types';
import { WithdrawAuditModal } from './WithdrawAuditModal';
import { STATUS_CONFIG } from '@/views/finance/type';
import {
  WITHDRAW_STATUS,
  WITHDRAW_STATUS_OPTIONS,
  NumHelper,
} from '@lucky/shared';
import { EyeIcon, ShieldCheck, Wallet, Landmark } from 'lucide-react';
import { FormSchema } from '@/type/search';

// 简单的渠道图标映射助手
const ChannelIcon = ({ code, name }: { code?: string; name?: string }) => {
  const isBank = code?.includes('BANK') || name?.toLowerCase().includes('bank');
  return (
    <div className="flex items-center gap-2">
      <div
        className={`p-1.5 rounded-full ${isBank ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}
      >
        {isBank ? <Landmark size={14} /> : <Wallet size={14} />}
      </div>
      <span className="font-medium text-sm">{name || 'Unknown'}</span>
    </div>
  );
};

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
            actionRef.current?.reload(); // 审核完只需刷新数据，不需要 reset 页码
          }}
        />
      ),
    });
  }, []);

  const statusValueEnum = useMemo(() => {
    return WITHDRAW_STATUS_OPTIONS.reduce(
      (acc, item) => {
        const config = STATUS_CONFIG[item.value] || {
          color: 'default',
          label: item.label,
        };
        acc[item.value] = { text: config.label, status: config.color };
        return acc;
      },
      {} as Record<number, { text: string; status?: string }>,
    );
  }, []);

  const columns: ProColumns<WithdrawOrder>[] = useMemo(
    () => [
      {
        title: 'Order No.',
        dataIndex: 'withdrawNo',
        copyable: true,
        width: 180,
        render: (dom, row) => (
          <div className="flex flex-col">
            <span>{dom}</span>
            <span className="text-[10px] text-gray-400">
              {row.thirdPartyOrderNo}
            </span>
          </div>
        ),
      },
      {
        title: 'User Info',
        dataIndex: 'user',
        width: 150,
        render: (_, row) => (
          <div className="flex items-center gap-2">
            {/* 如果有头像组件最好 */}
            <div>
              <div className="font-medium text-gray-900">
                {row.user?.nickname || '-'}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {row.user?.phone}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Channel',
        dataIndex: 'bankName',
        width: 140,
        render: (_, row) => (
          <ChannelIcon code={row.channelCode} name={row.bankName} />
        ),
      },
      {
        title: 'Beneficiary',
        width: 160,
        render: (_, row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{row.accountName}</span>
            <span className="text-xs text-gray-500 font-mono">
              {row.withdrawAccount}
            </span>
          </div>
        ),
      },
      {
        title: 'Amount Info',
        dataIndex: 'withdrawAmount',
        width: 140,
        align: 'right', // 财务数据习惯右对齐
        render: (_, row) => (
          <div className="flex flex-col items-end">
            {/* 申请金额 */}
            <span className="font-bold ">
              {NumHelper.formatMoney(row.withdrawAmount)}
            </span>
            {/* 实付金额 (高亮显示) */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-400">Act:</span>
              <span className="font-medium text-primary-600">
                {NumHelper.formatMoney(row.actualAmount)}
              </span>
            </div>
          </div>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'withdrawStatus',
        valueType: 'select',
        valueEnum: statusValueEnum,
        width: 100,
      },
      {
        title: 'Time',
        dataIndex: 'appliedAt',
        valueType: 'dateTime',
        width: 160,
        sorter: true, // 允许按时间排序
      },
      {
        title: 'Action',
        valueType: 'option',
        fixed: 'right', // 固定在右侧
        width: 100,
        render: (_, row) => {
          const isPending =
            row.withdrawStatus === WITHDRAW_STATUS.PENDING_AUDIT;
          return (
            <Button
              variant={isPending ? 'info' : 'outline'}
              color={isPending ? 'primary' : 'gray'} // 待审核用醒目色
              size="sm"
              onClick={() => handleAudit(row)}
            >
              {isPending ? (
                <ShieldCheck size={14} className="mr-1" />
              ) : (
                <EyeIcon size={14} className="mr-1" />
              )}
              {isPending ? 'Audit' : 'Detail'}
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
        key: 'keyword',
        label: 'Search',
        placeholder: 'Order No / Phone / User / Account', // 增加Account搜索提示
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
        type: 'date', // 建议改用范围选择器
        key: 'dateRange',
        label: 'Applied Date',
        props: {
          placeholder: ['Start Date', 'End Date'],
        },
      },
    ],
    [],
  );

  const requestWithdrawals = useCallback(async (params: WithdrawListParams) => {
    // 处理参数
    const { dateRange, ...rest } = params;
    const requestData = { ...rest };

    if (requestData.status === 'ALL') delete requestData.status;

    // 处理日期范围组件的返回值
    if (dateRange?.to && dateRange.from) {
      requestData.startDate = dateRange.from;
      requestData.endDate = dateRange.to;
    }

    const res = await financeApi.getWithdrawals(requestData);
    return {
      data: res.list,
      total: res.total,
      success: true,
    };
  }, []);

  return (
    <div className="p-4 ">
      <SmartTable<WithdrawOrder>
        rowKey="withdrawId"
        headerTitle="Withdrawal Management"
        ref={actionRef}
        columns={columns}
        searchSchema={searchSchema}
        request={requestWithdrawals}
      />
    </div>
  );
};
