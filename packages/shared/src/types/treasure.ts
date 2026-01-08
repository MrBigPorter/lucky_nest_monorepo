/*
   TreasureState
   1: Active 上架
   0: Inactive 下架
 */
export const TREASURE_STATE = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

/**
 * TreasureVirtual
 *   1: VIRTUAL 虚拟
 *   2: REAL 实物
 */
export const TREASURE_VIRTUAL = {
  VIRTUAL: 1,
  REAL: 2,
} as const;

/**
 * TreasureLotteryMode
 * 1： SOLD_OUT，
 * 2: TIMED
 */
export const LOTTERY_MODE = {
  SOLD_OUT: 1,
  TIMED: 2,
} as const;

/**
 * TreasureLotteryDelayState
 * 0: NO
 * 1: YES
 */
export const LOTTERY_DELAY_STATE = {
  NO: 0,
  YES: 1,
} as const;

/**
 * TreasureGroupStatus
 * 1: ACTIVE
 * 2: SUCCESS
 * 3: FAILED
 *
 */
export const GROUP_STATUS = {
  ACTIVE: 1,
  SUCCESS: 2,
  FAILED: 3,
} as const;

/**
 * IS_OWNER
 * 1: YES
 * 0: NO
 */
export const IS_OWNER = {
  YES: 1,
  NO: 0,
} as const;

export enum SectionKey {
  SPECIAL = "home_special",
  NEW_USER = "home_new_user",
  APPLE = "home_apple_zone",
  ENDING = "home_ending",
  FEATURED = "home_featured",
  RECOMMEND = "home_recommend",
}

export enum TreasureFilterType {
  ALL = "ALL", // 全部 (默认)
  ON_SALE = "ON_SALE", // 正在热卖 (排除预售和过期)
  PRE_SALE = "PRE_SALE", // 即将开始 (预售)
  NOT_EXPIRED = "NOT_EXPIRED", // 未过期 (包含热卖和预售)
}
