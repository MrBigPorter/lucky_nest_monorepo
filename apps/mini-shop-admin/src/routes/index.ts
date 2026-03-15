import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Ticket,
  CreditCard,
  Settings,
  Users,
  Package,
  Zap,
  Bell,
  Crown,
  Gift,
  Shield,
  FileText,
  PieChart,
  Headphones,
  UserCheck,
  MapPin,
  LayoutGrid,
  Image,
  Tag,
  UsersRound,
  Wallet,
  KeyRound,
} from 'lucide-react';

// ── 懒加载工具函数 ───────────────────────────────────────────────
// 消除 26 个相同的 .then((m) => ({ default: m.XXX })) 样板代码
const lazyPage = (
  loader: () => Promise<Record<string, React.ComponentType>>,
  name: string,
): React.LazyExoticComponent<React.ComponentType> =>
  React.lazy(() => loader().then((m) => ({ default: m[name] })));

// ── 懒加载页面 ───────────────────────────────────────────────────
const Dashboard = lazyPage(() => import('../pages/Dashboard'), 'Dashboard');
const UserManagement = lazyPage(
  () => import('../pages/UserManagement'),
  'UserManagement',
);
const KycList = lazyPage(() => import('@/pages/KycList'), 'KycList');
const AddressList = lazyPage(
  () => import('@/pages/AddressList'),
  'AddressList',
);
const AdminUserManagement = lazyPage(
  () => import('../pages/AdminUserManagement'),
  'AdminUserManagement',
);
const ProductManagement = lazyPage(
  () => import('../pages/ProductManagement'),
  'ProductManagement',
);
const CategoryManagement = lazyPage(
  () => import('../pages/CategoryManagement'),
  'CategoryManagement',
);
const ActSectionManagement = lazyPage(
  () => import('@/pages/ActSectionManagement'),
  'ActSectionManagement',
);
const BannerManagement = lazyPage(
  () => import('@/pages/BannerManagement'),
  'BannerManagement',
);
const GroupManagement = lazyPage(
  () => import('../pages/GroupManagement'),
  'GroupManagement',
);
const OrderManagement = lazyPage(
  () => import('../pages/OrderManagement'),
  'OrderManagement',
);
const ServiceCenter = lazyPage(
  () => import('../pages/ServiceCenter'),
  'ServiceCenter',
);
const DataAnalytics = lazyPage(
  () => import('../pages/DataAnalytics'),
  'DataAnalytics',
);
const LotteryControl = lazyPage(
  () => import('../pages/LotteryControl'),
  'LotteryControl',
);
const ActivityConfig = lazyPage(
  () => import('../pages/ActivityConfig'),
  'ActivityConfig',
);
const VipConfig = lazyPage(() => import('../pages/VipConfig'), 'VipConfig');
const NotificationCenter = lazyPage(
  () => import('../pages/NotificationCenter'),
  'NotificationCenter',
);
const Marketing = lazyPage(() => import('../pages/Marketing'), 'Marketing');
const PaymentChannelList = lazyPage(
  () => import('@/pages/PaymentChannelList'),
  'PaymentChannelList',
);
const Finance = lazyPage(() => import('../pages/Finance'), 'Finance');
const FinancePage = lazyPage(
  () => import('@/pages/FinancePage'),
  'FinancePage',
);
const AdminSecurity = lazyPage(
  () => import('../pages/AdminSecurity'),
  'AdminSecurity',
);
const ContentCMS = lazyPage(() => import('../pages/ContentCMS'), 'ContentCMS');
const SystemSettings = lazyPage(
  () => import('../pages/SystemSettings'),
  'SystemSettings',
);

// ── 类型定义 ─────────────────────────────────────────────────────
export type RouteGroup = 'Overview' | 'Management' | 'Operations' | 'System';

export interface RouteConfig {
  path: string;
  /** 对应 TRANSLATIONS 中的 key */
  name: string;
  component: React.LazyExoticComponent<React.ComponentType>;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  group: RouteGroup;
  /** true = 路由保留但不在侧边栏显示 */
  hidden?: boolean;
}

// ── 路由表 ───────────────────────────────────────────────────────
export const routes: RouteConfig[] = [
  // ── Overview ──────────────────────────────────────────────────
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    icon: LayoutDashboard,
    group: 'Overview',
  },

  // ── Management ────────────────────────────────────────────────
  {
    path: '/users',
    name: 'users',
    component: UserManagement,
    icon: Users,
    group: 'Management',
  },
  {
    path: '/kyc',
    name: 'kyc',
    component: KycList,
    icon: UserCheck, // 身份核验语义更准确
    group: 'Management',
  },
  {
    path: '/address',
    name: 'address',
    component: AddressList,
    icon: MapPin, // 地址用定位图标
    group: 'Management',
  },
  {
    path: '/admin-users',
    name: 'admin',
    component: AdminUserManagement,
    icon: Shield,
    group: 'Management',
  },
  {
    path: '/products',
    name: 'products',
    component: ProductManagement,
    icon: ShoppingBag,
    group: 'Management',
  },
  {
    path: '/categories',
    name: 'categories',
    component: CategoryManagement,
    icon: Tag, // 分类用标签图标
    group: 'Management',
  },
  {
    path: '/act/section',
    name: 'actSection',
    component: ActSectionManagement,
    icon: LayoutGrid, // 区块布局语义
    group: 'Management',
  },
  {
    path: '/banners',
    name: 'banners',
    component: BannerManagement,
    icon: Image, // 图片/轮播图语义
    group: 'Management',
  },
  {
    path: '/groups',
    name: 'groups',
    component: GroupManagement,
    icon: UsersRound, // 多人团购语义
    group: 'Management',
  },
  {
    path: '/orders',
    name: 'orders',
    component: OrderManagement,
    icon: Package,
    group: 'Management',
  },
  {
    path: '/service',
    name: 'service',
    component: ServiceCenter,
    icon: Headphones,
    group: 'Management',
  },

  // ── Operations ────────────────────────────────────────────────
  {
    path: '/analytics',
    name: 'analytics',
    component: DataAnalytics,
    icon: PieChart,
    group: 'Operations',
  },
  {
    path: '/lottery',
    name: 'lottery',
    component: LotteryControl,
    icon: Zap,
    group: 'Operations',
  },
  {
    path: '/activity',
    name: 'activity',
    component: ActivityConfig,
    icon: Gift,
    group: 'Operations',
  },
  {
    path: '/vip',
    name: 'vip',
    component: VipConfig,
    icon: Crown,
    group: 'Operations',
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: NotificationCenter,
    icon: Bell,
    group: 'Operations',
  },
  {
    path: '/marketing',
    name: 'marketing',
    component: Marketing,
    icon: Ticket,
    group: 'Operations',
  },

  // ── System ────────────────────────────────────────────────────
  {
    path: '/payment/channels',
    name: 'paymentChannels',
    component: PaymentChannelList,
    icon: CreditCard,
    group: 'System',
  },
  {
    path: '/finance',
    name: 'finance',
    component: Finance,
    icon: Wallet, // 财务用钱包图标，与支付渠道的 CreditCard 区分
    group: 'System',
  },
  {
    path: '/finance/detail', // 修正：原路径 /FinancePage 大写不规范
    name: 'finance_page',
    component: FinancePage,
    icon: Wallet,
    group: 'System',
    hidden: true, // 与 /finance 功能重叠，暂隐藏，保留路由可直接访问
  },
  {
    path: '/admin-security',
    name: 'admin_security',
    component: AdminSecurity,
    icon: KeyRound, // 安全/密钥语义
    group: 'System',
  },
  {
    path: '/content',
    name: 'content_cms',
    component: ContentCMS,
    icon: FileText,
    group: 'System',
  },
  {
    path: '/system',
    name: 'system',
    component: SystemSettings,
    icon: Settings,
    group: 'System',
  },
];
