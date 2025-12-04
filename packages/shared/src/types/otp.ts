/** 0=PENDING 1=VERIFIED 2=CONSUMED 3=EXPIRED 4=LOCKED */
export const VERIFY_STATUS = {
  PENDING: 0,
  VERIFIED: 1,
  CONSUMED: 2,
  EXPIRED: 3,
  LOCKED: 4,
} as const;
export type VerifyStatusNum =
  (typeof VERIFY_STATUS)[keyof typeof VERIFY_STATUS];

/** 1=注册 2=登录 3=改密 4=绑手机 5=提现 */
export const CODE_TYPE = {
  SIGNUP: 1,
  LOGIN: 2,
  RESET_PWD: 3,
  BIND_PHONE: 4,
  WITHDRAW: 5,
} as const;
export type CodeTypeNum = (typeof CODE_TYPE)[keyof typeof CODE_TYPE];
