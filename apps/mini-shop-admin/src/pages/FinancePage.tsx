import React, { useState } from 'react';
import { TransactionList } from './finance/TransactionList';
import { WithdrawalList } from './finance/WithdrawalList';
import { Wallet, FileText, ArrowRightLeft } from 'lucide-react';

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals'>(
    'transactions',
  );

  return (
    <div className="space-y-6">
      {/* 1. 顶部 Header 与 统计概览 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-[80px] -mr-10 -mt-10 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <Wallet className="text-primary-400" /> Finance Center
            </h1>
            <p className="text-gray-400 max-w-lg">
              Monitor real-time financial data, audit withdrawals, and manage
              user balances safely.
            </p>
          </div>

          {/* 简单的统计卡片 */}
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[140px]">
              <div className="text-xs text-gray-400 uppercase">
                Pending Withdraw
              </div>
              <div className="text-2xl font-bold text-yellow-400">₱42,300</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[140px]">
              <div className="text-xs text-gray-400 uppercase">
                Total Deposit
              </div>
              <div className="text-2xl font-bold text-green-400">₱124,500</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabs 切换 */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex gap-6">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 transition-all ${
            activeTab === 'transactions'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ArrowRightLeft size={16} /> Transactions & Adjust
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 transition-all ${
            activeTab === 'withdrawals'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={16} /> Withdrawal Audits
        </button>
      </div>

      {/* 3. 内容区域 */}
      <div className="min-h-[500px]">
        {activeTab === 'transactions' && <TransactionList />}
        {activeTab === 'withdrawals' && <WithdrawalList />}
      </div>
    </div>
  );
};
