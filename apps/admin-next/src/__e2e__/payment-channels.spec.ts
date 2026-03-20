/**
 * E2E — Payment Channel Management (/payment-channels)
 *
 * 覆盖: 页面加载  渠道列表  搜索  Add Channel 按钮  弹窗
 */
import { test, expect, expectNoError, waitForDashboard } from './fixtures';

const PATH = '/payment-channels/';

test.describe('Payment Channel Management — /payment-channels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PATH);
    await waitForDashboard(page);
    await expectNoError(page);
  });

  test('页面加载不崩溃', async ({ page }) => {
    await expect(page.locator('body')).not.toContainText('Application error', {
      timeout: 20_000,
    });
  });

  test('显示 Payment Channel 相关标题', async ({ page }) => {
    await expect(page.getByText(/payment channel/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('渠道表格或列表渲染', async ({ page }) => {
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 20_000 });
  });

  test('Search 按钮可点击', async ({ page }) => {
    const btn = page.getByRole('button', { name: /search/i }).first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await expectNoError(page);
  });

  test('Reset 按钮可点击', async ({ page }) => {
    const btn = page.getByRole('button', { name: /reset/i }).first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await expectNoError(page);
  });

  test('Add Channel 按钮存在并可点击', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /add channel/i })
      .or(page.getByRole('button', { name: /create/i }))
      .or(page.getByRole('button', { name: /add/i }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await expect(
      page.locator('[role="dialog"]').or(page.locator('[data-state="open"]')),
    ).toBeVisible({ timeout: 8_000 });
    await expectNoError(page);
  });
});
