/** UserDevice.status */
export const USER_DEVICE_STATUS = {
  NORMAL: 1,
  FROZEN: 0,
} as const;
export type UserDeviceStatus =
  (typeof USER_DEVICE_STATUS)[keyof typeof USER_DEVICE_STATUS];

/** Device trust */
export const DEVICE_TRUST = {
  TRUSTED: true,
  UNTRUSTED: false,
} as const;

/** Risk flags / detection thresholds (you can tune) */
export const DEVICE_RISK = {
  // 这台 deviceId 被多少不同用户使用过，就判定“一机多号风险”
  MULTI_ACCOUNT_USER_COUNT_THRESHOLD: 3,
} as const;
