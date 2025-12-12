import { PaginationParams } from '@/api/types.ts';

export type Language = 'en' | 'zh';
export type Theme = 'light' | 'dark';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface Tokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  roleId: string;
  roleName: string;
  lastLoginAt: number;
  role: string;
  status: number;
  realName: string;
}

export type AdminCreateUser = Pick<AdminUser, 'username' | 'role'> & {
  realName?: AdminUser['realName'];
  password?: string;
};

export type AdminUpdateUser = Pick<AdminUser, 'role' | 'status'> & {
  password: string;
};

export type AdminUpdatePassword = { password: string };

export interface LoginResponse {
  tokens: Tokens;
  userInfo: AdminUser;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  phone: string;
  email?: string;
  vipLevel: number;
  realBalance: number;
  coinBalance: number;
  kycStatus: 0 | 1 | 2 | 4; // 0:None, 1:Pending, 2:Failed, 4:Verified
  kycImages?: { front: string; back: string; holding: string };
  joinDate: string;
  status: 'active' | 'banned';
  banReason?: string;
  inviterId?: string; // Who invited this user
}

export interface Product {
  treasureId: string;
  treasureName: string;
  productName: string;
  costAmount: number;
  unitAmount: number;
  seqShelvesQuantity: number;
  seqBuyQuantity: number;
  buyQuantityRate: number;
  treasureCoverImg: string;
  state: number;
  createdAt: number;
  updatedAt: number;
  desc: string;
  categories: (Pick<Category, 'id' | 'name'> & {
    categoryId: number;
  })[];
}

export interface CreateProduct {
  treasureName: string; // 商品名称
  costAmount: number; // 成本价
  unitAmount: number; // 单价
  seqShelvesQuantity: number; // 上架份数 / 库存数量
  categoryIds: number[]; // 分类 ID 列表
  treasureCoverImg: string; // 封面图片 URL
  desc?: string; // 描述
}

export interface ActSection {
  id: string; // "1"
  key: string; // "home_new_arrival"
  title: string; // "New Arrival"
  imgStyleType: number; // 1
  status: number; // 1
  sortOrder: number; // 0
  startAt: number; // 0 -> 时间戳（ms / s，看你的实现）
  endAt: number; // 0 -> 时间戳（ms / s）
  limit: number; // 10
}

export type createActSectionPayload = Omit<
  ActSection,
  'id' | 'sortOrder' | 'endAt' | 'startAt'
> & {
  startAt?: Date;
  endAt?: Date;
};

export interface ActSectionListParams extends PaginationParams {
  title?: string;
  key?: string;
  status?: number;
}

export interface actSectionWithProducts extends ActSection {
  items: Partial<Product>[];
  categories: Partial<Category>[];
}

export interface actSectionBindProducts {
  treasureIds: string[];
}

// Banner 广告位
export interface Banner {
  /** 唯一 ID */
  id: string;

  /** 标题，如：Summer Sale */
  title: string;

  /** banner 图片地址 */
  bannerImgUrl: string;

  /** 文件类型：1 = 图片，2 = 视频（具体按你后端约定） */
  fileType: number;

  /** Banner 分类：比如 首页、活动页等（枚举值） */
  bannerCate: number;

  /** 跳转类型：1 = H5 链接，2 = 原生页 等 */
  jumpCate: number;

  /** 跳转链接或路由 */
  jumpUrl: string;

  /** 排序值，越小越靠前 */
  sortOrder: number;

  /** 状态：1 = 启用，0 = 禁用 等 */
  state: number;

  /** 活动开始时间，Unix 时间戳（秒） */
  activityAtStart: number;

  /** 活动结束时间，Unix 时间戳（秒） */
  activityAtEnd: number;

  /** 创建时间，Unix 时间戳（秒） */
  createdAt: number;

  /** 关联的标题 ID（如果有的话） */
  relatedTitleId?: string;
}

export type CreateBannerPayload = Omit<Banner, 'id' | 'createdAt' | 'state'>;

export type BannerListParams = PaginationParams & {
  title?: string;
  bannerCate?: number;
  state?: number;
};

export interface Category {
  id: number;
  name: string;
  nameEn: string;
  icon: string;
  sortOrder: number;
  state: number;
  productCount: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  category: 'general' | 'new_user' | 'referral' | 'threshold';
  minPurchase?: number;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
}

export interface ActivityZone {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface RechargePlan {
  id: string;
  amount: number;
  bonus: number;
  tag?: string;
}

export interface RechargeOrder {
  id: string;
  orderNo: string;
  user: { id: string; name: string; avatar: string };
  amount: number;
  bonus: number;
  method: 'GCash' | 'PayMaya' | 'Bank' | 'Crypto';
  status: 'pending' | 'success' | 'failed';
  date: string;
}

export interface Withdrawal {
  id: string;
  user: { id: string; name: string; avatar: string };
  amount: number;
  fee: number;
  method: 'GCash' | 'PayMaya' | 'Bank';
  accountNo: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface Transaction {
  id: string;
  transactionNo: string;
  user: { id: string; name: string };
  type: 'deposit' | 'withdraw' | 'buy' | 'win' | 'refund' | 'bonus';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  date: string;
}

export interface Order {
  orderId: string;
  orderNo: string;
  originalAmount: number;
  finalAmount: number;
  couponAmount: number;
  coinAmount: number;
  buyQuantity: number;
  unitPrice: number;
  orderStatus: number;
  paidAt: number;
  createdAt: number;
  user: OrderUser;
  treasure: OrderTreasure;
}

export interface OrderUser {
  id: string;
  nickname: string;
  phone: string;
}

export interface OrderTreasure {
  treasureId: string;
  treasureName: string;
  treasureCoverImg: string;
}

// output to API query parameters
export interface OrderListParams extends PaginationParams {
  keyword?: string;
  // Order status filter: 1 - Pending payment; 2 - Paid; 3 - Cancelled; 4 - Refunded
  orderStatus?: number;
}

// input to search form component
export type OrderSearchForm = {
  keyword: string;
  orderStatus: string;
};

export interface Banner {
  id: string;
  title: string;
  image: string;
  position: 'home' | 'activity';
  status: 'active' | 'inactive';
}

export interface DashboardStats {
  totalRevenue: number;
  activeUsers: number;
  newOrders: number;
  pendingIssues: number;
}

export interface TreasureGroup {
  id: string;
  product: { id: string; name: string; image: string };
  creator: { id: string; name: string; avatar: string };
  currentSize: number;
  targetSize: number;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  expiresAt: string;
}

export interface SignInRule {
  id?: string;
  day: number;
  rewardType: 'coin' | 'coupon' | 'cash';
  amount: number;
  couponId?: string;
}

export interface GrowthRule {
  id: string;
  type: 'register' | 'invite' | 'join_group';
  rewardType: 'coin' | 'coupon' | 'cash';
  amount: number;
  couponId?: string;
  isActive: boolean;
}

// --- USER DETAIL EXTENSIONS ---

export interface BettingRecord {
  id: string;
  gameName: string;
  roundId: string;
  amount: number;
  status: 'win' | 'loss' | 'pending';
  payout: number;
  date: string;
}

export interface LoginLog {
  id: string;
  ip: string;
  device: string;
  location: string;
  date: string;
  status: 'success' | 'failed';
}

export interface ReferralUser {
  id: string;
  nickname: string;
  joinDate: string;
  totalContribution: number; // Commission earned from this user
}

// --- OPERATIONS TYPES ---

export interface LotteryDraw {
  id: string;
  product: { id: string; name: string; image: string };
  totalShares: number;
  fillRate: number; // 0-100
  status: 'pending' | 'calculating' | 'completed';
  winner?: { id: string; name: string; code: string };
  hash?: string;
  drawTime?: string;
}

export interface VipTier {
  level: number;
  name: string;
  threshold: number; // Amount needed to reach this level
  benefits: string[];
  color: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'vip' | 'individual';
  sentCount: number;
  date: string;
  status: 'sent' | 'scheduled';
}

// --- ACTIVITY CONFIG TYPES ---

export interface ActivityPrize {
  id: string;
  type: 'product' | 'coupon' | 'coin' | 'balance' | 'empty';
  name: string;
  image: string;
  value?: string | number; // Product ID, Coupon ID, or Amount
  probability: number; // 0-100%
  stock: number;
  displayIndex: number;
  sortOrder: number;
}

export interface ActivityRule {
  costType: 'coin' | 'balance' | 'free';
  costAmount: number;
  dailyLimit: number; // 0 for unlimited
  totalLimit: number;
  minVipLevel: number;
}

export interface LotteryActivity {
  id: string;
  name: string;
  coverImage: string;
  template: 'wheel' | 'box' | 'grid';
  startTime: string;
  endTime: string;
  status: 'active' | 'draft' | 'ended';
  prizes: ActivityPrize[];
  rules: ActivityRule;
  sortOrder: number;
}

// --- ADMIN SECURITY TYPES ---

export interface Role {
  id: string;
  name: string;
  permissions: string[]; // e.g. "user.read", "finance.write"
  description: string;
}

export interface AdminUser {
  id: string;
  username: string;
  roleId: string;
  roleName: string;
  status: number;
  lastLogin: string;
  lastLoginIp: string;
}

export interface OperationLog {
  id: string;
  adminName: string;
  action: string; // e.g., "Updated User Balance"
  target: string; // e.g., "User: 1001"
  ip: string;
  date: string;
}

// --- CONTENT CMS TYPES ---

export interface Article {
  id: string;
  title: string;
  category: 'announcement' | 'guide' | 'news';
  status: 'published' | 'draft';
  author: string;
  publishDate: string;
  views: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

// --- DATA ANALYTICS TYPES ---

export interface FunnelData {
  stage: string;
  users: number;
  rate: number; // Conversion rate from previous step
  dropOff: number;
}

export interface ProductMetric {
  id: string;
  name: string;
  salesVolume: number; // X-axis
  profitMargin: number; // Y-axis
  revenue: number; // Bubble size
  category: string;
}

export interface CohortData {
  date: string; // e.g., "Jan 2024"
  users: number; // Initial users
  retention: number[]; // Array of percentages for month 0, 1, 2...
}

// --- SERVICE CENTER TYPES ---

export interface WorkOrder {
  id: string;
  ticketNo: string;
  user: { id: string; name: string; avatar: string };
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  replies: { sender: 'user' | 'support'; message: string; time: string }[];
}
