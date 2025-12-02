import React, { useState } from 'react';
import {
  Wallet,
  PlusCircle,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ArrowRightLeft,
  Search,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Modal,
  Badge,
  DateRangePicker,
} from '../components/UIComponents';
import {
  MOCK_RECHARGE_PLANS,
  MOCK_WITHDRAWALS,
  MOCK_RECHARGE_ORDERS,
  MOCK_TRANSACTIONS,
} from '../constants';
import { useMockData } from '../hooks/useMockData';
import { useToast } from '../App';
import { RechargePlan, Withdrawal, RechargeOrder, Transaction } from '../types';

// --- SUB-COMPONENT: RECHARGE PLANS ---
const RechargeConfig: React.FC = () => {
  const {
    data: plans,
    add,
    remove,
    update,
  } = useMockData<RechargePlan>(MOCK_RECHARGE_PLANS);
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<RechargePlan> | null>(
    null,
  );

  const defaultPlan: Partial<RechargePlan> = { amount: 100, bonus: 0, tag: '' };
  const [formData, setFormData] = useState<Partial<RechargePlan>>(defaultPlan);

  const handleOpenModal = (plan?: RechargePlan) => {
    if (plan) {
      setEditingItem(plan);
      setFormData(plan);
    } else {
      setEditingItem(null);
      setFormData(defaultPlan);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingItem && editingItem.id) {
      update(editingItem.id, formData);
      toast.addToast('success', 'Plan updated successfully');
    } else {
      add({ ...formData, id: Date.now().toString() } as RechargePlan);
      toast.addToast('success', 'New recharge plan created');
    }
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="group bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-white/5 p-6 flex flex-col items-center text-center relative hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-500/30"
          >
            {plan.tag && (
              <span className="absolute top-4 right-4 text-[10px] font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 px-2 py-0.5 rounded shadow-lg shadow-primary-500/30 uppercase tracking-wider">
                {plan.tag}
              </span>
            )}

            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6 text-gray-400 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300">
              <span className="text-2xl font-bold">$</span>
            </div>

            <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              ${plan.amount}
            </h3>
            <div className="text-emerald-500 font-medium mb-8 bg-emerald-500/10 px-3 py-1 rounded-full text-sm flex items-center gap-1">
              <TrendingUp size={14} />+ ${plan.bonus} Bonus
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mt-auto opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenModal(plan)}
                className="w-full"
              >
                <Edit size={14} /> Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => remove(plan.id)}
                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white shadow-none"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}

        <button
          onClick={() => handleOpenModal()}
          className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center p-6 text-gray-400 hover:text-primary-500 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/5 transition-all cursor-pointer min-h-[300px] group"
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <PlusCircle size={32} />
          </div>
          <span className="font-medium text-lg">Add New Plan</span>
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Recharge Plan' : 'Create Recharge Plan'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Deposit Amount ($)"
            type="number"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: Number(e.target.value) })
            }
          />
          <Input
            label="Bonus Credit ($)"
            type="number"
            value={formData.bonus}
            onChange={(e) =>
              setFormData({ ...formData, bonus: Number(e.target.value) })
            }
          />
          <Input
            label="Marketing Tag (Optional)"
            value={formData.tag}
            onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Plan</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// --- SUB-COMPONENT: DEPOSIT RECORDS ---
const DepositRecords: React.FC = () => {
  const { data: deposits } = useMockData<RechargeOrder>(MOCK_RECHARGE_ORDERS);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDeposits = deposits.filter(
    (d) =>
      d.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.user.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Card
      title="Recent Deposits"
      action={
        <div className="flex items-center bg-gray-50 dark:bg-black/20 p-2 rounded-lg border border-gray-100 dark:border-white/5 w-64">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search Order No..."
            className="bg-transparent border-none outline-none flex-1 ml-2 text-sm text-gray-700 dark:text-white placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <th className="pb-4 pl-4">Order No.</th>
              <th className="pb-4">User</th>
              <th className="pb-4">Amount</th>
              <th className="pb-4">Bonus</th>
              <th className="pb-4">Channel</th>
              <th className="pb-4">Status</th>
              <th className="pb-4 text-right pr-6">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredDeposits.map((d) => (
              <tr
                key={d.id}
                className="group hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td className="py-4 pl-4 font-mono text-sm text-gray-500">
                  {d.orderNo}
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <img src={d.user.avatar} className="w-8 h-8 rounded-full" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {d.user.name}
                    </span>
                  </div>
                </td>
                <td className="py-4 font-bold text-gray-900 dark:text-white">
                  ₱{d.amount.toLocaleString()}
                </td>
                <td className="py-4 text-sm text-green-500">+₱{d.bonus}</td>
                <td className="py-4 text-sm">{d.method}</td>
                <td className="py-4">
                  <Badge
                    color={
                      d.status === 'success'
                        ? 'green'
                        : d.status === 'failed'
                          ? 'red'
                          : 'yellow'
                    }
                  >
                    {d.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-4 text-right pr-6 text-sm text-gray-500">
                  {d.date}
                </td>
              </tr>
            ))}
            {filteredDeposits.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No deposit records found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// --- SUB-COMPONENT: TRANSACTION LOGS ---
const TransactionLogs: React.FC = () => {
  const { data: logs } = useMockData<Transaction>(MOCK_TRANSACTIONS);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-500';
      case 'withdraw':
        return 'text-red-500';
      case 'win':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card title="Transaction History" action={<DateRangePicker />}>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
              <th className="pb-4 pl-4">Trans. No.</th>
              <th className="pb-4">User</th>
              <th className="pb-4">Type</th>
              <th className="pb-4">Amount</th>
              <th className="pb-4">Balance Change</th>
              <th className="pb-4 text-right pr-6">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="group hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <td className="py-4 pl-4 font-mono text-xs text-gray-500">
                  {log.transactionNo}
                </td>
                <td className="py-4 text-sm font-medium text-gray-900 dark:text-white">
                  {log.user.name}
                </td>
                <td className="py-4">
                  <span
                    className={`capitalize text-sm font-bold ${getTypeColor(log.type)}`}
                  >
                    {log.type}
                  </span>
                </td>
                <td className="py-4 font-medium text-gray-900 dark:text-white">
                  {log.amount > 0 ? '+' : ''}
                  {log.amount.toLocaleString()}
                </td>
                <td className="py-4 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>{log.balanceBefore.toLocaleString()}</span>
                    <ArrowRightLeft size={12} />
                    <span className="text-gray-900 dark:text-white">
                      {log.balanceAfter.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="py-4 text-right pr-6 text-sm text-gray-500">
                  {log.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// --- SUB-COMPONENT: WITHDRAWAL AUDIT WITH RISK PROFILE ---
const WithdrawalAudit: React.FC = () => {
  const { data: withdrawals, update } =
    useMockData<Withdrawal>(MOCK_WITHDRAWALS);
  const toast = useToast();
  const [riskModal, setRiskModal] = useState<Withdrawal | null>(null);

  const handleStatus = (id: string, status: 'approved' | 'rejected') => {
    update(id, { status });
    toast.addToast(
      status === 'approved' ? 'success' : 'error',
      `Withdrawal ${status.toUpperCase()}`,
    );
    setRiskModal(null);
  };

  return (
    <>
      <Card title="Withdrawal Requests">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-4 pl-4">User</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Method</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right pr-6">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {withdrawals.map((w) => (
                <tr
                  key={w.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={w.user.avatar}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {w.user.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 font-mono font-medium">
                    ₱{w.amount.toLocaleString()}
                  </td>
                  <td className="py-4 text-sm">{w.method}</td>
                  <td className="py-4">
                    <Badge
                      color={
                        w.status === 'approved'
                          ? 'green'
                          : w.status === 'rejected'
                            ? 'red'
                            : 'yellow'
                      }
                    >
                      {w.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 text-right pr-6">
                    {w.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => setRiskModal(w)}
                        className="bg-primary-500/10 text-primary-600 hover:bg-primary-500/20 shadow-none border-0"
                      >
                        <ShieldCheck size={16} /> Audit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={!!riskModal}
        onClose={() => setRiskModal(null)}
        title="Risk Control Audit"
      >
        {riskModal && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={riskModal.user.avatar}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {riskModal.user.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ID: {riskModal.user.id}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Requested Amount</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₱{riskModal.amount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-100 dark:border-white/10 bg-green-50 dark:bg-green-900/10">
                <div className="text-xs text-gray-500 uppercase">
                  Total Deposit
                </div>
                <div className="text-lg font-bold text-green-600">₱54,000</div>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 dark:border-white/10 bg-red-50 dark:bg-red-900/10">
                <div className="text-xs text-gray-500 uppercase">
                  Total Withdraw
                </div>
                <div className="text-lg font-bold text-red-600">₱12,500</div>
              </div>
              <div className="p-4 rounded-xl border border-gray-100 dark:border-white/10 bg-blue-50 dark:bg-blue-900/10 col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs text-gray-500 uppercase">
                    Wager Requirement
                  </div>
                  <div className="text-xs font-bold text-blue-600">
                    85% Completed
                  </div>
                </div>
                <div className="h-2 w-full bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[85%]"></div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle
                className="text-yellow-600 flex-shrink-0"
                size={20}
              />
              <div>
                <h4 className="font-bold text-yellow-800 dark:text-yellow-500 text-sm">
                  Risk Alert
                </h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  User IP address changed frequently in the last 24 hours.
                  Multiple accounts detected on same device ID.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => handleStatus(riskModal.id, 'rejected')}
              >
                <XCircle size={18} /> Reject
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-green-600 hover:bg-green-700 border-green-600"
                onClick={() => handleStatus(riskModal.id, 'approved')}
              >
                <CheckCircle size={18} /> Approve Transfer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export const Finance: React.FC = () => {
  const [tab, setTab] = useState<
    'overview' | 'deposits' | 'withdrawals' | 'transactions' | 'config'
  >('overview');

  return (
    <div className="space-y-8">
      {/* Finance Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-black dark:to-dark-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl border border-gray-800 dark:border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Wallet className="text-primary-500" />
            Finance Center
          </h1>
          <p className="text-gray-400 max-w-xl">
            Comprehensive financial monitoring, audit, and risk control.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-white/10 pb-1">
        {[
          {
            id: 'overview',
            label: 'Dashboard',
            icon: <TrendingUp size={16} />,
          },
          {
            id: 'deposits',
            label: 'Deposit Orders',
            icon: <ArrowRightLeft size={16} />,
          },
          {
            id: 'withdrawals',
            label: 'Withdrawal Audit',
            icon: <ShieldCheck size={16} />,
          },
          {
            id: 'transactions',
            label: 'Transaction Logs',
            icon: <FileText size={16} />,
          },
          { id: 'config', label: 'Configuration', icon: <Edit size={16} /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-3 rounded-t-lg font-medium text-sm flex items-center gap-2 transition-all ${tab === t.id ? 'bg-white dark:bg-dark-800 text-primary-500 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div>
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase">
                    Total Deposit Today
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    ₱124,500
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-600">
                  <TrendingUp size={24} />
                </div>
              </div>
            </Card>
            <Card className="bg-red-500/10 border-red-500/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-red-600 dark:text-red-400 font-bold text-sm uppercase">
                    Total Payout Today
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    ₱42,300
                  </h3>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg text-red-600">
                  <TrendingDown size={24} />
                </div>
              </div>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 font-bold text-sm uppercase">
                    Net Profit
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    ₱82,200
                  </h3>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-lg text-blue-600">
                  <Wallet size={24} />
                </div>
              </div>
            </Card>
            <div className="md:col-span-3">
              <DepositRecords />
            </div>
          </div>
        )}
        {tab === 'deposits' && <DepositRecords />}
        {tab === 'withdrawals' && <WithdrawalAudit />}
        {tab === 'transactions' && <TransactionLogs />}
        {tab === 'config' && <RechargeConfig />}
      </div>
    </div>
  );
};
