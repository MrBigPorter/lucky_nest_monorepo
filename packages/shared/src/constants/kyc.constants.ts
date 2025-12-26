export const KYC_STATUS = {
  DRAFT: 0, // 未提交
  REVIEWING: 1, // 审核中
  REJECTED: 2, // 审核失败
  NEED_MORE: 3, // 待补充
  APPROVED: 4, // 已通过
} as const;

export type KycStatus = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];

export const OP_MODULE = {
  KYC: "KYC",
} as const;

export const OP_ACTION = {
  SUBMIT: "SUBMIT",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  NEED_MORE: "NEED_MORE",
} as const;

export type KycOpAction = (typeof OP_ACTION)[keyof typeof OP_ACTION];

// 定义证件类型的枚举，方便前端生成类型
export enum KycIdCardType {
  PASSPORT = "PASSPORT",
  PH_DRIVER_LICENSE = "PH_DRIVER_LICENSE",
  PH_UMID = "PH_UMID",
  PH_NATIONAL_ID = "PH_NATIONAL_ID",
  CN_ID = "CN_ID",
  VN_ID = "VN_ID",
  UNKNOWN = "UNKNOWN",
}
