'use client';

import React, { useState, useEffect } from 'react';
import { TransactionList } from './finance/TransactionList';
import { WithdrawalList } from './finance/WithdrawalList';
import { DepositList } from './finance/DepositList';
import {
  Wallet,
  FileText,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCcw,
} from 'lucide-react';
import { NumHelper } from '@lucky/shared';
import { useRequest } from 'ahooks';
import { financeApi } from '@/api';

interface FinancePageProps {
  initialFormParams?: Record<string, unknown>;
  onParamsChange?: (params: Record<string, unknown>) => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({
  initialFormParams,
  onParamsChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    'deposits' | 'transactions' | 'withdrawals'
  >((initialFormParams?.tab as any) || 'transactions');

  // 当 Tab 切换时同步更新 URL
  useEffect(() => {
    onParamsChange?.({ tab: activeTab });
  }, [activeTab, onParamsChange]);

  const {
    data: statistics,
    refresh: refreshStatistics,
    loading,
  } = useRequest(financeApi.getStatistics);

  console.log('FinancePage statistics:', statistics);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. 顶部 Hero 区域：深色金融风格 */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl ring-1 ring-white/10">
        {/* 背景装饰光晕 */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[300px] w-[300px] rounded-full bg-purple-600/20 blur-[80px] pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 text-white tracking-tight">
                <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-md border border-blue-400/20">
                  <Wallet className="text-blue-400 h-6 w-6" />
                </div>
                Finance Center
              </h1>
              <p className="text-slate-400 mt-2 text-sm md:text-base max-w-xl">
                Global financial overview. Monitor deposit inflows, audit
                pending withdrawals, and track real-time liquidity.
              </p>
            </div>

            <button
              onClick={refreshStatistics}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-slate-300 transition-all hover:text-white"
            >
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh Data
            </button>
          </div>

          {/* 核心指标卡片 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Pending Withdrawals"
              amount={statistics?.pendingWithdraw || '0.00'}
              icon={<Clock size={20} className="text-amber-400" />}
              trend="Requires Audit"
              isTrend={false}
              colorClass="bg-amber-500/10 border-amber-500/20 text-amber-400"
              loading={loading}
            />
            <StatsCard
              title="Total Deposits"
              amount={statistics?.totalDeposit || '0.00'}
              isTrend={true}
              trend={`${statistics?.depositTrend}`}
              colorClass="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              loading={loading}
            />
            <StatsCard
              title="Total Withdrawals"
              amount={statistics?.totalWithdraw || '0.00'}
              isTrend={true}
              trend={`${statistics?.withdrawTrend}`}
              colorClass="bg-rose-500/10 border-rose-500/20 text-rose-400"
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* 2. 现代化 Tab 切换 */}
      <div className="flex flex-col space-y-6">
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
              badge={
                statistics?.pendingWithdraw !== '0.00' ? 'Action' : undefined
              }
            />
          </nav>
        </div>

        {/* 3. 内容区域容器 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[600px] transition-all">
          {activeTab === 'deposits' && (
            <DepositList
              initialFormParams={initialFormParams}
              onParamsChange={(params) =>
                onParamsChange?.({ ...params, tab: 'deposits' })
              }
            />
          )}
          {activeTab === 'transactions' && <TransactionList />}
          {activeTab === 'withdrawals' && (
            <WithdrawalList
              initialFormParams={initialFormParams}
              onParamsChange={(params) =>
                onParamsChange?.({ ...params, tab: 'withdrawals' })
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};

// --- 子组件：统计卡片 ---
const StatsCard = ({
  title,
  amount,
  icon,
  trend,
  colorClass,
  loading,
  isTrend = true,
}: {
  title: string;
  amount: string;
  icon?: React.ReactNode;
  trend: string;
  isTrend?: boolean;
  colorClass: string;
  loading: boolean;
}) => {
  const trendValue = Number(trend);

  let trendColor = 'text-slate-400';
  let TrendIcon = null;

  if (trendValue > 0 && isTrend) {
    trendColor = 'text-emerald-400';
    TrendIcon = TrendingUp;
  } else if (trendValue < 0 && isTrend) {
    trendColor = 'text-rose-400';
    TrendIcon = TrendingDown;
  }

  console.log('StatsCard trendValue:', trendValue, 'isTrend:', isTrend);
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border backdrop-blur-md transition-transform hover:-translate-y-1 ${colorClass}`}
    >
      <div className="flex justify-between items-start mb-4">
        {!loading && (
          <div className={`p-2 rounded-lg bg-white/10 ${trendColor}`}>
            {TrendIcon ? <TrendIcon size={20} /> : icon}
          </div>
        )}
        {/* 装饰性背景图 */}
        <div
          className={`absolute right-[-10px] top-[-10px] opacity-10 scale-150 transform rotate-12 `}
        ></div>
      </div>

      <div className="space-y-1">
        <p className="text-slate-300 text-sm font-medium opacity-80">{title}</p>
        {loading ? (
          <div className="h-8 w-32 bg-white/10 rounded animate-pulse mt-1"></div>
        ) : (
          <h3 className="text-2xl font-bold tracking-tight text-white">
            {NumHelper.formatMoney(amount)}
          </h3>
        )}
      </div>

      <div
        className={`mt-4 flex items-center text-xs font-mono font-bold ${trendColor}`}
      >
        {isTrend ? (
          <>
            {TrendIcon && <TrendIcon size={14} className="mr-1" />}
            {trendValue > 0 ? `+${trendValue}%` : `${trendValue}%`} vs last week
          </>
        ) : (
          <>⏳ {trend}</>
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
      className={`transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
    >
      {icon}
    </span>
    {label}
    {badge && (
      <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-[10px] font-bold uppercase tracking-wide">
        {badge}
      </span>
    )}
  </button>
);
