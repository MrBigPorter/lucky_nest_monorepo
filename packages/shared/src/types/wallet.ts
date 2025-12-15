export const TRANSACTION_TYPE = {
  // 1=充值 2=消费 3=退款 4=奖励 5=提现 6=金币兑换 7=邀请奖励
  RECHARGE: 1,
  CONSUMPTION: 2,
  REFUND: 3,
  REWARD: 4,
  WITHDRAWAL: 5,
  COIN_EXCHANGE: 6,
  INVITE_REWARD: 7,
  SYSTEM_DEDUCT: 8,
} as const;

export type TansactionTypeKey = keyof typeof TRANSACTION_TYPE;
export type TransactionTypeValue = (typeof TRANSACTION_TYPE)[TansactionTypeKey];
export const TRANSACTION_TYPE_LABEL = Object.fromEntries(
  Object.entries(TRANSACTION_TYPE).map(([key, value]) => [value, key]),
) as Record<TransactionTypeValue, string>;

export const BALANCE_TYPE = {
  // 1=现金 2=金币
  CASH: 1,
  COIN: 2,
} as const;

export type BalanceTypeKey = keyof typeof BALANCE_TYPE;
export type BalanceTypeValue = (typeof BALANCE_TYPE)[BalanceTypeKey];
export const BALANCE_TYPE_LABEL = Object.fromEntries(
  Object.entries(BALANCE_TYPE).map(([key, value]) => [value, key]),
) as Record<BalanceTypeValue, string>;

export const DIRECTION = {
  // 方向：1=收入 2=支出
  INCOME: 1,
  EXPENDITURE: 2,
};

export type DirectionKey = keyof typeof DIRECTION;
export type DirectionValue = (typeof DIRECTION)[DirectionKey];

export const TRANSACTION_STATUS = {
  // 1=成功 2=失败 3=处理中
  SUCCESS: 1,
  FAILED: 2,
  PROCESSING: 3,
} as const;

export type TransactionStatusKey = keyof typeof TRANSACTION_STATUS;
export type TransactionStatusValue =
  (typeof TRANSACTION_STATUS)[TransactionStatusKey];
