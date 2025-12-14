/**
 * 资金流水关联业务类型 (Related Type)
 * 用于标识 wallet_transactions 表中的 related_id 到底是指向哪张表的
 */
export const RelatedType = {
  /** 购买订单 (指向 Order 表) */
  ORDER: "ORDER",

  /** 充值订单 (指向 RechargeOrder 表) */
  RECHARGE: "RECHARGE",

  /** 提现订单 (指向 WithdrawOrder 表) */
  WITHDRAWAL: "WITHDRAWAL",

  /** 管理员调账 (指向 AdminOperationLog 或 无关联) */
  ADMIN_ADJUST: "ADMIN_ADJUST",

  /** 抽奖/中奖 (指向 Treasure 或 Record 表) */
  LOTTERY: "LOTTERY",

  /** 佣金/返利 (指向 Invite/Group 表) */
  COMMISSION: "COMMISSION",
} as const;

// 导出类型，方便 TS 推导
export type RelatedType = (typeof RelatedType)[keyof typeof RelatedType];
