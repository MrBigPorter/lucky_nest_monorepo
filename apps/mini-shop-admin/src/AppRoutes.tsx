import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UserManagement } from './pages/UserManagement';
import {
  ProductManagement,
  CategoryManagement,
} from './pages/ProductManagement';
import { GroupManagement } from './pages/GroupManagement';
import { OrderManagement } from './pages/OrderManagement';
import { Marketing } from './pages/Marketing';
import { Finance } from './pages/Finance';
import { SystemSettings } from './pages/SystemSettings';
import { LotteryControl } from './pages/LotteryControl';
import { VipConfig } from './pages/VipConfig';
import { NotificationCenter } from './pages/NotificationCenter';
import { ActivityConfig } from './pages/ActivityConfig';
import { AdminSecurity } from './pages/AdminSecurity';
import { ContentCMS } from './pages/ContentCMS';
import { DataAnalytics } from './pages/DataAnalytics';
import { ServiceCenter } from './pages/ServiceCenter';

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const AppRoutes: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/products" element={<ProductManagement />} />
                <Route path="/categories" element={<CategoryManagement />} />
                <Route path="/groups" element={<GroupManagement />} />
                <Route path="/orders" element={<OrderManagement />} />
                <Route path="/marketing" element={<Marketing />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/system" element={<SystemSettings />} />
                <Route path="/lottery" element={<LotteryControl />} />
                <Route path="/vip" element={<VipConfig />} />
                <Route path="/notifications" element={<NotificationCenter />} />
                <Route path="/activity" element={<ActivityConfig />} />
                <Route path="/admin-security" element={<AdminSecurity />} />
                <Route path="/content" element={<ContentCMS />} />
                <Route path="/analytics" element={<DataAnalytics />} />
                <Route path="/service" element={<ServiceCenter />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
