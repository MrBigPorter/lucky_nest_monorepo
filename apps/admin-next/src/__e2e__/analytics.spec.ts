/**
 * E2E — Analytics Dashboard (/analytics)
 *
 * 覆盖: 页面加载  统计卡片  趋势图表区域
 */
import { test, expect } from '@playwright/test';
import { expectNoError, dismissDevOverlay, waitForDashboard } from './fixtures';

const PATH = '/analytics/';

test.describe('Analytics — /analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PATH);
    await waitForDashboard(page);
    await expectNoError(page);
    await dismissDevOverlay(page);
  });

  test('页面加载不崩溃', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Application error', {
      timeout: 20_000,
    });
  });

  test('显示 Data Analytics 标题', async ({ page }) => {
    await expect(page.getByText(/data analytics/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('统计卡片区域渲染（SSR 预取）', async ({ page }) => {
    // AnalyticsOverview renders server-side — should be present quickly
    await expect(page.getByText(/users/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('趋势图表区域渲染', async ({ page }) => {
    // AnalyticsTrendSection is a client component
    await expect(
      page
        .getByText(/trend/i)
        .or(page.getByText(/revenue/i))
        .first(),
    ).toBeVisible({ timeout: 25_000 });
  });

  test('没有 Application error', async ({ page }) => {
    await expectNoError(page);
  });
});
