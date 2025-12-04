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

export type AdminUpdateUser = Pick<
  AdminUser,
  'realName' | 'role' | 'status'
> & {
  password: string;
};

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
  id: string;
  seq: string;
  name: string;
  price: number;
  cost: number;
  totalShares: number;
  soldShares: number;
  category: string;
  status: 'active' | 'draft' | 'ended';
  image: string;
  images?: string[]; // Gallery
  description?: string; // Rich text or long text
  lotteryMode: 1 | 2; // 1: Sold Out, 2: Timed
  lotteryTime?: string;
  sortOrder: number; // For drag and drop sorting
  purchaseLimit?: number; // 0 for unlimited
  tags?: string[]; // e.g. ['Hot', 'New']
  autoRestart?: boolean; // Automatically start next round
}

export interface Category {
  id: string;
  name: string;
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
  id: string;
  orderNo: string;
  user: { id: string; name: string };
  product: { id: string; name: string; image: string };
  amount: number;
  shares: number;
  status: 'paid' | 'pending' | 'refunded';
  isWinning: boolean;
  luckyCode?: string;
  deliveryStatus?: 'pending' | 'shipped' | 'delivered';
  date: string;
}

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
