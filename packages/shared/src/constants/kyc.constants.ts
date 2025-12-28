export const KYC_STATUS = {
  DRAFT: 0, // 未提交
  REVIEWING: 1, // 审核中
  REJECTED: 2, // 审核失败
  NEED_MORE: 3, // 待补充
  APPROVED: 4, // 已通过
  AUTO_REJECTED: 5, // 5: 系统拒绝(自动风控)
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
// src/common/constants/kyc.constant.ts

// 1. 定义数字枚举 (用于数据库存储和逻辑判断)
export enum KycIdCardType {
  UNKNOWN = 0,
  PASSPORT = 1,

  // 菲律宾证件 (建议预留 ID 段，例如 10-19)
  PH_DRIVER_LICENSE = 10,
  PH_UMID = 11,
  PH_NATIONAL_ID = 12,
  PH_PRC_ID = 13, // 以后加的
  PH_POSTAL_ID = 14, // 以后加的

  // 中国证件 (20-29)
  CN_ID = 20,

  // 越南证件 (30-39)
  VN_ID = 30,
}

// 2. 定义文案映射
export const KycIdCardTypeLabel: Record<KycIdCardType, string> = {
  [KycIdCardType.UNKNOWN]: "Unknown Type",
  [KycIdCardType.PASSPORT]: "Passport",

  [KycIdCardType.PH_DRIVER_LICENSE]: "Driver's License",
  [KycIdCardType.PH_UMID]: "Unified Multi-Purpose ID (UMID)",
  [KycIdCardType.PH_NATIONAL_ID]: "PhilSys ID (National ID)",
  [KycIdCardType.PH_PRC_ID]: "Professional Regulation Commission ID",
  [KycIdCardType.PH_POSTAL_ID]: "Postal ID",

  [KycIdCardType.CN_ID]: "Chinese Resident ID",
  [KycIdCardType.VN_ID]: "Vietnamese Citizen ID",
};

// 3. 定义前端下拉框需要的数据结构
export const KycIdTypesList = Object.keys(KycIdCardTypeLabel)
  .map((key) => Number(key)) // key 变成了 string "1", "10"，需要转回 number
  .filter((key) => !isNaN(key) && key !== 0) // 过滤掉 UNKNOWN
  .map((key) => ({
    value: key, // 10
    label: KycIdCardTypeLabel[key as KycIdCardType], // "Driver's License"
    // 你甚至可以在这里加 countryCode，方便前端联动
    country:
      key >= 20 && key < 30
        ? "CN"
        : key >= 30
          ? "VN"
          : key >= 10
            ? "PH"
            : "GLOBAL",
  }));

// 定义风险等级枚举
export const RiskLevel = {
  LOW: 0, // 0
  MEDIUM: 1, // 1
  HIGH: 2, // 2
};
