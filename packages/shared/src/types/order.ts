export const ORDER_STATUS = {
  /// 订单状态: 1-待支付 2-支付中 3-已支付 4-已取消 5-已退款
  PENDING_PAYMENT: 1,
  PROCESSING_PAYMENT: 2,
  PAID: 3,
  CANCELED: 4,
  REFUNDED: 5,
};

export const PAY_STATUS = {
  /// 支付状态: 0-未支付 1-已支付 2-支付失败
  UNPAID: 0,
  PAID: 1,
  FAILED: 2,
};

export const REFUND_STATUS = {
  /// 退款状态: 0-未退款 1-退款中 2-已退款 3-退款失败
  NO_REFUND: 0,
  REFUNDING: 1,
  REFUNDED: 2,
  REFUND_FAILED: 3,
};

export const ORDER_STATUS_LABEL: Record<number, string> = {
  [ORDER_STATUS.PENDING_PAYMENT]: "Pending",
  [ORDER_STATUS.PROCESSING_PAYMENT]: "Processing",
  [ORDER_STATUS.PAID]: "Paid",
  [ORDER_STATUS.CANCELED]: "Cancelled",
  [ORDER_STATUS.REFUNDED]: "Refunded",
};

export const PAY_STATUS_LABEL: Record<number, string> = {
  [PAY_STATUS.UNPAID]: "Unpaid",
  [PAY_STATUS.PAID]: "Paid",
  [PAY_STATUS.FAILED]: "Failed",
};

export const REFUND_STATUS_LABEL: Record<number, string> = {
  [REFUND_STATUS.NO_REFUND]: "No refund",
  [REFUND_STATUS.REFUNDING]: "Refunding",
  [REFUND_STATUS.REFUNDED]: "Refunded",
  [REFUND_STATUS.REFUND_FAILED]: "Refund failed",
};
