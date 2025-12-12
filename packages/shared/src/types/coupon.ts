import {
  buildOptionsFromLabelMap,
  EnumOption,
} from "../utils/enum-options.util";

/** 优惠券类型 */
export const COUPON_TYPE = {
  /** 满减券：满 X 减 Y */
  FULL_REDUCTION: 1,
  /** 折扣券：打折，如 8 折 */
  DISCOUNT: 2,
  /** 无门槛：直接减 */
  NO_THRESHOLD: 3,
} as const;

export type CouponType = (typeof COUPON_TYPE)[keyof typeof COUPON_TYPE];
export const COUPON_TYPE_VALUES: CouponType[] = Object.values(COUPON_TYPE);

export const COUPON_TYPE_LABEL: Record<CouponType, string> = {
  [COUPON_TYPE.FULL_REDUCTION]: 'Full reduction',
  [COUPON_TYPE.DISCOUNT]: 'Discount',
  [COUPON_TYPE.NO_THRESHOLD]: 'No threshold',
};

export const COUPON_TYPE_OPTIONS: EnumOption<CouponType>[] =
  buildOptionsFromLabelMap(COUPON_TYPE_LABEL);

/** 折扣类型 */
export const DISCOUNT_TYPE = {
  /** 固定金额：10.00 这种 */
  FIXED_AMOUNT: 1,
  /** 百分比：0.8 / 0.9 这种 */
  PERCENTAGE: 2,
} as const;

export type DiscountType =
  (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE];
export const DISCOUNT_TYPE_VALUES: DiscountType[] =
  Object.values(DISCOUNT_TYPE);

export const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  [DISCOUNT_TYPE.FIXED_AMOUNT]: 'Fixed amount',
  [DISCOUNT_TYPE.PERCENTAGE]: 'Percentage',
};

export const DISCOUNT_TYPE_OPTIONS: EnumOption<DiscountType>[] =
  buildOptionsFromLabelMap(DISCOUNT_TYPE_LABEL);

/** 发放类型 */
export const ISSUE_TYPE = {
  /** 系统发放（运营后台直接发） */
  SYSTEM: 1,
  /** 主动领券（领券中心） */
  CLAIM: 2,
  /** 兑换码兑换 */
  REDEEM_CODE: 3,
  /** 邀请赠送 */
  INVITE: 4,
} as const;

export type IssueType = (typeof ISSUE_TYPE)[keyof typeof ISSUE_TYPE];
export const ISSUE_TYPE_VALUES: IssueType[] = Object.values(ISSUE_TYPE);

export const ISSUE_TYPE_LABEL: Record<IssueType, string> = {
  [ISSUE_TYPE.SYSTEM]: 'System',
  [ISSUE_TYPE.CLAIM]: 'Claim',
  [ISSUE_TYPE.REDEEM_CODE]: 'Redeem code',
  [ISSUE_TYPE.INVITE]: 'Invite',
};

export const ISSUE_TYPE_OPTIONS: EnumOption<IssueType>[] =
  buildOptionsFromLabelMap(ISSUE_TYPE_LABEL);

/** 有效期类型 */
export const VALID_TYPE = {
  /** 固定日期范围：validStartAt ~ validEndAt */
  RANGE: 1,
  /** 领券后 N 天内有效：validDays */
  DAYS_AFTER_RECEIVE: 2,
} as const;

export type ValidType = (typeof VALID_TYPE)[keyof typeof VALID_TYPE];
export const VALID_TYPE_VALUES: ValidType[] = Object.values(VALID_TYPE);

export const VALID_TYPE_LABEL: Record<ValidType, string> = {
  [VALID_TYPE.RANGE]: 'Fixed date range',
  [VALID_TYPE.DAYS_AFTER_RECEIVE]: 'Days after receive',
};

export const VALID_TYPE_OPTIONS: EnumOption<ValidType>[] =
  buildOptionsFromLabelMap(VALID_TYPE_LABEL);