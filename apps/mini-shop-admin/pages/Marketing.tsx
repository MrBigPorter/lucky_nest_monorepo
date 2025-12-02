import React, { useState } from 'react';
import {
  Tag,
  Calendar,
  Clock,
  Percent,
  Plus,
  Edit2,
  Trash2,
  Power,
  Gift,
  Users,
  Trophy,
  Layout,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Badge,
  Modal,
  Select,
  Switch,
} from '../components/UIComponents';
import {
  MOCK_COUPONS,
  MOCK_ACTIVITIES,
  MOCK_SIGN_IN_RULES,
  MOCK_GROWTH_RULES,
} from '../constants';
import { useMockData } from '../hooks/useMockData';
import { Coupon, ActivityZone, SignInRule, GrowthRule } from '../types';

// --- SUB-COMPONENT: COUPON LIST ---
const CouponList: React.FC = () => {
  const { data, add, remove, update } = useMockData<Coupon>(MOCK_COUPONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Coupon> | null>(null);

  const defaultCoupon: Partial<Coupon> = {
    code: '',
    discount: 0,
    type: 'percent',
    category: 'general',
    expiryDate: '',
    usageLimit: 100,
    usedCount: 0,
  };
  const [formData, setFormData] = useState<Partial<Coupon>>(defaultCoupon);

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingItem(coupon);
      setFormData(coupon);
    } else {
      setEditingItem(null);
      setFormData(defaultCoupon);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingItem && editingItem.id) {
      update(editingItem.id, formData);
    } else {
      add({ ...formData, id: Date.now().toString() } as Coupon);
    }
    setIsModalOpen(false);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'new_user':
        return <Badge color="green">New User</Badge>;
      case 'referral':
        return <Badge color="blue">Referral</Badge>;
      case 'threshold':
        return <Badge color="purple">Threshold</Badge>;
      default:
        return <Badge color="gray">General</Badge>;
    }
  };

  return (
    <>
      <Card
        title="Active Coupons"
        action={
          <Button size="sm" variant="outline" onClick={() => handleOpenModal()}>
            <Plus size={14} /> New
          </Button>
        }
      >
        <div className="space-y-4">
          {data.map((coupon) => (
            <div
              key={coupon.id}
              className="group flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 hover:border-primary-500/30 transition-all"
            >
              <div className="flex items-center gap-4 mb-3 sm:mb-0 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400 flex-shrink-0">
                  <Tag size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="font-mono">{coupon.code}</span>
                    <Badge color="purple">
                      {coupon.type === 'percent'
                        ? `-${coupon.discount}%`
                        : `-$${coupon.discount}`}
                    </Badge>
                    {getCategoryBadge(coupon.category)}
                  </h4>
                  {coupon.minPurchase && (
                    <div className="text-xs text-gray-500 mt-1">
                      Min. purchase: ${coupon.minPurchase}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {coupon.expiryDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Percent size={12} /> {coupon.usedCount}/
                      {coupon.usageLimit}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenModal(coupon)}
                >
                  <Edit2 size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => remove(coupon.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Coupon' : 'Create Coupon'}
      >
        <div className="space-y-4">
          <Input
            label="Coupon Code"
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value.toUpperCase() })
            }
            placeholder="e.g. SUMMER2024"
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value as any })
            }
            options={[
              { label: 'General', value: 'general' },
              { label: 'New User Bonus', value: 'new_user' },
              { label: 'Referral Reward', value: 'referral' },
              { label: 'Threshold (Man Jian)', value: 'threshold' },
            ]}
          />

          {formData.category === 'threshold' && (
            <Input
              label="Minimum Purchase Amount ($)"
              type="number"
              value={formData.minPurchase}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minPurchase: Number(e.target.value),
                })
              }
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Discount Type"
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as 'percent' | 'fixed',
                })
              }
              options={[
                { label: 'Percentage (%)', value: 'percent' },
                { label: 'Fixed Amount ($)', value: 'fixed' },
              ]}
            />
            <Input
              label="Value"
              type="number"
              value={formData.discount}
              onChange={(e) =>
                setFormData({ ...formData, discount: Number(e.target.value) })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry Date"
              type="date"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
            />
            <Input
              label="Usage Limit"
              type="number"
              value={formData.usageLimit}
              onChange={(e) =>
                setFormData({ ...formData, usageLimit: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Coupon</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// --- SUB-COMPONENT: ACTIVITY ZONES ---
const ActivityZones: React.FC = () => {
  const { data: zones, update } = useMockData<ActivityZone>(MOCK_ACTIVITIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityZone | null>(null);

  const handleEdit = (zone: ActivityZone) => {
    setEditingItem(zone);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingItem) {
      update(editingItem.id, editingItem);
      setIsModalOpen(false);
    }
  };

  return (
    <Card title="Homepage Activity Zones">
      <div className="space-y-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4"
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-md ${zone.active ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gray-400'}`}
              >
                <Layout size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                  {zone.title}
                </h4>
                <p className="text-sm text-gray-500">{zone.description}</p>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                  <Clock size={12} /> {zone.startTime} - {zone.endTime}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <Switch
                checked={zone.active}
                onChange={() => update(zone.id, { active: !zone.active })}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(zone)}
              >
                Configure
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Activity Zone"
      >
        {editingItem && (
          <div className="space-y-4">
            <Input
              label="Zone Title"
              value={editingItem.title}
              onChange={(e) =>
                setEditingItem({ ...editingItem, title: e.target.value })
              }
            />
            <Input
              label="Description"
              value={editingItem.description}
              onChange={(e) =>
                setEditingItem({ ...editingItem, description: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={editingItem.startTime}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, startTime: e.target.value })
                }
              />
              <Input
                label="End Date"
                type="date"
                value={editingItem.endTime}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, endTime: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

// --- SUB-COMPONENT: SIGN-IN CONFIG ---
const SignInConfig: React.FC = () => {
  const { data: rules, update } = useMockData<SignInRule>(MOCK_SIGN_IN_RULES);

  const handleUpdateRule = (
    id: string,
    field: keyof SignInRule,
    value: any,
  ) => {
    const rule = rules.find((r) => r.id === id);
    if (rule) {
      update(id, { [field]: value });
    }
  };

  return (
    <Card title="Daily Sign-in Rewards">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex flex-col gap-2 p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 items-center text-center"
          >
            <div className="font-bold text-gray-500 text-sm">
              Day {rule.day}
            </div>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${rule.day === 7 ? 'bg-gradient-to-br from-amber-400 to-orange-500 scale-110' : 'bg-primary-500'}`}
            >
              {rule.rewardType === 'coin' && (
                <div className="text-xs font-bold">{rule.amount} C</div>
              )}
              {rule.rewardType === 'cash' && (
                <div className="text-xs font-bold">${rule.amount}</div>
              )}
              {rule.rewardType === 'coupon' && <Tag size={16} />}
            </div>
            <Select
              className="text-xs py-1 px-2 h-auto"
              value={rule.rewardType}
              onChange={(e) =>
                handleUpdateRule(rule.id!, 'rewardType', e.target.value)
              }
              options={[
                { label: 'Coin', value: 'coin' },
                { label: 'Cash', value: 'cash' },
                { label: 'Coupon', value: 'coupon' },
              ]}
            />
            <input
              type="number"
              className="w-full text-center text-xs bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded py-1 outline-none text-gray-700 dark:text-white"
              value={rule.amount}
              onChange={(e) =>
                handleUpdateRule(rule.id!, 'amount', Number(e.target.value))
              }
              placeholder={rule.rewardType === 'coupon' ? 'ID' : 'Amt'}
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button>Save Sign-in Configuration</Button>
      </div>
    </Card>
  );
};

// --- SUB-COMPONENT: GROWTH & GROUP RULES ---
const GrowthRules: React.FC = () => {
  const { data: rules, update } = useMockData<GrowthRule>(MOCK_GROWTH_RULES);

  const getIcon = (type: string) => {
    switch (type) {
      case 'register':
        return <Users className="text-blue-500" />;
      case 'invite':
        return <Gift className="text-purple-500" />;
      case 'join_group':
        return <Users className="text-emerald-500" />;
      default:
        return <Trophy className="text-amber-500" />;
    }
  };

  const getTitle = (type: string) => {
    switch (type) {
      case 'register':
        return 'New User Registration';
      case 'invite':
        return 'Invite Friend Reward';
      case 'join_group':
        return 'Group Join Reward';
      default:
        return 'Custom Rule';
    }
  };

  return (
    <Card title="Growth & Referral Rules">
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
                {getIcon(rule.type)}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white">
                  {getTitle(rule.type)}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge color="gray">
                    Reward: {rule.rewardType.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-bold text-primary-500">
                    {rule.rewardType === 'coupon'
                      ? `Coupon ID: ${rule.couponId}`
                      : `Amount: ${rule.amount}`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                checked={rule.isActive}
                onChange={() => update(rule.id, { isActive: !rule.isActive })}
              />
              <Button variant="ghost" size="sm">
                <Edit2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// --- MAIN MARKETING PAGE ---
export const Marketing: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'zones' | 'coupons' | 'signin' | 'growth'
  >('zones');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Marketing Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage promotions, rewards, and growth strategies
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('zones')}
          className={`px-6 py-3 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'zones' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          Activity Zones
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-6 py-3 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'coupons' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          Coupons & Vouchers
        </button>
        <button
          onClick={() => setActiveTab('signin')}
          className={`px-6 py-3 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'signin' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          Sign-in Rewards
        </button>
        <button
          onClick={() => setActiveTab('growth')}
          className={`px-6 py-3 font-medium text-sm transition-all border-b-2 whitespace-nowrap ${activeTab === 'growth' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
        >
          Growth Rules
        </button>
      </div>

      {/* CONTENT */}
      <div className="min-h-[400px]">
        {activeTab === 'zones' && <ActivityZones />}
        {activeTab === 'coupons' && <CouponList />}
        {activeTab === 'signin' && <SignInConfig />}
        {activeTab === 'growth' && <GrowthRules />}
      </div>
    </div>
  );
};
