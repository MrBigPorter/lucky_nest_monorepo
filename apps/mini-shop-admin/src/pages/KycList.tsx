import React, { useCallback, useMemo, useRef } from 'react';
import { Button, ModalManager } from '@repo/ui';
import {
  ActionType,
  ProColumns,
  SmartTable,
} from '@/components/scaffold/SmartTable';
import { KycAuditModal } from './kyc/KycAuditModal';
import { Eye, Shield } from 'lucide-react';
import { FormSchema } from '@/type/search';
import { KycRecord, KycRecordListParams } from '@/type/types.ts';
import {
  KYC_STATUS,
  KycIdCardType,
  KycIdCardTypeLabel,
  KycIdTypesList,
} from '@lucky/shared';
import { Badge, BadgeVariant } from '@repo/ui/components/ui/badge.tsx';
import { kycApi } from '@/api';
import { Card } from '@/components/UIComponents.tsx';

export const KycList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  // 打开审核弹窗
  const handleView = useCallback((record: KycRecord) => {
    ModalManager.open({
      title: 'KYC Audit Detail',
      size: 'xl',
      renderChildren: ({ close }) => (
        <KycAuditModal
          data={record}
          close={close}
          reload={() => actionRef.current?.reload()}
        />
      ),
    });
  }, []);

  // 状态映射配置
  const statusConfig = useMemo(
    () => ({
      [KYC_STATUS.DRAFT]: { label: 'Draft', color: 'secondary' },
      [KYC_STATUS.REVIEWING]: { label: 'Reviewing', color: 'primary' }, // Blue
      [KYC_STATUS.APPROVED]: { label: 'Approved', color: 'success' }, // Green
      [KYC_STATUS.REJECTED]: { label: 'Rejected', color: 'danger' }, // Red
      [KYC_STATUS.NEED_MORE]: { label: 'Need More', color: 'warning' }, // Orange
      [KYC_STATUS.AUTO_REJECTED]: { label: 'Auto Rejected', color: 'danger' }, // Red
    }),
    [],
  );

  const columns: ProColumns<KycRecord>[] = useMemo(
    () => [
      {
        title: 'User',
        dataIndex: 'userId',
        render: (_, row) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {row.user?.nickname || 'Unknown'}
            </div>
            <div className="text-xs text-gray-500 font-mono">
              {row.user?.phone}
            </div>
          </div>
        ),
      },
      {
        title: 'Real Name / ID',
        dataIndex: 'realName',
        render: (_, row) => (
          <div>
            <div className="font-bold">{row.realName}</div>
            <div className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-white/10 px-1 rounded inline-block">
              {row.idNumber}
            </div>
          </div>
        ),
      },
      {
        title: 'ID Type',
        dataIndex: 'idType',
        render: (_, row) => {
          return KycIdCardTypeLabel[row?.idType as KycIdCardType] || 'Unknown';
        },
      },
      {
        title: 'Status',
        dataIndex: 'kycStatus',
        valueType: 'select',
        valueEnum: {
          0: { text: 'Draft', status: 'default' },
          1: { text: 'Reviewing', status: 'destructive' },
          2: { text: 'Rejected', status: 'success' },
          3: { text: 'Need More', status: 'warning' },
          4: { text: 'Approved', status: 'success' },
          5: { text: 'Auto Rejected', status: 'info' },
        },
        render: (_, row) => {
          const conf = statusConfig[row.kycStatus];
          return (
            <Badge variant={conf?.color as BadgeVariant}>{conf?.label}</Badge>
          );
        },
      },
      {
        title: 'Submitted At',
        dataIndex: 'submittedAt',
        valueType: 'dateTime',
      },
      {
        title: 'Action',
        valueType: 'option',
        width: 100,
        render: (_, row) => (
          <Button
            variant={
              row.kycStatus === KYC_STATUS.REVIEWING ? 'primary' : 'outline'
            }
            size="sm"
            onClick={() => handleView(row)}
          >
            {row.kycStatus === KYC_STATUS.REVIEWING ? (
              <>
                <Shield size={14} className="mr-1" /> Audit
              </>
            ) : (
              <>
                <Eye size={14} className="mr-1" /> View
              </>
            )}
          </Button>
        ),
      },
    ],
    [handleView, statusConfig],
  );

  const searchSchema: FormSchema[] = useMemo(
    () => [
      {
        type: 'input',
        key: 'userId',
        label: 'User ID',
        placeholder: 'Search User ID',
      },
      {
        type: 'select',
        key: 'kycStatus',
        label: 'Status',
        options: Object.entries(statusConfig).map(([k, v]) => ({
          label: v.label,
          value: k,
        })),
      },
      {
        type: 'select',
        key: 'idType',
        label: 'ID Type',
        options: KycIdTypesList.map((item) => ({
          label: item.label,
          value: String(item.value),
        })),
      },
      {
        type: 'date',
        key: 'dateRange',
        label: 'Submit Date',
        mode: 'range',
      },
    ],
    [statusConfig],
  );

  const requestKyc = useCallback(async (params: KycRecordListParams) => {
    // 转换 SmartTable 的参数适配后端 DTO
    const reqData = { ...params };
    if (reqData.dateRange) {
      reqData.startDate = reqData.dateRange.from;
      reqData.endDate = reqData.dateRange.to;
      delete reqData.dateRange;
    }
    const res = await kycApi.getRecords(reqData);
    return {
      data: res.list,
      total: res.total,
      success: true,
    };
  }, []);

  return (
    <Card>
      <div className="p-4">
        <SmartTable<KycRecord>
          headerTitle={
            <div className="flex items-center gap-2">
              <Shield className="text-primary-600" size={20} />
              <span>KYC Applications</span>
            </div>
          }
          rowKey="id"
          ref={actionRef}
          columns={columns}
          searchSchema={searchSchema}
          request={requestKyc}
        />
      </div>
    </Card>
  );
};
