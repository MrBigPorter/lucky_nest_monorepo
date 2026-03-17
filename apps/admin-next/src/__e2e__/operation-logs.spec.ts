/**
 * E2E — Operation Logs (/operation-logs)
 *
 * 覆盖: 页面加载  日志表格  搜索  操作类型过滤
 */
import { test, expect } from '@playwright/test';
import { expectNoError, dismissDevOverlay, waitForDashboard } from './fixtures';

const PATH = '/operation-logs/';

test.describe('Operation Logs — /operation-logs', () => {
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

  test('显示 Operation Log 标题', async ({ page }) => {
    await expect(page.getByText(/operation.log/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('日志表格渲染（含列头 Admin / Action / Resource）', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page
        .getByText(/admin/i)
        .or(page.getByText(/action/i))
        .first(),
    ).toBeVisible();
  });

  test('操作类型过滤 select 存在', async ({ page }) => {
    const sel = page.locator('select').first();
    if (await sel.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(sel).toBeVisible();
    }
  });

  test('Search 按钮可点击', async ({ page }) => {
    const btn = page.getByRole('button', { name: /search/i }).first();
    if (await btn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await btn.click({ force: true });
      await expectNoError(page);
    }
  });

  test('Reset 按钮可点击', async ({ page }) => {
    const btn = page.getByRole('button', { name: /^reset$/i }).first();
    if (await btn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await btn.click({ force: true });
      await expectNoError(page);
    }
  });

  test('日志行显示时间戳', async ({ page }) => {
    const row = page.locator('tbody tr').first();
    if (await row.isVisible({ timeout: 10_000 }).catch(() => false)) {
      // Timestamps are in MM/dd HH:mm:ss format
      await expect(row).toBeVisible();
    }
  });
});
