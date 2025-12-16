import React, { useMemo, useState } from 'react';
import { useRequest } from 'ahooks';
import { Button } from '@repo/ui';
import { financeApi } from '@/api';
import { User, CreditCard, ArrowRight, Clock, Copy, Hash } from 'lucide-react';
import {
  NumHelper,
  TimeHelper,
  WITHDRAW_STATUS,
  WithdrawStatus,
} from '@lucky/shared';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { WithdrawOrder } from '@/type/types.ts'; // Assuming you have this from previous steps

interface Props {
  data: WithdrawOrder;
  confirm: () => void;
}
export const WithdrawAuditModal: React.FC<Props> = ({ data, confirm }) => {
  const [remark, setRemark] = useState('');
  const { copy } = useCopyToClipboard();

  const { run, loading } = useRequest(financeApi.withdrawalsAudit, {
    manual: true,
    onSuccess: () => {
      confirm();
    },
  });

  const handleAudit = (status: WithdrawStatus) => {
    run({ withdrawId: data.withdrawId, status, remark });
  };

  const isWaitForAudit = useMemo(() => {
    return data.withdrawStatus === WITHDRAW_STATUS.PENDING_AUDIT;
  }, [data.withdrawStatus]);

  return (
    <div className="space-y-5">
      {/* 1. Header: ID & Time */}
      <div className="flex justify-between items-center text-xs text-gray-400 border-b border-gray-100 pb-3 dark:border-white/10">
        <div className="flex items-center gap-1 font-mono">
          <Hash size={12} />
          {data.withdrawNo}
          <Copy
            size={12}
            className="cursor-pointer hover:text-primary-500"
            onClick={() => copy(data.withdrawNo, 'Withdraw No')}
          />
        </div>
        <div className="flex items-center gap-1">
          <Clock size={12} />
          Applied: {TimeHelper.formatDateTime(data.appliedAt)}
        </div>
      </div>

      {/* 2. User Info & Account Target */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Who is withdrawing? */}
        <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <User size={16} className="text-gray-500" />
            <span className="text-sm font-bold">User Info</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {/* Note: DTO `user` structure might need checking if it has avatar, otherwise fallback */}
              <User size={16} className="text-gray-500" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold truncate">
                {data.user?.nickname || 'Unknown'}
              </div>
              <div className="text-xs text-gray-500">{data.user?.phone}</div>
            </div>
          </div>
        </div>

        {/* Right: Where is money going? (Crucial for Audit) */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg space-y-3">
          <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400">
            <CreditCard size={16} />
            <span className="text-sm font-bold">Target Account</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Channel:</span>
              <span className="text-xs font-bold">{data.withdrawMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Name:</span>
              <span className="text-xs font-medium">{data.accountName}</span>
            </div>
            <div className="pt-1 border-t border-blue-100 dark:border-white/10 mt-1">
              <div className="text-xs text-gray-500">Account No:</div>
              <div className="text-sm font-mono font-bold flex items-center gap-2">
                {data.withdrawAccount}
                <Copy
                  size={12}
                  className="cursor-pointer text-gray-400 hover:text-blue-500"
                  onClick={() => copy(data.withdrawAccount, 'Account No')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Financial Breakdown */}
      <div className="bg-white dark:bg-black/20 border border-gray-100 dark:border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          {/* Request Amount */}
          <div className="text-left">
            <div className="text-xs text-gray-500 mb-1">Request Amount</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-300">
              {NumHelper.formatMoney(data.withdrawAmount)}
            </div>
          </div>

          {/* Fee */}
          <div className="flex flex-col items-center px-4">
            <ArrowRight size={16} className="text-gray-300 mb-1" />
            <div className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded-full">
              - Fee: {NumHelper.formatMoney(data.feeAmount)}
            </div>
          </div>

          {/* Actual Payout */}
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Actual Payout</div>
            <div className="text-2xl font-bold text-primary-600">
              {NumHelper.formatMoney(data.actualAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Audit Action */}
      <div className="space-y-3 pt-2">
        <label className="text-sm font-medium flex justify-between">
          <span>Audit Remark</span>
          <span className="text-xs text-gray-400 font-normal">Required*</span>
        </label>
        <textarea
          className="w-full border border-gray-200 dark:border-white/20 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-transparent"
          disabled={!isWaitForAudit}
          rows={3}
          placeholder="Enter audit opinion..."
          value={isWaitForAudit ? remark : data.auditResult}
          onChange={(e) => setRemark(e.target.value)}
        />
      </div>

      {isWaitForAudit && (
        <div className="flex gap-3 pt-2">
          <Button
            variant="danger"
            className="flex-1"
            disabled={!remark} // Force remark for safety, or change logic if needed
            isLoading={loading}
            onClick={() => handleAudit(WITHDRAW_STATUS.REJECTED)}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            isLoading={loading}
            // Approve might not strictly need a remark, but good for records
            onClick={() => handleAudit(WITHDRAW_STATUS.SUCCESS)}
          >
            Approve Payout
          </Button>
        </div>
      )}
    </div>
  );
};
