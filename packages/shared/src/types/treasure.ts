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
 * 2: INACTIVE
 */
export const GROUP_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
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
