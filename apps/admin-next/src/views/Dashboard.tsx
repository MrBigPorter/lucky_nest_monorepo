'use client';

import React from 'react';
import {
  DollarSign,
  Users,
  ShoppingCart,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { useRequest } from 'ahooks';
import { Card, Badge, BadgeColor } from '@/components/UIComponents';
import { financeApi, orderApi, clientUserApi } from '@/api';
import { SmartImage } from '@/components/ui/SmartImage';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

// ── 订单状态配置 ─────────────────────────────────────────────────
const ORDER_STATUS: Record<number, { label: string; color: BadgeColor }> = {
  1: { label: 'Pending', color: 'yellow' },
  2: { label: 'Paid', color: 'green' },
  3: { label: 'Cancelled', color: 'gray' },
  4: { label: 'Refunded', color: 'red' },
};

// ── Trend 组件 ──────────────────────────────────────────────────
const Trend: React.FC<{ value: string }> = ({ value }) => {
  const num = parseFloat(value ?? '0');
  if (isNaN(num) || num === 0)
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <Minus size={12} /> 0% vs last week
      </span>
    );
  const isUp = num > 0;
  return (
    <span
      className={`flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-emerald-500' : 'text-red-400'}`}
    >
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isUp ? '+' : ''}
      {num.toFixed(1)}% vs last week
    </span>
  );
};

// ── StatCard 组件 ───────────────────────────────────────────────
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  trend?: React.ReactNode;
  loading?: boolean;
}> = ({ title, value, icon, iconBg, trend, loading }) => (
  <Card className="flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        {icon}
      </div>
      {trend}
    </div>
    {loading ? (
      <div className="h-8 w-28 rounded-lg bg-gray-100 dark:bg-white/10 animate-pulse" />
    ) : (
      <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
        {value}
      </p>
    )}
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
  </Card>
);

// ── 主组件 ───────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const router = useRouter();

  // 财务统计
  const {
    data: finance,
    loading: financeLoading,
    refresh: refreshFinance,
  } = useRequest(financeApi.getStatistics, { cacheKey: 'dashboard-finance' });

  // 最近 5 笔订单（同时拿 total）
  const { data: ordersRes, loading: ordersLoading } = useRequest(
    () => orderApi.getList({ page: 1, pageSize: 5 }),
    { cacheKey: 'dashboard-orders' },
  );

  // 用户总数
  const { data: usersRes, loading: usersLoading } = useRequest(
    () => clientUserApi.getUsers({ page: 1, pageSize: 1 }),
    { cacheKey: 'dashboard-users' },
  );

  const orders = ordersRes?.list ?? [];
  const totalOrders = ordersRes?.total ?? 0;
  const totalUsers = usersRes?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* 顶部标题 + 刷新 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {format(new Date(), 'MMMM d, yyyy')} · Real-time overview
          </p>
        </div>
        <button
          onClick={refreshFinance}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-white/5 rounded-xl transition-all"
        >
          <RefreshCw
            size={14}
            className={financeLoading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* 4 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Deposits"
          value={
            finance
              ? `₱${parseFloat(finance.totalDeposit).toLocaleString()}`
              : '—'
          }
          icon={<DollarSign size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-100 dark:bg-emerald-500/15"
          trend={finance && <Trend value={finance.depositTrend} />}
          loading={financeLoading}
        />
        <StatCard
          title="Total Withdrawals"
          value={
            finance
              ? `₱${parseFloat(finance.totalWithdraw).toLocaleString()}`
              : '—'
          }
          icon={<DollarSign size={20} className="text-blue-600" />}
          iconBg="bg-blue-100 dark:bg-blue-500/15"
          trend={finance && <Trend value={finance.withdrawTrend} />}
          loading={financeLoading}
        />
        <StatCard
          title="Pending Withdrawals"
          value={
            finance
              ? `₱${parseFloat(finance.pendingWithdraw).toLocaleString()}`
              : '—'
          }
          icon={<Clock size={20} className="text-amber-600" />}
          iconBg="bg-amber-100 dark:bg-amber-500/15"
          trend={
            <span className="text-xs text-amber-500 font-medium">
              Requires audit
            </span>
          }
          loading={financeLoading}
        />
        <StatCard
          title="Total Users"
          value={usersLoading ? '—' : totalUsers.toLocaleString()}
          icon={<Users size={20} className="text-purple-600" />}
          iconBg="bg-purple-100 dark:bg-purple-500/15"
          loading={usersLoading}
        />
      </div>

      {/* 最近订单 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Recent Orders
            </h3>
            {!ordersLoading && (
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                {totalOrders.toLocaleString()} total
              </span>
            )}
          </div>
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {ordersLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No orders yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 dark:border-white/5 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3">Order</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {orders.map((order) => {
                  const status = ORDER_STATUS[order.orderStatus] ?? {
                    label: 'Unknown',
                    color: 'gray' as BadgeColor,
                  };
                  return (
                    <tr
                      key={order.orderId}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 text-gray-400 font-mono text-xs">
                        #{order.orderNo.slice(-8)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
                            <SmartImage
                              src={order.treasure?.treasureCoverImg}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 max-w-[140px]">
                            {order.treasure?.treasureName ?? '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {order.user?.nickname ?? '—'}
                      </td>
                      <td className="py-3 text-sm font-bold text-gray-900 dark:text-white">
                        ₱{order.finalAmount.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <Badge color={status.color}>{status.label}</Badge>
                      </td>
                      <td className="py-3 text-xs text-gray-400">
                        {order.createdAt
                          ? format(
                              new Date(order.createdAt * 1000),
                              'MM-dd HH:mm',
                            )
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
