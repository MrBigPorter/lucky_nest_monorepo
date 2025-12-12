import React, { useMemo, useState } from 'react';
import { Plus, Tag, Calendar, Percent, Users, Filter } from 'lucide-react';

import { Card, Badge, Modal, Input } from '@/components/UIComponents';
import { BaseSelect, Button, ModalManager } from '@repo/ui';

// 模拟数据用的 hook（你原来就有）
import { useMockData } from '@/hooks/useMockData';
import { CreateCouponModal } from './CreateCouponModal.tsx';

// ==== 1. 常量 & 类型，对齐后端 ====

// 和后端 coupon.constants.ts 对齐
export const COUPON_TYPE = {
  FULL_REDUCTION: 1, // 满减券
  DISCOUNT: 2, // 折扣券
  NO_THRESHOLD: 3, // 无门槛
} as const;

export const DISCOUNT_TYPE = {
  FIXED_AMOUNT: 1, // 固定金额
  PERCENTAGE: 2, // 百分比
} as const;

export const ISSUE_TYPE = {
  SYSTEM: 1, // 系统发放
  CLAIM: 2, // 领券
  REDEEM_CODE: 3, // 兑换码
  INVITE: 4, // 邀请
} as const;

export const VALID_TYPE = {
  RANGE: 1, // 固定日期范围
  DAYS_AFTER_RECEIVE: 2, // 领券后 N 天
} as const;

type CouponType = (typeof COUPON_TYPE)[keyof typeof COUPON_TYPE];
type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE];
type IssueType = (typeof ISSUE_TYPE)[keyof typeof ISSUE_TYPE];
type ValidType = (typeof VALID_TYPE)[keyof typeof VALID_TYPE];

type CouponStatus = 0 | 1;

// 列表里一条优惠券的结构（尽量贴近后端 CouponResponseDto）
export type Coupon = {
  id: string;
  couponName: string;
  couponCode?: string | null;
  couponType: CouponType;
  discountType: DiscountType;
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number | null;

  issueType: IssueType;
  totalQuantity: number;
  perUserLimit: number;

  validType: ValidType;
  validDays?: number | null;
  validStartAt?: string | null; // ISO 字符串
  validEndAt?: string | null;

  status: CouponStatus; // 0 停用 1 启用

  usedCount: number;
  createdAt?: string;
  updatedAt?: string;
};

// 选项格式
type Option = { label: string; value: string | number };

// 下拉选项（可以后面抽到 shared 里去）
const COUPON_TYPE_OPTIONS: Option[] = [
  { label: 'Full reduction', value: COUPON_TYPE.FULL_REDUCTION },
  { label: 'Discount', value: COUPON_TYPE.DISCOUNT },
  { label: 'No threshold', value: COUPON_TYPE.NO_THRESHOLD },
];

const ISSUE_TYPE_OPTIONS: Option[] = [
  { label: 'System issue', value: ISSUE_TYPE.SYSTEM },
  { label: 'Claim', value: ISSUE_TYPE.CLAIM },
  { label: 'Redeem code', value: ISSUE_TYPE.REDEEM_CODE },
  { label: 'Invite reward', value: ISSUE_TYPE.INVITE },
];

const VALID_TYPE_OPTIONS: Option[] = [
  { label: 'Fixed date range', value: VALID_TYPE.RANGE },
  { label: 'Days after claim', value: VALID_TYPE.DAYS_AFTER_RECEIVE },
];

const STATUS_OPTIONS: Option[] = [
  { label: 'All status', value: 'all' },
  { label: 'Enabled', value: 1 },
  { label: 'Disabled', value: 0 },
];

// 简单格式化
const formatCurrency = (n?: number | null) =>
  typeof n === 'number' ? `₱${n.toFixed(2)}` : '-';

const formatDate = (s?: string | null) =>
  s ? new Date(s).toISOString().slice(0, 10) : '-';

// == Badge 小组件 ==

const StatusBadge: React.FC<{ status: CouponStatus }> = ({ status }) => {
  return status === 1 ? (
    <Badge color="green" className="ml-2">
      Active
    </Badge>
  ) : (
    <Badge color="gray" className="ml-2">
      Disabled
    </Badge>
  );
};

const CouponTypeBadge: React.FC<{ couponType: CouponType }> = ({
  couponType,
}) => {
  switch (couponType) {
    case COUPON_TYPE.FULL_REDUCTION:
      return <Badge color="purple">Full reduction</Badge>;
    case COUPON_TYPE.DISCOUNT:
      return <Badge color="blue">Discount</Badge>;
    case COUPON_TYPE.NO_THRESHOLD:
      return <Badge color="orange">No threshold</Badge>;
    default:
      return null;
  }
};

const IssueTypeBadge: React.FC<{ issueType: IssueType }> = ({ issueType }) => {
  switch (issueType) {
    case ISSUE_TYPE.SYSTEM:
      return <Badge color="gray">System</Badge>;
    case ISSUE_TYPE.CLAIM:
      return <Badge color="green">Claim</Badge>;
    case ISSUE_TYPE.REDEEM_CODE:
      return <Badge color="yellow">Redeem code</Badge>;
    case ISSUE_TYPE.INVITE:
      return <Badge color="pink">Invite</Badge>;
    default:
      return null;
  }
};

const ValidityText: React.FC<{ coupon: Coupon }> = ({ coupon }) => {
  if (coupon.validType === VALID_TYPE.RANGE) {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <Calendar size={12} />
        {formatDate(coupon.validStartAt)} ~ {formatDate(coupon.validEndAt)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <Calendar size={12} />
      Valid within {coupon.validDays ?? '-'} days after claim
    </span>
  );
};

// ==== 2. 主组件：CouponList ====

const defaultCoupon: Partial<Coupon> = {
  couponName: '',
  couponCode: '',
  couponType: COUPON_TYPE.FULL_REDUCTION,
  discountType: DISCOUNT_TYPE.FIXED_AMOUNT,
  discountValue: 0,
  minPurchase: 0,
  maxDiscount: undefined,
  issueType: ISSUE_TYPE.CLAIM,
  totalQuantity: 1000,
  perUserLimit: 1,
  validType: VALID_TYPE.RANGE,
  validDays: 7,
  validStartAt: '',
  validEndAt: '',
  status: 1,
  usedCount: 0,
};

export const CouponList: React.FC = () => {
  // 这里仍然用 mock，后面你直接换成 SWR/React Query 接后端就行
  const { data, add, remove, update } = useMockData<Coupon>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<Partial<Coupon>>(defaultCoupon);

  // 顶部筛选
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | number>('all');
  const [filterType, setFilterType] = useState<string | number>('all');

  const openCreateModal = () => {
    ModalManager.open({
      title: 'Create Coupon',
      renderChildren: ({ close, confirm }) => (
        <CreateCouponModal close={close} confirm={confirm} />
      ),
    });
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingItem(coupon);
    setFormData(coupon);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    // 简单校验一下必填
    if (!formData.couponName || !formData.discountValue) {
      // 这里可以用你自己的 toast
      alert('Please fill in coupon name and discount value');
      return;
    }

    if (editingItem?.id) {
      update(editingItem.id, formData);
    } else {
      // 新建
      add({
        ...(defaultCoupon as Coupon),
        ...(formData as Coupon),
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this coupon?')) {
      remove(id);
    }
  };

  const filteredData = useMemo(() => {
    console.log('Filtering data with', { data });
    return data.filter((c) => {
      if (
        keyword &&
        !(
          c.couponName.toLowerCase().includes(keyword.toLowerCase()) ||
          c.couponCode?.toLowerCase().includes(keyword.toLowerCase() ?? '')
        )
      ) {
        return false;
      }
      if (filterStatus !== 'all') {
        if (Number(filterStatus) !== c.status) return false;
      }
      if (filterType !== 'all') {
        if (Number(filterType) !== c.couponType) return false;
      }
      return true;
    });
  }, [data, keyword, filterStatus, filterType]);

  const currentDiscountLabel = (c: Coupon | Partial<Coupon>) => {
    if (c.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      return `-${(c.discountValue ?? 0) * 100}%${
        c.maxDiscount ? ` (max ${formatCurrency(c.maxDiscount)})` : ''
      }`;
    }
    return `-${formatCurrency(c.discountValue ?? 0)}`;
  };

  return (
    <>
      <Card
        title="Coupons"
        action={
          <Button size="sm" onClick={openCreateModal}>
            <Plus size={14} className="mr-1" />
            New coupon
          </Button>
        }
      >
        {/* 顶部筛选区域 */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-2 md:flex-row">
            <Input
              className="md:max-w-xs"
              placeholder="Search by name / code"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              prefixIcon={<Filter size={14} />}
            />
            {/* <Select
              className="md:max-w-[140px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
              options={STATUS_OPTIONS}
            />
            <Select
              className="md:max-w-[160px]"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Type"
              options={[
                { label: 'All type', value: 'all' },
                ...COUPON_TYPE_OPTIONS,
              ]}
            />*/}
          </div>
          <div className="text-xs text-gray-500">
            {filteredData.length} coupon(s)
          </div>
        </div>

        {/* 列表区域 */}
        <div className="space-y-4">
          {filteredData.map((coupon) => (
            <div
              key={coupon.id}
              className="group flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-primary-500/40 dark:border-white/5 dark:bg-white/5"
            >
              {/* 顶部：名称 + 状态 + 类型 + 发放方式 */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300">
                    <Tag size={18} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {coupon.couponName}
                      </span>
                      <StatusBadge status={coupon.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <CouponTypeBadge couponType={coupon.couponType} />
                      <IssueTypeBadge issueType={coupon.issueType} />
                      {coupon.couponCode && (
                        <Badge variant="outline" color="gray">
                          Code:{' '}
                          <span className="font-mono">{coupon.couponCode}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    Limit per user: {coupon.perUserLimit}
                  </span>
                  <span className="flex items-center gap-1">
                    <Percent size={12} />
                    Used: {coupon.usedCount}/
                    {coupon.totalQuantity < 0 ? '∞' : coupon.totalQuantity}
                  </span>
                </div>
              </div>

              {/* 中部：金额、门槛、有效期 */}
              <div className="grid gap-3 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-3">
                <div>
                  <div className="text-gray-400">Benefit</div>
                  <div className="mt-1 font-medium text-gray-900 dark:text-white">
                    {currentDiscountLabel(coupon)}
                  </div>
                  {coupon.minPurchase > 0 && (
                    <div className="mt-1 text-[11px] text-gray-500">
                      Min. order: {formatCurrency(coupon.minPurchase)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-gray-400">Validity</div>
                  <div className="mt-1">
                    <ValidityText coupon={coupon} />
                  </div>
                </div>

                <div>
                  <div className="text-gray-400">Meta</div>
                  <div className="mt-1 flex flex-col gap-1">
                    <span>
                      Created at:{' '}
                      <span className="font-mono">
                        {coupon.createdAt ? formatDate(coupon.createdAt) : '-'}
                      </span>
                    </span>
                    <span>
                      Updated at:{' '}
                      <span className="font-mono">
                        {coupon.updatedAt ? formatDate(coupon.updatedAt) : '-'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditModal(coupon)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(coupon.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {filteredData.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-500">
              No coupons yet. Click <strong>New coupon</strong> to create one.
            </div>
          )}
        </div>
      </Card>
    </>
  );
};
