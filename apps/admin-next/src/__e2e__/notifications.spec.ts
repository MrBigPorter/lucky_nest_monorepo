/**
 * E2E — Notifications / Push Management (/notifications)
 *
 * 覆盖: 页面加载  设备统计卡片  推送记录列表  广播/定向发送表单
 */
import { test, expect } from '@playwright/test';
import { expectNoError, dismissDevOverlay, waitForDashboard } from './fixtures';

const PATH = '/notifications/';

test.describe('Notifications — /notifications', () => {
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

  test('显示 Notifications / Push 标题', async ({ page }) => {
    await expect(
      page
        .getByText(/notification/i)
        .or(page.getByText(/push/i))
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('设备统计卡片渲染（Total / Android / iOS / Active）', async ({
    page,
  }) => {
    // StatCard shows device counts
    await expect(
      page
        .getByText(/android/i)
        .or(page.getByText(/ios/i))
        .or(page.getByText(/device/i))
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('广播发送表单 (Broadcast) 可见', async ({ page }) => {
    await expect(page.getByText(/broadcast/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('Broadcast 表单含 Title / Body 字段', async ({ page }) => {
    await expect(page.getByLabel(/title/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel(/body/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Send Broadcast 提交按钮存在', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /send broadcast/i })
      .or(page.getByRole('button', { name: /broadcast/i }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
  });

  test('推送日志列表区域渲染', async ({ page }) => {
    await expect(
      page
        .getByText(/push log/i)
        .or(page.getByText(/history/i))
        .or(page.getByText(/log/i))
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
