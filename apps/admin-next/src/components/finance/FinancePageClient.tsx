'use client';

/**
 * FinancePage — Client Component（Tabs only）
 * Stage 4: Stats 已抽离到 FinanceStatsServer（async Server Component）
 * 本组件只负责 Tab 切换 + 列表渲染，不再拉取 statistics。
 */
import React, { useState, useEffect, useMemo } from 'react';
import { TransactionList } from '@/views/finance/TransactionList';
import { WithdrawalList } from '@/views/finance/WithdrawalList';
import { DepositList } from '@/views/finance/DepositList';
import { FileText, ArrowRightLeft, TrendingUp } from 'lucide-react';

interface FinancePageProps {
  initialFormParams?: Record<string, unknown>;
  onParamsChange?: (params: Record<string, unknown>) => void;
}

type FinanceTab = 'deposits' | 'transactions' | 'withdrawals';

const isFinanceTab = (value: unknown): value is FinanceTab =>
  value === 'deposits' || value === 'transactions' || value === 'withdrawals';

export const FinancePage: React.FC<FinancePageProps> = ({
  initialFormParams,
  onParamsChange,
}) => {
  const initialTab = isFinanceTab(initialFormParams?.tab)
    ? initialFormParams.tab
    : 'transactions';
  const [activeTab, setActiveTab] = useState<FinanceTab>(initialTab);

  // `tab` is page UI state only; do not pass it into list query params.
  const listInitialParams = useMemo(() => {
    const rest = { ...(initialFormParams ?? {}) };
    delete rest.tab;
    return rest;
  }, [initialFormParams]);

  // 当 Tab 切换时同步更新 URL
  useEffect(() => {
    onParamsChange?.({ tab: activeTab });
  }, [activeTab, onParamsChange]);

  return (
    <div className="flex flex-col space-y-6">
      {/* Tab 导航 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          <TabButton
            isActive={activeTab === 'transactions'}
            onClick={() => setActiveTab('transactions')}
            icon={<ArrowRightLeft size={18} />}
            label="Transactions Flow"
          />
          <TabButton
            isActive={activeTab === 'deposits'}
            onClick={() => setActiveTab('deposits')}
            icon={<TrendingUp size={18} />}
            label="Deposit Records"
          />
          <TabButton
            isActive={activeTab === 'withdrawals'}
            onClick={() => setActiveTab('withdrawals')}
            icon={<FileText size={18} />}
            label="Withdrawal Audits"
          />
        </nav>
      </div>

      {/* 内容区域 */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/10 min-h-[600px] transition-all">
        {activeTab === 'deposits' && (
          <DepositList
            initialFormParams={listInitialParams}
            onParamsChange={(params) =>
              onParamsChange?.({ ...params, tab: 'deposits' })
            }
          />
        )}
        {activeTab === 'transactions' && <TransactionList />}
        {activeTab === 'withdrawals' && (
          <WithdrawalList
            initialFormParams={listInitialParams}
            onParamsChange={(params) =>
              onParamsChange?.({ ...params, tab: 'withdrawals' })
            }
          />
        )}
      </div>
    </div>
  );
};

// --- 子组件：Tab 按钮 ---
const TabButton = ({
  isActive,
  onClick,
  icon,
  label,
  badge,
}: {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) => (
  <button
    onClick={onClick}
    className={`
      group relative py-4 px-1 flex items-center gap-2 text-sm font-medium transition-all duration-200 ease-in-out
      ${
        isActive
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-b-2 border-transparent hover:border-gray-300'
      }
    `}
  >
    <span
      className={`transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300'}`}
    >
      {icon}
    </span>
    {label}
    {badge && (
      <span className="ml-2 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300 py-0.5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wide">
        {badge}
      </span>
    )}
  </button>
);
