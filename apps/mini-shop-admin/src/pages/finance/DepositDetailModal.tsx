import React from 'react';
import { Copy, Code } from 'lucide-react';
import { Button } from '@repo/ui';
import { RechargeOrder } from '@/type/types';
import { NumHelper, TimeHelper } from '@lucky/shared';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

// 复用 TransactionDetailModal 里的 InfoRow 组件 (建议抽离到 components/InfoRow.tsx)
const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-gray-500">{label}</span>
    <div className="text-sm font-medium break-all">{value || '-'}</div>
  </div>
);

export const DepositDetailModal: React.FC<{
  data: RechargeOrder;
  close: () => void;
}> = ({ data, close }) => {
  const { copy } = useCopyToClipboard();

  return (
    <div className="space-y-6">
      {/* 金额概览 */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex justify-between items-center">
        <div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold">
            Total Paid
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {NumHelper.formatMoney(data.rechargeAmount)}
          </div>
        </div>
        {Number(data.bonusAmount) > 0 && (
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase">
              Included Bonus
            </div>
            <div className="font-bold text-emerald-600">
              +{NumHelper.formatMoney(data.bonusAmount)}
            </div>
          </div>
        )}
      </div>

      {/* 基础信息 */}
      <div className="grid grid-cols-2 gap-4">
        <InfoRow
          label="User"
          value={`${data.user?.nickname} (${data.user?.phone})`}
        />
        <InfoRow label="Channel" value={data.paymentChannel || 'N/A'} />

        <div className="col-span-2">
          <div className="text-xs text-gray-500 mb-1">Order No.</div>
          <div className="flex items-center gap-2 font-mono text-sm font-bold">
            {data.rechargeNo}
            <Copy
              size={12}
              className="cursor-pointer text-gray-400 hover:text-primary-500"
              onClick={() => copy(data.rechargeNo)}
            />
          </div>
        </div>

        {data.thirdPartyOrderNo && (
          <div className="col-span-2">
            <div className="text-xs text-gray-500 mb-1">
              Gateway Ref ID (Xendit)
            </div>
            <div className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-1.5 rounded select-all">
              {data.thirdPartyOrderNo}
            </div>
          </div>
        )}
      </div>

      {/* 支付时间线 */}
      <div className="border-t pt-4 border-gray-100 dark:border-white/10">
        <div className="grid grid-cols-2 gap-4">
          <InfoRow
            label="Created At"
            value={TimeHelper.formatDateTime(data.createdAt)}
          />
          <InfoRow
            label="Paid At"
            value={data.paidAt ? TimeHelper.formatDateTime(data.paidAt) : '-'}
          />
        </div>
      </div>

      {/* 🐛 调试区域：原始回调数据 */}
      {data.callbackData && (
        <div className="border-t pt-4 border-gray-100 dark:border-white/10">
          <div className="text-xs font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1">
            <Code size={12} /> Gateway Callback Log
          </div>
          <pre className="bg-gray-900 text-gray-200 p-3 rounded-lg text-[10px] font-mono overflow-auto max-h-[150px]">
            {JSON.stringify(data.callbackData, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={close} variant="outline">
          Close
        </Button>
      </div>
    </div>
  );
};
