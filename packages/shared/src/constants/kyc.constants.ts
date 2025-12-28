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

export const ID_TYPE_ALIASES = Object.freeze({
  PASSPORT: "PASSPORT",
  PH_PASSPORT: "PASSPORT",

  PH_DRIVER_LICENSE: "PH_DRIVER_LICENSE",
  PH_DRIVERS_LICENSE: "PH_DRIVER_LICENSE",
  DRIVER_LICENSE: "PH_DRIVER_LICENSE",
  DRIVERS_LICENSE: "PH_DRIVER_LICENSE",
  DRIVING_LICENSE: "PH_DRIVER_LICENSE",
  PH_DL: "PH_DRIVER_LICENSE",
  DL: "PH_DRIVER_LICENSE",

  PH_UMID: "PH_UMID",
  UMID: "PH_UMID",

  PH_NATIONAL_ID: "PH_NATIONAL_ID",
  NATIONAL_ID: "PH_NATIONAL_ID",
  PHILSYS: "PH_NATIONAL_ID",
  PHILIPPINE_NATIONAL_ID: "PH_NATIONAL_ID",

  // 未来证件（你 enum 已预留）
  PH_PRC_ID: "PH_PRC_ID",
  PRC_ID: "PH_PRC_ID",
  PROFESSIONAL_REGULATION_COMMISSION: "PH_PRC_ID",

  PH_POSTAL_ID: "PH_POSTAL_ID",
  POSTAL_ID: "PH_POSTAL_ID",

  CN_ID: "CN_ID",
  CHINA_ID: "CN_ID",
  PRC_CITIZEN_ID: "CN_ID",
  CHINESE_ID: "CN_ID",

  VN_ID: "VN_ID",
  VIETNAM_ID: "VN_ID",
  VIETNAMESE_ID: "VN_ID",
} as const);

// 规范字符串 -> DB enum int
export const ID_TYPE_CODE: Record<string, KycIdCardType> = Object.freeze({
  UNKNOWN: KycIdCardType.UNKNOWN,
  PASSPORT: KycIdCardType.PASSPORT,
  PH_DRIVER_LICENSE: KycIdCardType.PH_DRIVER_LICENSE,
  PH_UMID: KycIdCardType.PH_UMID,
  PH_NATIONAL_ID: KycIdCardType.PH_NATIONAL_ID,
  PH_PRC_ID: KycIdCardType.PH_PRC_ID,
  PH_POSTAL_ID: KycIdCardType.PH_POSTAL_ID,
  CN_ID: KycIdCardType.CN_ID,
  VN_ID: KycIdCardType.VN_ID,
});

export function normalizeTypeText(v: any): string {
  const s = String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");

  return (ID_TYPE_ALIASES as any)[s] ?? "UNKNOWN";
}

export function toKycIdCardType(typeText: string): KycIdCardType {
  return ID_TYPE_CODE[typeText] ?? KycIdCardType.UNKNOWN;
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
