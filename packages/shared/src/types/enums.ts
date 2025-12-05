/** KYC状态: 0-未认证 1-审核中 2-审核失败 3-待补充 4-已认证 */
export const KYC_STATUS = {
  /** 未认证 */ UNVERIFIED: 0,
  /** 审核中 */ REVIEWING: 1,
  /** 审核失败 */ REJECTED: 2,
  /** 待补充资料 */ PENDING_INFO: 3,
  /** 已认证 */ VERIFIED: 4,
} as const;
export type KycStatusNum = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];

/** 登录类型: 1-密码登录 2-短信验证码 3-第三方登录 */
export const LOGIN_TYPE = {
  /** 密码登录 */ PASSWORD: 1,
  /** 短信验证码 */ OTP: 2,
  /** 第三方登录 */ OAUTH: 3,
} as const;
export type LoginTypeNum = (typeof LOGIN_TYPE)[keyof typeof LOGIN_TYPE];

/** 登录方式: password/google/facebook */
export const LOGIN_METHOD = {
  PASSWORD: "password",
  GOOGLE: "google",
  FACEBOOK: "facebook",
  OTP: "OTP",
  // 需要的话可以加 APPLE、GITHUB 等
} as const;
export type LoginMethodStr = (typeof LOGIN_METHOD)[keyof typeof LOGIN_METHOD];

/** 登录状态: 1-成功 2-失败 */
export const LOGIN_STATUS = {
  /** 成功 */ SUCCESS: 1,
  /** 失败 */ FAILED: 2,
} as const;
export type LoginStatusNum = (typeof LOGIN_STATUS)[keyof typeof LOGIN_STATUS];

/** 是否颁发Token: 0-否 1-是 */
export const TOKEN_ISSUED = {
  /** 否 */ NO: 0,
  /** 是 */ YES: 1,
} as const;
export type TokenIssuedNum = (typeof TOKEN_ISSUED)[keyof typeof TOKEN_ISSUED];

/** 第三方平台: google/facebook/apple */
export const PROVIDER = {
  GOOGLE: "google",
  FACEBOOK: "facebook",
  APPLE: "apple",
} as const;
export type ProviderStr = (typeof PROVIDER)[keyof typeof PROVIDER];

/** 绑定状态: 0-已解绑 1-已绑定 */
export const BIND_STATUS = {
  /** 已解绑 */ UNBOUND: 0,
  /** 已绑定 */ BOUND: 1,
} as const;
export type BindStatusNum = (typeof BIND_STATUS)[keyof typeof BIND_STATUS];

/** 发送状态: 1-待发送 2-已发送 3-发送失败 */
export const SEND_STATUS = {
  /** 待发送 */ PENDING: 1,
  /** 已发送 */ SENT: 2,
  /** 发送失败 */ FAILED: 3,
} as const;
export type SendStatusNum = (typeof SEND_STATUS)[keyof typeof SEND_STATUS];

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN", // 超级管理员
  ADMIN = "ADMIN", // 普通管理员
  EDITOR = "EDITOR", // 编辑
  VIEWER = "VIEWER", // 观察者
}

export const ADMIN_USER_STATUS = {
  ACTIVE: 1, // 启用
  INACTIVE: 0, //禁用
} as const;
