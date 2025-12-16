import {
  WITHDRAW_STATUS,
  WithdrawStatus,
  RECHARGE_STATUS,
} from '@lucky/shared';

export const STATUS_CONFIG = {
  [WITHDRAW_STATUS.PENDING_AUDIT as WithdrawStatus]: {
    color: 'yellow',
    label: 'Pending Audit',
  },
  [WITHDRAW_STATUS.SUCCESS as WithdrawStatus]: {
    color: 'green',
    label: 'Success',
  },
  [WITHDRAW_STATUS.REJECTED as WithdrawStatus]: {
    color: 'red',
    label: 'Rejected',
  },
  [WITHDRAW_STATUS.PROCESSING as WithdrawStatus]: {
    color: 'blue',
    label: 'Processing',
  },
} as const;

// 状态映射配置 (UI表现层)
export const DEPOSIT_STATUS_CONFIG: Record<
  number,
  { color: 'green' | 'red' | 'yellow' | 'gray' | 'blue'; label: string }
> = {
  [RECHARGE_STATUS.PENDING]: { color: 'yellow', label: 'Pending Payment' },
  [RECHARGE_STATUS.PROCESSING]: { color: 'blue', label: 'Processing' },
  [RECHARGE_STATUS.SUCCESS]: { color: 'green', label: 'Success' },
  [RECHARGE_STATUS.FAILED]: { color: 'red', label: 'Failed' },
  [RECHARGE_STATUS.CANCELED]: { color: 'gray', label: 'Cancelled' },
};

// 渠道筛选 Options
export const CHANNEL_OPTIONS = [
  { label: 'GCash', value: 'PH_GCASH' },
  { label: 'PayMaya', value: 'PH_PAYMAYA' },
  { label: 'GrabPay', value: 'PH_GRABPAY' },
  { label: 'Bank Transfer', value: 'PH_BDO' },
];
