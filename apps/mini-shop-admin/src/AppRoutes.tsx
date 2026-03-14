import React, { JSX, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore.ts';
import { Layout } from '@/components/layout/Layout.tsx';
import { Login } from '@/pages/Login.tsx';
import { routes } from '@/routes/index.ts';

/** 路由懒加载 fallback — 页面切换时的 loading 状态 */
const PageLoading = () => (
  <div className="flex h-full items-center justify-center p-20">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
  </div>
);

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
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  {routes.map(({ path, component: Component }) => (
                    <Route key={path} path={path} element={<Component />} />
                  ))}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};
