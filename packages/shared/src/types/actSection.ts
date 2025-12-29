/**
 * 活动专区状态
 * @enum {number}
 */
export const ACT_SECTION_STATUS = {
  ENABLE: 1, // 启用
  DISABLE: 0, // 下架
} as const;

const SECTION_TYPE_LABELS: Record<number, string> = {
  1: "Ending (Horizontal)",
  2: "Special Area (List)",
  3: "Home Future (Big Cards)",
  4: "Recommendation (Grid)",
};

export function getActSectionTypeLabel(type: number): string {
  return SECTION_TYPE_LABELS[type] || "Unknown";
}

export type ActSectionStatus =
  (typeof ACT_SECTION_STATUS)[keyof typeof ACT_SECTION_STATUS];
