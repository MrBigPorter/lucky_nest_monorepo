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
} from 'lucide-react';

// ---- 懒加载页面组件 (路由级代码拆分) ----
// 各页面使用 named export，通过 .then() 转为 default export 供 React.lazy 使用
const Dashboard = React.lazy(() =>
  import('../pages/Dashboard').then((m) => ({ default: m.Dashboard })),
);
const UserManagement = React.lazy(() =>
  import('../pages/UserManagement').then((m) => ({
    default: m.UserManagement,
  })),
);
const AdminUserManagement = React.lazy(() =>
  import('../pages/AdminUserManagement').then((m) => ({
    default: m.AdminUserManagement,
  })),
);
const ProductManagement = React.lazy(() =>
  import('../pages/ProductManagement').then((m) => ({
    default: m.ProductManagement,
  })),
);
const CategoryManagement = React.lazy(() =>
  import('../pages/CategoryManagement').then((m) => ({
    default: m.CategoryManagement,
  })),
);
const GroupManagement = React.lazy(() =>
  import('../pages/GroupManagement').then((m) => ({
    default: m.GroupManagement,
  })),
);
const OrderManagement = React.lazy(() =>
  import('../pages/OrderManagement').then((m) => ({
    default: m.OrderManagement,
  })),
);
const Marketing = React.lazy(() =>
  import('../pages/Marketing').then((m) => ({ default: m.Marketing })),
);
const Finance = React.lazy(() =>
  import('../pages/Finance').then((m) => ({ default: m.Finance })),
);
const SystemSettings = React.lazy(() =>
  import('../pages/SystemSettings').then((m) => ({
    default: m.SystemSettings,
  })),
);
const LotteryControl = React.lazy(() =>
  import('../pages/LotteryControl').then((m) => ({
    default: m.LotteryControl,
  })),
);
const VipConfig = React.lazy(() =>
  import('../pages/VipConfig').then((m) => ({ default: m.VipConfig })),
);
const NotificationCenter = React.lazy(() =>
  import('../pages/NotificationCenter').then((m) => ({
    default: m.NotificationCenter,
  })),
);
const ActivityConfig = React.lazy(() =>
  import('../pages/ActivityConfig').then((m) => ({
    default: m.ActivityConfig,
  })),
);
const AdminSecurity = React.lazy(() =>
  import('../pages/AdminSecurity').then((m) => ({
    default: m.AdminSecurity,
  })),
);
const ContentCMS = React.lazy(() =>
  import('../pages/ContentCMS').then((m) => ({ default: m.ContentCMS })),
);
const DataAnalytics = React.lazy(() =>
  import('../pages/DataAnalytics').then((m) => ({
    default: m.DataAnalytics,
  })),
);
const ServiceCenter = React.lazy(() =>
  import('../pages/ServiceCenter').then((m) => ({
    default: m.ServiceCenter,
  })),
);
const ActSectionManagement = React.lazy(() =>
  import('@/pages/ActSectionManagement').then((m) => ({
    default: m.ActSectionManagement,
  })),
);
const BannerManagement = React.lazy(() =>
  import('@/pages/BannerManagement').then((m) => ({
    default: m.BannerManagement,
  })),
);
const FinancePage = React.lazy(() =>
  import('@/pages/FinancePage').then((m) => ({ default: m.FinancePage })),
);
const AddressList = React.lazy(() =>
  import('@/pages/AddressList').then((m) => ({ default: m.AddressList })),
);
const KycList = React.lazy(() =>
  import('@/pages/KycList').then((m) => ({ default: m.KycList })),
);
const PaymentChannelList = React.lazy(() =>
  import('@/pages/PaymentChannelList').then((m) => ({
    default: m.PaymentChannelList,
  })),
);

export interface RouteConfig {
  path: string;
  name: string; // For translation keys
  component: React.ComponentType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  group: 'Overview' | 'Management' | 'Operations' | 'System';
}

export const routes: RouteConfig[] = [
  // Overview
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    icon: LayoutDashboard,
    group: 'Overview',
  },

  // Management
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
    icon: Users,
    group: 'Management',
  },
  {
    path: '/address',
    name: 'address',
    component: AddressList,
    icon: Users,
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
    path: '/act/section',
    name: 'actSection',
    component: ActSectionManagement,
    icon: ShoppingBag,
    group: 'Management',
  },
  {
    path: '/banners',
    name: 'banners',
    component: BannerManagement,
    icon: ShoppingBag,
    group: 'Management',
  },
  {
    path: '/categories',
    name: 'categories',
    component: CategoryManagement,
    icon: ShoppingBag,
    group: 'Management',
  },
  {
    path: '/groups',
    name: 'groups',
    component: GroupManagement,
    icon: Users,
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

  // Operations
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

  // System
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
    icon: CreditCard,
    group: 'System',
  },
  {
    path: '/FinancePage',
    name: 'finance_page',
    component: FinancePage,
    icon: CreditCard,
    group: 'System',
  },
  {
    path: '/admin-security',
    name: 'admin_security',
    component: AdminSecurity,
    icon: Shield,
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
