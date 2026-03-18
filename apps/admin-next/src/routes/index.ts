import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Ticket,
  CreditCard,
  Settings,
  Users,
  Package,
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
  Zap,
  MessageSquare,
  Megaphone,
  LogIn,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

export type RouteGroup = 'Overview' | 'Management' | 'Operations' | 'System';

export interface RouteConfig {
  path: string;
  /** 对应 TRANSLATIONS 中的 key */
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  group: RouteGroup;
  /** true = 路由保留但不在侧边栏显示 */
  hidden?: boolean;
}

export const routes: RouteConfig[] = [
  // ── Overview ──────────────────────────────────────────────────
  {
    path: '/',
    name: 'dashboard',
    icon: LayoutDashboard,
    group: 'Overview',
  },

  // ── Management ────────────────────────────────────────────────
  {
    path: '/users',
    name: 'users',
    icon: Users,
    group: 'Management',
  },
  {
    path: '/kyc',
    name: 'kyc',
    icon: UserCheck,
    group: 'Management',
  },
  {
    path: '/address',
    name: 'address',
    icon: MapPin,
    group: 'Management',
  },
  {
    path: '/admin-users',
    name: 'admin',
    icon: Shield,
    group: 'Management',
  },
  {
    path: '/products',
    name: 'products',
    icon: ShoppingBag,
    group: 'Management',
  },
  {
    path: '/categories',
    name: 'categories',
    icon: Tag,
    group: 'Management',
  },
  {
    path: '/act/section',
    name: 'actSection',
    icon: LayoutGrid,
    group: 'Management',
  },
  {
    path: '/banners',
    name: 'banners',
    icon: Image,
    group: 'Management',
  },
  {
    path: '/groups',
    name: 'groups',
    icon: UsersRound,
    group: 'Management',
  },
  {
    path: '/orders',
    name: 'orders',
    icon: Package,
    group: 'Management',
  },
  {
    path: '/service',
    name: 'service',
    icon: Headphones,
    group: 'Management',
    hidden: true,
  },

  // ── Operations ────────────────────────────────────────────────
  {
    path: '/analytics',
    name: 'analytics',
    icon: PieChart,
    group: 'Operations',
  },
  {
    path: '/operation-logs',
    name: 'operationLogs',
    icon: FileText,
    group: 'Operations',
  },
  {
    path: '/lottery',
    name: 'lottery',
    icon: Zap,
    group: 'Operations',
    hidden: true,
  },
  {
    path: '/activity',
    name: 'activity',
    icon: Gift,
    group: 'Operations',
    hidden: true,
  },
  {
    path: '/vip',
    name: 'vip',
    icon: Crown,
    group: 'Operations',
    hidden: true,
  },
  {
    path: '/notifications',
    name: 'notifications',
    icon: Bell,
    group: 'Operations',
  },
  {
    path: '/im',
    name: 'im',
    icon: MessageSquare,
    group: 'Operations',
  },
  {
    path: '/marketing',
    name: 'marketing',
    icon: Ticket,
    group: 'Operations',
  },
  {
    path: '/ads',
    name: 'ads',
    icon: Megaphone,
    group: 'Operations',
  },
  {
    path: '/flash-sale',
    name: 'flashSale',
    icon: Zap,
    group: 'Operations',
  },
  {
    path: '/lucky-draw',
    name: 'luckyDraw',
    icon: Sparkles,
    group: 'Operations',
  },
  {
    path: '/login-logs',
    name: 'loginLogs',
    icon: LogIn,
    group: 'Operations',
  },
  {
    path: '/login-log',
    name: 'loginLogs',
    icon: LogIn,
    group: 'Operations',
    hidden: true,
  },

  // ── System ────────────────────────────────────────────────────
  {
    path: '/payment/channels',
    name: 'paymentChannels',
    icon: CreditCard,
    group: 'System',
  },
  {
    path: '/finance',
    name: 'finance',
    icon: Wallet,
    group: 'System',
  },
  {
    path: '/finance/detail',
    name: 'finance_page',
    icon: Wallet,
    group: 'System',
    hidden: true,
  },
  {
    path: '/roles',
    name: 'roles',
    icon: KeyRound,
    group: 'System',
  },
  {
    path: '/settings',
    name: 'settings',
    icon: SlidersHorizontal,
    group: 'System',
  },
  {
    path: '/admin-security',
    name: 'admin_security',
    icon: KeyRound,
    group: 'System',
    hidden: true,
  },
  {
    path: '/content',
    name: 'content_cms',
    icon: FileText,
    group: 'System',
    hidden: true,
  },
  {
    path: '/system',
    name: 'system',
    icon: Settings,
    group: 'System',
    hidden: true,
  },
];
