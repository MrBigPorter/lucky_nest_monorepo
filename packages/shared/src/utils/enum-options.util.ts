export interface EnumOption<T extends number | string = number> {
  label: string;
  value: T;
}

/**
 * 从 labelMap 生成 options
 * 适用于：Record<number, string>
 *
 * 例如：
 *  const ORDER_STATUS_LABEL = { 1: 'Pending', 2: 'Paid' } as const;
 *  const OPTIONS = buildOptionsFromLabelMap(ORDER_STATUS_LABEL);
 */
export function buildOptionsFromLabelMap<T extends number>(
  labelMap: Record<T, string>,
): EnumOption<T>[] {
  return (Object.entries(labelMap) as [string, string][]).map(
    ([rawValue, label]) => ({
      label,
      value: Number(rawValue) as T,
    }),
  );
}
