import React, { useState } from 'react';
import { useRequest } from 'ahooks';
import { Button } from '@repo/ui';
import { financeApi } from '@/api';
import { WithdrawOrder } from '@/type/types';
import { AlertTriangle, User } from 'lucide-react';
import { NumHelper, WITHDRAW_STATUS, WithdrawStatus } from '@lucky/shared';

interface Props {
  data: WithdrawOrder;
  confirm: () => void;
}

export const WithdrawAuditModal: React.FC<Props> = ({ data, confirm }) => {
  const [remark, setRemark] = useState('');

  const { run, loading } = useRequest(financeApi.withdrawalsAudit, {
    manual: true,
    onSuccess: confirm,
  });

  const handleAudit = (status: WithdrawStatus) => {
    if (!remark) return; // 简单校验
    run({ withdrawId: data.withdrawId, status, remark });
  };

  return (
    <div className="space-y-6">
      {/* 1. 用户与订单概览 */}
      <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            {data.user?.avatar ? (
              <img src={data.user.avatar} className="rounded-full" alt="" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div>
            <div className="font-bold">{data.user?.nickname || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{data.user?.phone}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Withdraw Amount</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {NumHelper.formatMoney(data.withdrawAmount)}
          </div>
        </div>
      </div>

      {/* 2. 风控数据展示 (模拟数据) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 border rounded-lg bg-green-50 border-green-100">
          <div className="text-xs text-gray-500">Total Recharge</div>
          <div className="font-semibold text-green-700">₱54,000.00</div>
        </div>
        <div className="p-3 border rounded-lg bg-red-50 border-red-100">
          <div className="text-xs text-gray-500">Total Withdraw</div>
          <div className="font-semibold text-red-700">₱12,500.00</div>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-yellow-800 text-sm">
        <AlertTriangle size={16} className="mt-0.5" />
        <div>
          <strong>Risk Check:</strong> User IP changed 3 times in 24h. Manual
          verification recommended.
        </div>
      </div>

      {/* 3. 审核表单 */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Audit Remark</label>
        <textarea
          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          rows={3}
          placeholder="Enter audit opinion (Required for both Approve and Reject)"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="danger"
          className="flex-1"
          disabled={!remark}
          isLoading={loading}
          onClick={() => handleAudit(WITHDRAW_STATUS.REJECTED)}
        >
          Reject
        </Button>
        <Button
          variant="primary"
          className="flex-1 bg-green-600 hover:bg-green-700 border-green-600"
          disabled={!remark}
          isLoading={loading}
          onClick={() => handleAudit(WITHDRAW_STATUS.SUCCESS)}
        >
          Approve
        </Button>
      </div>
    </div>
  );
};
