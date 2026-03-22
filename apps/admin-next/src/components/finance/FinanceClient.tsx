'use client';

/**
 * FinanceClient — Client Component
 * Phase 3: URL searchParams 驱动 filter
 */
import React, { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FinancePage } from './FinancePageClient';

export function FinanceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── URL → 初始 filter 参数 ──────────────────────────────────
  const urlFilterParams = useMemo(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'pageSize' && value) {
        params[key] = value;
      }
    });
    return params;
  }, [searchParams]);

  // ── filter 变化 → 更新 URL ──────────────────────────────────
  const handleParamsChange = useCallback(
    (formData: Record<string, unknown>) => {
      const qs = new URLSearchParams();

      // 先保留当前 URL 中除了表单字段之外的参数（比如 tab）
      // 如果 formData 中传了新的 tab，则会被下面覆盖
      searchParams.forEach((value, key) => {
        if (key === 'tab') {
          qs.set(key, value);
        }
      });

      Object.entries(formData).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== '' &&
          value !== 'ALL'
        ) {
          qs.set(key, String(value));
        } else if (value === '' || value === 'ALL') {
          // 如果字段被清空了，则从 qs 中移除
          qs.delete(key);
        }
      });
      const newUrl = qs.toString() ? `/finance?${qs.toString()}` : '/finance';
      router.replace(newUrl, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <FinancePage
      initialFormParams={urlFilterParams}
      onParamsChange={handleParamsChange}
    />
  );
}
