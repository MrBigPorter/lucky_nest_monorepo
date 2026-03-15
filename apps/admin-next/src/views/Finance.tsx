'use client';

import React from 'react';
import { FinancePage } from './FinancePage';

// Finance 路由（/finance）直接使用已对接真实 API 的 FinancePage
// 原 mock 版本因依赖不存在的 MOCK_RECHARGE_PLANS 等常量已废弃
export const Finance: React.FC = () => {
  return <FinancePage />;
};
