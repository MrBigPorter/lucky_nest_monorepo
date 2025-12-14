// =======================
// Recharge
// =======================

import {
  buildOptionsFromLabelMap,
  EnumOption,
} from "../utils/enum-options.util";

/** 充值支付方式: 1-GCash 2-PayMaya ... */
export const RECHARGE_PAYMENT_METHOD = {
  GCASH: 1,
  PAYMAYA: 2,
  BANK_TRANSFER: 3,
  CARD: 4,
} as const;

export type RechargePaymentMethod =
  (typeof RECHARGE_PAYMENT_METHOD)[keyof typeof RECHARGE_PAYMENT_METHOD];

export const RECHARGE_PAYMENT_METHOD_VALUES: RechargePaymentMethod[] =
  Object.values(RECHARGE_PAYMENT_METHOD);

/** 充值状态: 1-待支付 2-支付中 3-充值成功 4-充值失败 5-已取消 */
export const RECHARGE_STATUS = {
  PENDING: 1,
  PROCESSING: 2,
  SUCCESS: 3,
  FAILED: 4,
  CANCELED: 5,
} as const;

export type RechargeStatus =
  (typeof RECHARGE_STATUS)[keyof typeof RECHARGE_STATUS];

export const RECHARGE_STATUS_VALUES: RechargeStatus[] =
  Object.values(RECHARGE_STATUS);

export const RECHARGE_PAYMENT_METHOD_LABEL: Record<
  RechargePaymentMethod,
  string
> = {
  [RECHARGE_PAYMENT_METHOD.GCASH]: "GCash",
  [RECHARGE_PAYMENT_METHOD.PAYMAYA]: "PayMaya",
  [RECHARGE_PAYMENT_METHOD.BANK_TRANSFER]: "Bank transfer",
  [RECHARGE_PAYMENT_METHOD.CARD]: "Credit/Debit Card",
};

export const RECHARGE_STATUS_LABEL: Record<RechargeStatus, string> = {
  [RECHARGE_STATUS.PENDING]: "Pending",
  [RECHARGE_STATUS.PROCESSING]: "Processing",
  [RECHARGE_STATUS.SUCCESS]: "Success",
  [RECHARGE_STATUS.FAILED]: "Failed",
  [RECHARGE_STATUS.CANCELED]: "Canceled",
};

export const RECHARGE_PAYMENT_METHOD_OPTIONS: EnumOption<RechargePaymentMethod>[] =
  buildOptionsFromLabelMap(RECHARGE_PAYMENT_METHOD_LABEL);

export const RECHARGE_STATUS_OPTIONS: EnumOption<RechargeStatus>[] =
  buildOptionsFromLabelMap(RECHARGE_STATUS_LABEL);

// =======================
// Withdraw
// =======================

/** 提现方式 (你 schema 里没写明，先按常见值占位，你可以随时改 label / 增删) */
export const WITHDRAW_METHOD = {
  GCASH: 1,
  PAYMAYA: 2,
  BANK: 3,
} as const;

export type WithdrawMethod =
  (typeof WITHDRAW_METHOD)[keyof typeof WITHDRAW_METHOD];

export const WITHDRAW_METHOD_VALUES: WithdrawMethod[] =
  Object.values(WITHDRAW_METHOD);

/** 提现状态: 1-待审核 2-审核通过 3-处理中 4-提现成功 5-审核拒绝 6-提现失败 */
export const WITHDRAW_STATUS = {
  PENDING_AUDIT: 1,
  APPROVED: 2,
  PROCESSING: 3,
  SUCCESS: 4,
  REJECTED: 5,
  FAILED: 6,
} as const;

export type WithdrawStatus =
  (typeof WITHDRAW_STATUS)[keyof typeof WITHDRAW_STATUS];

export const WITHDRAW_STATUS_VALUES: WithdrawStatus[] =
  Object.values(WITHDRAW_STATUS);

export const WITHDRAW_METHOD_LABEL: Record<WithdrawMethod, string> = {
  [WITHDRAW_METHOD.GCASH]: "GCash",
  [WITHDRAW_METHOD.PAYMAYA]: "PayMaya",
  [WITHDRAW_METHOD.BANK]: "Bank transfer",
};

export const WITHDRAW_STATUS_LABEL: Record<WithdrawStatus, string> = {
  [WITHDRAW_STATUS.PENDING_AUDIT]: "Pending audit",
  [WITHDRAW_STATUS.APPROVED]: "Approved",
  [WITHDRAW_STATUS.PROCESSING]: "Processing",
  [WITHDRAW_STATUS.SUCCESS]: "Success",
  [WITHDRAW_STATUS.REJECTED]: "Rejected",
  [WITHDRAW_STATUS.FAILED]: "Failed",
};

export const WITHDRAW_METHOD_OPTIONS: EnumOption<WithdrawMethod>[] =
  buildOptionsFromLabelMap(WITHDRAW_METHOD_LABEL);

export const WITHDRAW_STATUS_OPTIONS: EnumOption<WithdrawStatus>[] =
  buildOptionsFromLabelMap(WITHDRAW_STATUS_LABEL);
