
import React, { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, MoreVertical, Ban, CheckCircle, XCircle, FileText, DollarSign, ArrowUpRight, ArrowDownLeft, Wallet, User as UserIcon, Gamepad2, Users, History, Lock, Edit3, Key, Crown } from 'lucide-react';
import { Card, Button, Input, Modal, Badge, Select, Switch } from '../components/UIComponents';
import { MOCK_USERS, MOCK_RECHARGE_ORDERS, MOCK_WITHDRAWALS, MOCK_TRANSACTIONS, MOCK_BETTING_RECORDS, MOCK_LOGIN_LOGS, MOCK_REFERRALS } from '../constants';
import { useMockData } from '../hooks/useMockData';
import { useToast } from '../App';
import { User, RechargeOrder, Withdrawal, Transaction, BettingRecord, LoginLog, ReferralUser } from '../types';

export const UserManagement: React.FC = () => {
  const { data: users, update } = useMockData<User>(MOCK_USERS);
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'finance' | 'gameplay' | 'team' | 'security'>('profile');
  const [banModal, setBanModal] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');

  // KYC Audit Modal
  const [auditUser, setAuditUser] = useState<User | null>(null);

  // Manual Adjustment (Now inside the detail view, but kept separate logic for clarity)
  const [adjustForm, setAdjustForm] = useState({ type: 'add', amount: 0, remark: '' });

  const filteredUsers = users.filter(user => 
    user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.phone.includes(searchTerm) || 
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- Handlers ---

  const handleAudit = (status: 2 | 4) => {
    if (!auditUser) return;
    update(auditUser.id, { kycStatus: status });
    toast.addToast('success', status === 4 ? `KYC approved for ${auditUser.nickname}` : `KYC rejected for ${auditUser.nickname}`);
    setAuditUser(null);
  };

  const handleBanUser = () => {
      if (!banModal) return;
      update(banModal.id, { status: 'banned', banReason });
      toast.addToast('success', `User ${banModal.nickname} has been banned.`);
      setBanModal(null);
      setBanReason('');
  };

  const handleUnbanUser = (id: string) => {
      update(id, { status: 'active', banReason: undefined });
      toast.addToast('success', `User unbanned.`);
  };

  const handleUpdateProfile = (id: string, updates: Partial<User>) => {
      update(id, updates);
      toast.addToast('success', 'User profile updated.');
  };

  const handleAdjustBalance = () => {
    if (!selectedUser) return;
    const change = adjustForm.type === 'add' ? adjustForm.amount : -adjustForm.amount;
    update(selectedUser.id, { 
        realBalance: selectedUser.realBalance + change 
    });
    toast.addToast('success', `Balance updated successfully.`);
    setAdjustForm({ type: 'add', amount: 0, remark: '' });
  };

  const getKycBadge = (status: number) => {
    switch(status) {
      case 4: return <Badge color="green">Verified</Badge>;
      case 1: return <Badge color="yellow">Pending</Badge>;
      case 2: return <Badge color="red">Failed</Badge>;
      default: return <Badge color="gray">Unverified</Badge>;
    }
  };

  const getVipColor = (level: number) => {
      if (level >= 4) return 'border-cyan-400 text-cyan-500';
      if (level === 3) return 'border-indigo-400 text-indigo-500';
      if (level === 2) return 'border-yellow-400 text-yellow-500';
      if (level === 1) return 'border-slate-300 text-slate-500';
      return 'border-transparent text-gray-400';
  };

  // --- Mock Data Filtering for Selected User ---
  const userDeposits = selectedUser ? MOCK_RECHARGE_ORDERS.filter(r => r.user.id === selectedUser.id) : [];
  const userWithdrawals = selectedUser ? MOCK_WITHDRAWALS.filter(w => w.user.id === selectedUser.id) : [];
  const userTransactions = selectedUser ? MOCK_TRANSACTIONS.filter(t => t.user.id === selectedUser.id) : [];
  
  // These would be filtered by ID in a real app
  const userBets = MOCK_BETTING_RECORDS; 
  const userLogs = MOCK_LOGIN_LOGS;
  const userReferrals = MOCK_REFERRALS;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">CRM, risk control, and detailed user insights</p>
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
              {filteredUsers.map(user => (
                <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-200">
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-0.5 rounded-full border-2 ${getVipColor(user.vipLevel)}`}>
                        <img src={user.avatar} alt={user.nickname} className="w-10 h-10 rounded-full object-cover" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{user.nickname}</div>
                        <div className="text-xs text-gray-500">{user.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${getVipColor(user.vipLevel).replace('text', 'bg').replace('500', '500/10')}`}>
                      <Crown size={12} />
                      VIP {user.vipLevel}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">₱{user.realBalance.toLocaleString()}</div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">{user.coinBalance} Coins</div>
                  </td>
                  <td className="py-4">
                    {getKycBadge(user.kycStatus)}
                  </td>
                  <td className="py-4 text-sm text-gray-500">{user.joinDate}</td>
                  <td className="py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {user.status === 'active' ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedUser(user)} title="View Details">
                         <Edit3 size={16} className="text-blue-500" />
                      </Button>
                      
                      {user.kycStatus === 1 && (
                        <Button size="sm" onClick={() => setAuditUser(user)} className="bg-primary-500/10 text-primary-600 hover:bg-primary-500/20 shadow-none border-0">
                          Audit
                        </Button>
                      )}
                      
                      {user.status === 'active' ? (
                          <Button size="sm" variant="ghost" onClick={() => setBanModal(user)} className="text-gray-400 hover:text-red-500" title="Ban User">
                            <Ban size={16} />
                          </Button>
                      ) : (
                          <Button size="sm" variant="ghost" onClick={() => handleUnbanUser(user.id)} className="text-red-500 hover:text-green-500" title="Unban User">
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

      {/* COMPREHENSIVE USER DETAIL MODAL */}
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Profile" size="lg">
         {selectedUser && (
             <div className="flex flex-col h-[650px]">
                 {/* Modal Header Profile */}
                 <div className="flex items-start gap-6 mb-6 pb-6 border-b border-gray-100 dark:border-white/5">
                     <div className={`p-1 rounded-full border-2 ${getVipColor(selectedUser.vipLevel)}`}>
                        <img src={selectedUser.avatar} className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-xl" />
                     </div>
                     <div className="flex-1 pt-2">
                         <div className="flex items-center gap-3">
                             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.nickname}</h2>
                             <Badge color={selectedUser.status === 'active' ? 'green' : 'red'}>{selectedUser.status}</Badge>
                         </div>
                         <div className="flex items-center gap-4 mt-2">
                             <div className="text-sm text-gray-500 flex items-center gap-1"><UserIcon size={14}/> ID: <span className="font-mono">{selectedUser.id}</span></div>
                             <div className="text-sm text-gray-500 flex items-center gap-1"><Users size={14}/> Inviter: {selectedUser.inviterId || '-'}</div>
                         </div>
                     </div>
                     <div className="text-right p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 min-w-[180px]">
                         <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Wallet Balance</p>
                         <p className="text-3xl font-bold text-primary-500">₱{selectedUser.realBalance.toLocaleString()}</p>
                         <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mt-1">{selectedUser.coinBalance} Coins</p>
                     </div>
                 </div>

                 {/* Tabs */}
                 <div className="flex border-b border-gray-100 dark:border-white/5 mb-6 overflow-x-auto no-scrollbar">
                     {[
                         {id: 'profile', label: 'Settings', icon: <UserIcon size={16}/>},
                         {id: 'finance', label: 'Finance', icon: <Wallet size={16}/>},
                         {id: 'gameplay', label: 'Gameplay', icon: <Gamepad2 size={16}/>},
                         {id: 'team', label: 'Referrals', icon: <Users size={16}/>},
                         {id: 'security', label: 'Security', icon: <ShieldCheck size={16}/>},
                     ].map(t => (
                         <button 
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`px-5 py-3 flex items-center gap-2 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === t.id ? 'border-primary-500 text-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                         >
                             {t.icon} {t.label}
                         </button>
                     ))}
                 </div>

                 {/* Tab Content */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
                     
                     {/* TAB: PROFILE */}
                     {activeTab === 'profile' && (
                         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="space-y-4">
                                     <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Edit3 size={18}/> Basic Info</h3>
                                     <Input 
                                        label="Nickname" 
                                        defaultValue={selectedUser.nickname}
                                        onBlur={(e) => handleUpdateProfile(selectedUser.id, { nickname: e.target.value })}
                                     />
                                     <Input 
                                        label="Phone Number" 
                                        defaultValue={selectedUser.phone}
                                        onBlur={(e) => handleUpdateProfile(selectedUser.id, { phone: e.target.value })}
                                     />
                                     <Input 
                                        label="Email" 
                                        defaultValue={selectedUser.email}
                                        onBlur={(e) => handleUpdateProfile(selectedUser.id, { email: e.target.value })}
                                     />
                                     <div>
                                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">VIP Level</label>
                                         <select 
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg outline-none dark:text-white"
                                            value={selectedUser.vipLevel}
                                            onChange={(e) => handleUpdateProfile(selectedUser.id, { vipLevel: Number(e.target.value) })}
                                         >
                                             {[0,1,2,3,4,5].map(l => <option key={l} value={l}>VIP {l}</option>)}
                                         </select>
                                     </div>
                                 </div>
                                 <div className="space-y-4">
                                     <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Wallet size={18}/> Admin Adjustment</h3>
                                     <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 space-y-4">
                                         <Select 
                                            label="Operation Type"
                                            value={adjustForm.type}
                                            onChange={e => setAdjustForm({...adjustForm, type: e.target.value})}
                                            options={[
                                                {label: 'Add Balance (Deposit)', value: 'add'},
                                                {label: 'Deduct Balance (Penalty)', value: 'deduct'}
                                            ]}
                                         />
                                         <Input 
                                            label="Amount ($)"
                                            type="number"
                                            value={adjustForm.amount}
                                            onChange={e => setAdjustForm({...adjustForm, amount: Number(e.target.value)})}
                                         />
                                         <Input 
                                            label="Remark / Reason"
                                            value={adjustForm.remark}
                                            onChange={e => setAdjustForm({...adjustForm, remark: e.target.value})}
                                            placeholder="Admin manual adjustment"
                                         />
                                         <Button onClick={handleAdjustBalance} className="w-full mt-2">Confirm Adjustment</Button>
                                     </div>

                                     <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                                         <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Lock size={18}/> Security</h3>
                                         <div className="flex gap-3">
                                             <Button variant="outline" className="flex-1" size="sm"><Key size={14}/> Reset Password</Button>
                                             <Button variant="outline" className="flex-1" size="sm">Clear Sessions</Button>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     )}

                     {/* TAB: FINANCE */}
                     {activeTab === 'finance' && (
                         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                                     <div className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Total Deposit</div>
                                     <div className="text-2xl font-bold text-green-700 dark:text-green-500">₱{userDeposits.reduce((acc, cur) => acc + cur.amount, 0).toLocaleString()}</div>
                                 </div>
                                 <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                     <div className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Total Withdrawal</div>
                                     <div className="text-2xl font-bold text-red-700 dark:text-red-500">₱{userWithdrawals.reduce((acc, cur) => acc + cur.amount, 0).toLocaleString()}</div>
                                 </div>
                             </div>

                             <div>
                                 <h4 className="font-bold mb-3 text-sm uppercase text-gray-500">Recent Transactions</h4>
                                 <table className="w-full text-sm text-left">
                                     <thead className="bg-gray-100 dark:bg-white/5 text-gray-500">
                                         <tr>
                                             <th className="p-3 rounded-tl-lg">Date</th>
                                             <th className="p-3">Type</th>
                                             <th className="p-3">Amount</th>
                                             <th className="p-3 rounded-tr-lg">Balance After</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                         {userTransactions.map(t => (
                                             <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                 <td className="p-3 text-gray-500">{t.date}</td>
                                                 <td className="p-3 capitalize">
                                                     <span className={`px-2 py-1 rounded text-xs font-medium ${t.type === 'deposit' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-gray-100 text-gray-700 dark:bg-white/10'}`}>
                                                         {t.type}
                                                     </span>
                                                 </td>
                                                 <td className={`p-3 font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                     {t.amount > 0 ? '+' : ''}₱{t.amount.toLocaleString()}
                                                 </td>
                                                 <td className="p-3 text-gray-600 dark:text-gray-400">₱{t.balanceAfter.toLocaleString()}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         </div>
                     )}

                     {/* TAB: GAMEPLAY */}
                     {activeTab === 'gameplay' && (
                         <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <div className="flex gap-4 mb-6">
                                 <div className="flex-1 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                                     <div className="text-xs text-gray-500 uppercase font-bold">Total Bets</div>
                                     <div className="text-xl font-bold mt-1">128</div>
                                 </div>
                                 <div className="flex-1 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                                     <div className="text-xs text-gray-500 uppercase font-bold">Win Rate</div>
                                     <div className="text-xl font-bold text-primary-500 mt-1">32%</div>
                                 </div>
                                 <div className="flex-1 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                                     <div className="text-xs text-gray-500 uppercase font-bold">Net Profit</div>
                                     <div className="text-xl font-bold text-green-500 mt-1">+₱4,200</div>
                                 </div>
                             </div>
                             <table className="w-full text-sm text-left">
                                 <thead className="bg-gray-100 dark:bg-white/5 text-gray-500">
                                     <tr>
                                         <th className="p-3 rounded-tl-lg">Time</th>
                                         <th className="p-3">Game</th>
                                         <th className="p-3">Round ID</th>
                                         <th className="p-3">Bet Amount</th>
                                         <th className="p-3">Result</th>
                                         <th className="p-3 rounded-tr-lg">Payout</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                     {userBets.map(b => (
                                         <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                             <td className="p-3 text-gray-500">{b.date}</td>
                                             <td className="p-3 font-medium">{b.gameName}</td>
                                             <td className="p-3 font-mono text-xs opacity-70">{b.roundId}</td>
                                             <td className="p-3">₱{b.amount}</td>
                                             <td className="p-3">
                                                 <Badge color={b.status === 'win' ? 'green' : b.status === 'loss' ? 'red' : 'yellow'}>{b.status}</Badge>
                                             </td>
                                             <td className={`p-3 font-bold ${b.payout > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                 ₱{b.payout}
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     )}

                     {/* TAB: TEAM */}
                     {activeTab === 'team' && (
                         <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <div className="flex justify-between items-center mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/20">
                                 <div className="flex items-center gap-3">
                                     <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-300">
                                         <Users size={20} />
                                     </div>
                                     <div>
                                         <h4 className="font-bold text-gray-900 dark:text-white">Direct Referrals</h4>
                                         <p className="text-xs text-indigo-600 dark:text-indigo-400">Level 1 Downlines</p>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-xs text-gray-500">Total Commission</div>
                                     <div className="text-xl font-bold text-green-600">₱450</div>
                                 </div>
                             </div>
                             <table className="w-full text-sm text-left">
                                 <thead className="bg-gray-100 dark:bg-white/5 text-gray-500">
                                     <tr>
                                         <th className="p-3 rounded-tl-lg">User ID</th>
                                         <th className="p-3">Nickname</th>
                                         <th className="p-3">Join Date</th>
                                         <th className="p-3 rounded-tr-lg">Commission Earned</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                     {userReferrals.map(r => (
                                         <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                             <td className="p-3 font-mono text-xs">{r.id}</td>
                                             <td className="p-3 font-medium">{r.nickname}</td>
                                             <td className="p-3 text-gray-500">{r.joinDate}</td>
                                             <td className="p-3 text-green-600 font-bold">+₱{r.totalContribution}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     )}

                     {/* TAB: SECURITY */}
                     {activeTab === 'security' && (
                         <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <table className="w-full text-sm text-left">
                                 <thead className="bg-gray-100 dark:bg-white/5 text-gray-500">
                                     <tr>
                                         <th className="p-3 rounded-tl-lg">Time</th>
                                         <th className="p-3">IP Address</th>
                                         <th className="p-3">Device / OS</th>
                                         <th className="p-3">Location</th>
                                         <th className="p-3 rounded-tr-lg">Status</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                     {userLogs.map(log => (
                                         <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                             <td className="p-3 text-gray-500">{log.date}</td>
                                             <td className="p-3 font-mono text-xs">{log.ip}</td>
                                             <td className="p-3">{log.device}</td>
                                             <td className="p-3">{log.location}</td>
                                             <td className="p-3">
                                                 <Badge color={log.status === 'success' ? 'green' : 'red'}>{log.status}</Badge>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     )}
                 </div>
             </div>
         )}
      </Modal>

      {/* KYC Audit Modal */}
      <Modal isOpen={!!auditUser} onClose={() => setAuditUser(null)} title="KYC Audit Request">
        {auditUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
              <img src={auditUser.avatar} className="w-16 h-16 rounded-full" />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{auditUser.nickname}</h3>
                <p className="text-gray-500">{auditUser.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ID Front</label>
                <div className="aspect-video bg-gray-100 dark:bg-black/40 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 group relative">
                   {auditUser.kycImages?.front ? (
                     <>
                        <img src={auditUser.kycImages.front} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">Click to Zoom</div>
                     </>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                   )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ID Back</label>
                <div className="aspect-video bg-gray-100 dark:bg-black/40 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 group relative">
                    {auditUser.kycImages?.back ? (
                     <>
                        <img src={auditUser.kycImages.back} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">Click to Zoom</div>
                     </>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                   )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
              <Button variant="danger" className="flex-1" onClick={() => handleAudit(2)}>
                <XCircle size={18} /> Reject
              </Button>
              <Button variant="primary" className="flex-1 bg-green-600 hover:bg-green-700 border-green-600" onClick={() => handleAudit(4)}>
                <CheckCircle size={18} /> Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Ban User Modal */}
      <Modal isOpen={!!banModal} onClose={() => setBanModal(null)} title={`Ban User: ${banModal?.nickname}`} size="sm">
          <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg flex items-start gap-3 border border-red-100 dark:border-red-900/20">
                  <ShieldAlert className="text-red-500 flex-shrink-0" size={24} />
                  <p className="text-sm text-red-800 dark:text-red-200">
                      Are you sure you want to ban this user? They will not be able to login or withdraw funds.
                  </p>
              </div>
              <Input 
                  label="Ban Reason" 
                  value={banReason} 
                  onChange={e => setBanReason(e.target.value)} 
                  placeholder="e.g. Fraudulent activity detected"
              />
              <div className="flex justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setBanModal(null)}>Cancel</Button>
                  <Button variant="danger" onClick={handleBanUser} disabled={!banReason}>Confirm Ban</Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
