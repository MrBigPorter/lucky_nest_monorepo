'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { Button, ModalManager } from '@repo/ui';
import {
  SmartTable,
  ProColumns,
  ActionType,
} from '@/components/scaffold/SmartTable';
import { FileText, User, CalendarDays } from 'lucide-react';
import { FormSchema } from '@/type/search';
import { AdminOperationLog, AdminOperationLogListParams } from '@/type/types';
import { Card } from '@/components/UIComponents';
import { useToastStore } from '@/store/useToastStore';
import { adminOperationLogApi } from '@/api';
import { PageHeader } from '@/components/scaffold/PageHeader';
import { useAntdTable } from 'ahooks';
import { format } from 'date-fns';

interface OperationLogListProps {
  initialFormParams?: Record<string, unknown>;
  onParamsChange?: (params: Record<string, unknown>) => void;
}

type OperationLogSearchForm = {
  adminId?: string;
  operationType?: string;
  dateRange?: { from: string; to: string };
  keyword?: string;
};

export const OperationLogList: React.FC<OperationLogListProps> = ({
  initialFormParams,
  onParamsChange,
}) => {
  const actionRef = useRef<ActionType>(null);
  const addToast = useToastStore((state) => state.addToast);

  // --- 数据请求 ---
  const getTableData = async (
    { current, pageSize }: { current: number; pageSize: number },
    formData: OperationLogSearchForm,
  ) => {
    const params: AdminOperationLogListParams = {
      page: current,
      pageSize,
    };

    if (formData.adminId) params.adminId = formData.adminId;
    if (formData.operationType && formData.operationType !== 'ALL')
      params.operationType = formData.operationType;
    if (formData.keyword) params.keyword = formData.keyword;
    if (formData.dateRange?.from) params.startDate = formData.dateRange.from;
    if (formData.dateRange?.to) params.endDate = formData.dateRange.to;

    const res = await adminOperationLogApi.getList(params); // 假设这个 API 存在
    return { list: res.list, total: res.total };
  };

  const {
    tableProps,
    refresh,
    run,
    search: { reset },
  } = useAntdTable(getTableData, {
    defaultPageSize: 10,
    defaultParams: [
      { current: 1, pageSize: 10 },
      {
        adminId: (initialFormParams?.adminId as string) || '',
        operationType: (initialFormParams?.operationType as string) || 'ALL',
        keyword: (initialFormParams?.keyword as string) || '',
        dateRange: initialFormParams?.dateRange as
          | { from: string; to: string }
          | undefined,
      },
    ],
  });

  const handleSearch = (values: OperationLogSearchForm) => {
    run({ current: 1, pageSize: 10 }, values);
    onParamsChange?.(values);
  };

  const handleReset = () => {
    reset();
    onParamsChange?.({
      adminId: '',
      operationType: 'ALL',
      keyword: '',
      dateRange: undefined,
    });
  };

  // --- 表格列定义 ---
  const columns: ProColumns<AdminOperationLog>[] = useMemo(
    () => [
      {
        title: 'Admin User',
        dataIndex: 'adminUser',
        render: (_, row) => (
          <div>
            <div className="font-medium">{row.adminUser?.username || 'N/A'}</div>
            <div className="text-xs text-gray-500 font-mono">
              ID: {row.adminUser?.id || 'N/A'}
            </div>
          </div>
        ),
      },
      {
        title: 'Operation Type',
        dataIndex: 'operationType',
        render: (type) => (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {type}
          </span>
        ),
      },
      {
        title: 'Target / Description',
        dataIndex: 'targetId',
        render: (_, row) => (
          <div>
            <div className="font-medium">{row.description}</div>
            {row.targetId && (
              <div className="text-xs text-gray-500 font-mono">
                Target ID: {row.targetId}
              </div>
            )}
          </div>
        ),
      },
      {
        title: 'IP Address',
        dataIndex: 'ipAddress',
        render: (ip) => (
          <span className="font-mono text-sm text-gray-700">{ip}</span>
        ),
      },
      {
        title: 'Timestamp',
        dataIndex: 'createdAt',
        valueType: 'dateTime',
        render: (date) => (
          <div className="text-xs text-gray-500">
            {date ? format(new Date(date as string), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
          </div>
        ),
      },
      {
        title: 'Details',
        valueType: 'option',
        width: 80,
        render: (_, row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              ModalManager.open({
                title: 'Operation Details',
                size: 'md',
                renderChildren: ({ close }) => (
                  <div className="p-4 space-y-2">
                    <p>
                      <strong>Admin:</strong> {row.adminUser?.username} (ID:{' '}
                      {row.adminUser?.id})
                    </p>
                    <p>
                      <strong>Type:</strong> {row.operationType}
                    </p>
                    <p>
                      <strong>Description:</strong> {row.description}
                    </p>
                    <p>
                      <strong>Target ID:</strong> {row.targetId || 'N/A'}
                    </p>
                    <p>
                      <strong>IP:</strong> {row.ipAddress}
                    </p>
                    <p>
                      <strong>Time:</strong>{' '}
                      {row.createdAt
                        ? format(
                            new Date(row.createdAt as string),
                            'yyyy-MM-dd HH:mm:ss',
                          )
                        : 'N/A'}
                    </p>
                    {row.oldValue && (
                      <div>
                        <strong>Old Value:</strong>{' '}
                        <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(row.oldValue, null, 2)}
                        </pre>
                      </div>
                    )}
                    {row.newValue && (
                      <div>
                        <strong>New Value:</strong>{' '}
                        <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(row.newValue, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div className="flex justify-end mt-4">
                      <Button onClick={close}>Close</Button>
                    </div>
                  </div>
                ),
              })
            }
          >
            View
          </Button>
        ),
      },
    ],
    [],
  );

  // --- 搜索表单配置 ---
  const searchSchema: FormSchema[] = useMemo(
    () => [
      {
        type: 'input',
        key: 'keyword',
        label: 'Keyword',
        placeholder: 'Admin ID, Username, Description, Target ID',
      },
      {
        type: 'select',
        key: 'operationType',
        label: 'Operation Type',
        defaultValue: 'ALL',
        options: [
          { label: 'All Types', value: 'ALL' },
          { label: 'Login', value: 'LOGIN' },
          { label: 'Logout', value: 'LOGOUT' },
          { label: 'Create', value: 'CREATE' },
          { label: 'Update', value: 'UPDATE' },
          { label: 'Delete', value: 'DELETE' },
          { label: 'Audit', value: 'AUDIT' },
          { label: 'Export', value: 'EXPORT' },
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operation Logs"
        description="Track all administrative actions within the system."
      />
      <Card>
        <div className="p-4">
          <SmartTable<AdminOperationLog>
            headerTitle={
              <div className="flex items-center gap-2">
                <FileText className="text-primary-500" size={20} />
                <span className="font-semibold text-lg">Audit Trail</span>
              </div>
            }
            rowKey="id"
            ref={actionRef}
            columns={columns}
            searchSchema={searchSchema}
            initialFormParams={initialFormParams}
            onParamsChange={onParamsChange}
            request={getTableData}
          />
        </div>
      </Card>
    </div>
  );
};
