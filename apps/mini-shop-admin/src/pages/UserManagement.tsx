import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  MoreVertical,
  Ban,
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  ArrowUpRight,
  Edit3,
  Crown,
} from 'lucide-react';
import { Card, Button, Badge } from '../components/UIComponents';
import { useToastStore } from '../store/useToastStore';
import {
  User,
  RechargeOrder,
  Withdrawal,
  Transaction,
  BettingRecord,
  LoginLog,
  ReferralUser,
} from '../types';
import http from '@/api/http.ts';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore((state) => state.addToast);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'finance' | 'gameplay' | 'team' | 'security'
  >('profile');
  const [banModal, setBanModal] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');

  // KYC Audit Modal
  const [auditUser, setAuditUser] = useState<User | null>(null);

  // Manual Adjustment (Now inside the detail view, but kept separate logic for clarity)
  const [adjustForm, setAdjustForm] = useState({
    type: 'add',
    amount: 0,
    remark: '',
  });

  // --- Data Fetching ---
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await http.get<{ list: User[] }>('/users'); // Assuming the endpoint is /users
        setUsers(response.data.list || []);
      } catch (error: any) {
        addToast('error', `Failed to fetch users: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [addToast]);

  const filteredUsers = users.filter(
    (user) =>
      user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      (user.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // --- Handlers ---

  const updateUserInState = (id: string, updates: Partial<User>) => {
    setUsers((currentUsers) =>
      currentUsers.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    );
  };

  const handleAudit = (status: 2 | 4) => {
    if (!auditUser) return;
    // TODO: API call to /admin/users/{id}/kyc
    updateUserInState(auditUser.id, { kycStatus: status });
    addToast(
      'success',
      status === 4
        ? `KYC approved for ${auditUser.nickname}`
        : `KYC rejected for ${auditUser.nickname}`,
    );
    setAuditUser(null);
  };

  const handleBanUser = () => {
    if (!banModal) return;
    // TODO: API call to /admin/users/{id}/ban
    updateUserInState(banModal.id, { status: 'banned', banReason });
    addToast('success', `User ${banModal.nickname} has been banned.`);
    setBanModal(null);
    setBanReason('');
  };

  const handleUnbanUser = (id: string) => {
    // TODO: API call to /admin/users/{id}/unban
    updateUserInState(id, { status: 'active', banReason: undefined });
    addToast('success', `User unbanned.`);
  };

  const handleUpdateProfile = (id: string, updates: Partial<User>) => {
    // TODO: API call to /admin/users/{id}
    updateUserInState(id, updates);
    addToast('success', 'User profile updated.');
  };

  const handleAdjustBalance = () => {
    if (!selectedUser) return;
    const change =
      adjustForm.type === 'add' ? adjustForm.amount : -adjustForm.amount;
    // TODO: API call to /admin/users/{id}/balance
    updateUserInState(selectedUser.id, {
      realBalance: selectedUser.realBalance + change,
    });
    addToast('success', `Balance updated successfully.`);
    setAdjustForm({ type: 'add', amount: 0, remark: '' });
  };

  const getKycBadge = (status: number) => {
    switch (status) {
      case 4:
        return <Badge color="green">Verified</Badge>;
      case 1:
        return <Badge color="yellow">Pending</Badge>;
      case 2:
        return <Badge color="red">Failed</Badge>;
      default:
        return <Badge color="gray">Unverified</Badge>;
    }
  };

  const getVipColor = (level: number) => {
    if (level >= 4) return 'border-cyan-400 text-cyan-500';
    if (level === 3) return 'border-indigo-400 text-indigo-500';
    if (level === 2) return 'border-yellow-400 text-yellow-500';
    if (level === 1) return 'border-slate-300 text-slate-500';
    return 'border-transparent text-gray-400';
  };

  const userDeposits: RechargeOrder[] = [];
  const userWithdrawals: Withdrawal[] = [];
  const userTransactions: Transaction[] = [];
  const userBets: BettingRecord[] = [];
  const userLogs: LoginLog[] = [];
  const userReferrals: ReferralUser[] = [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            CRM, risk control, and detailed user insights
          </p>
        </div>
      </div>

      <Card>
        <div className="flex items-center bg-gray-50 dark:bg-black/20 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 mb-6 w-full md:w-96 transition-all focus-within:ring-2 focus-within:ring-primary-500/50">
          <Search size={20} className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search by nickname, phone or email..."
            className="bg-transparent border-none outline-none flex-1 ml-2 text-gray-700 dark:text-white placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <th className="pb-4 pl-4">User</th>
                <th className="pb-4">VIP Level</th>
                <th className="pb-4">Balance</th>
                <th className="pb-4">KYC Status</th>
                <th className="pb-4">Join Date</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-200"
                >
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-0.5 rounded-full border-2 ${getVipColor(user.vipLevel)}`}
                      >
                        <img
                          src={user.avatar}
                          alt={user.nickname}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.nickname}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${getVipColor(user.vipLevel).replace('text', 'bg').replace('500', '500/10')}`}
                    >
                      <Crown size={12} />
                      VIP {user.vipLevel}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      ₱{user.realBalance.toLocaleString()}
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      {user.coinBalance} Coins
                    </div>
                  </td>
                  <td className="py-4">{getKycBadge(user.kycStatus)}</td>
                  <td className="py-4 text-sm text-gray-500">
                    {user.joinDate}
                  </td>
                  <td className="py-4">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
                    >
                      {user.status === 'active' ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedUser(user)}
                        title="View Details"
                      >
                        <Edit3 size={16} className="text-blue-500" />
                      </Button>

                      {user.kycStatus === 1 && (
                        <Button
                          size="sm"
                          onClick={() => setAuditUser(user)}
                          className="bg-primary-500/10 text-primary-600 hover:bg-primary-500/20 shadow-none border-0"
                        >
                          Audit
                        </Button>
                      )}

                      {user.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setBanModal(user)}
                          className="text-gray-400 hover:text-red-500"
                          title="Ban User"
                        >
                          <Ban size={16} />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnbanUser(user.id)}
                          className="text-red-500 hover:text-green-500"
                          title="Unban User"
                        >
                          <CheckCircle size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
