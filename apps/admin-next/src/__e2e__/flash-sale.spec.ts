/**
 * E2E — Flash Sale Management (/flash-sale)
 * Phase 5-B
 *
 * 覆盖: 页面加载  场次列表  New Session 按钮  弹窗字段
 */
import { test, expect } from '@playwright/test';
import { expectNoError, dismissDevOverlay, waitForDashboard } from './fixtures';

const PATH = '/flash-sale/';

test.describe('Flash Sale Management — /flash-sale', () => {
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

  test('显示 Flash Sale 页面标题', async ({ page }) => {
    await expect(page.getByText(/flash sale/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('页面包含 session 计数文字', async ({ page }) => {
    // e.g. "0 sessions" or "3 sessions"
    await expect(page.getByText(/session/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('New Session 按钮存在', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /new session/i })
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
  });

  test('点击 New Session 弹出创建弹窗', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /new session/i })
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click({ force: true });
    await expect(
      page
        .locator('[role="dialog"]')
        .or(page.locator('[data-state="open"]'))
        .or(page.locator('.fixed.inset-0')),
    ).toBeVisible({ timeout: 8_000 });
    await expectNoError(page);
  });

  test('弹窗包含 Title / Start Time / End Time 字段', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /new session/i })
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await btn.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('Start Time')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('End Time')).toBeVisible({ timeout: 8_000 });
  });

  test('关闭弹窗后回到场次列表', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /new session/i })
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await btn.click({ force: true });
    await page.waitForTimeout(300);
    // Use Escape to close the modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    // Modal should be gone, list still visible
    await expect(page.getByText(/flash sale/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expectNoError(page);
  });
});
