import { WITHDRAW_STATUS, WithdrawStatus } from '@lucky/shared';

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
