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
import { Dashboard } from '../pages/Dashboard';
import { UserManagement } from '../pages/UserManagement';
import {
  ProductManagement,
  CategoryManagement,
} from '../pages/ProductManagement';
import { GroupManagement } from '../pages/GroupManagement';
import { OrderManagement } from '../pages/OrderManagement';
import { Marketing } from '../pages/Marketing';
import { Finance } from '../pages/Finance';
import { SystemSettings } from '../pages/SystemSettings';
import { LotteryControl } from '../pages/LotteryControl';
import { VipConfig } from '../pages/VipConfig';
import { NotificationCenter } from '../pages/NotificationCenter';
import { ActivityConfig } from '../pages/ActivityConfig';
import { AdminSecurity } from '../pages/AdminSecurity';
import { ContentCMS } from '../pages/ContentCMS';
import { DataAnalytics } from '../pages/DataAnalytics';
import { ServiceCenter } from '../pages/ServiceCenter';

export interface RouteConfig {
  path: string;
  name: string; // For translation keys
  component: React.ComponentType;
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
    path: '/finance',
    name: 'finance',
    component: Finance,
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
