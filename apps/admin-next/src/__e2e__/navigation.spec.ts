/**
 * E2E — 侧边栏 & 导航测试  (uses shared auth state)
 */
import { test, expect } from '@playwright/test';
import { waitForDashboard } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await waitForDashboard(page);
});

test.describe('Sidebar — 侧边栏导航', () => {
  test('侧边栏显示 Overview、Management 分组', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    await expect(sidebar.getByText('Overview')).toBeVisible({
      timeout: 15_000,
    });
    await expect(sidebar.getByText('Management').first()).toBeVisible();
  });

  test('侧边栏显示 Operations、System 分组', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    await expect(sidebar.getByText('Operations')).toBeVisible({
      timeout: 15_000,
    });
    await expect(sidebar.getByText('System')).toBeVisible();
  });

  // 验证关键路由可以打开（不崩溃）
  const routes = [
    { name: 'Orders', path: '/orders/' },
    { name: 'Users', path: '/users/' },
    { name: 'Products', path: '/products/' },
    { name: 'Marketing', path: '/marketing/' },
    { name: 'Finance', path: '/finance/' },
    { name: 'Categories', path: '/categories/' },
    { name: 'Banners', path: '/banners/' },
    // Phase 5
    { name: 'Ads', path: '/ads/' },
    { name: 'Flash Sale', path: '/flash-sale/' },
    { name: 'Settings', path: '/settings/' },
    { name: 'IM', path: '/im/' },
    { name: 'Login Logs', path: '/login-logs/' },
    { name: 'Analytics', path: '/analytics/' },
    { name: 'Notifications', path: '/notifications/' },
    { name: 'Roles', path: '/roles/' },
    { name: 'Operation Logs', path: '/operation-logs/' },
  ];

  for (const route of routes) {
    test(`导航到 ${route.name} 不崩溃`, async ({ page }) => {
      await page.goto(route.path);
      await waitForDashboard(page, 45_000).catch(() => {});
      await expect(page.locator('body')).not.toContainText(
        'Application error',
        {
          timeout: 10_000,
        },
      );
    });
  }
});
