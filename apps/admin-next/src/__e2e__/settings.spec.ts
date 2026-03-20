/**
 * E2E — System Config (/settings)
 * Phase 5-C
 *
 * 覆盖: 页面加载  KV 配置列表  inline 编辑
 */
import { test, expect } from '@playwright/test';
import { expectNoError, dismissDevOverlay, waitForDashboard } from './fixtures';

const PATH = '/settings/';

test.describe('System Config — /settings', () => {
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

  test('显示 System Config 标题', async ({ page }) => {
    await expect(page.getByText(/system config/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('显示 config item 计数', async ({ page }) => {
    await expect(page.getByText(/config item/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('列表中包含 exchange_rate 条目', async ({ page }) => {
    // Waits for API data to populate
    await expect(page.getByText(/exchange.rate/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('编辑图标按钮可见', async ({ page }) => {
    // Wait for at least one edit button (Edit2 icon)
    const editBtn = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await expect(editBtn).toBeVisible({ timeout: 15_000 });
  });

  test('页脚提示 Press Enter to save 可见', async ({ page }) => {
    await expect(page.getByText(/press/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
