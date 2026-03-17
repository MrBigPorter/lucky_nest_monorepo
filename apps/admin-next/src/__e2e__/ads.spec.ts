/**
 * E2E — Advertisement Management (/ads)
 * Phase 5-A
 *
 * 覆盖: 页面加载  广告表格渲染  状态/位置过滤  New Ad 按钮  弹窗
 */
import { test, expect } from '@playwright/test';
import { expectNoError, dismissDevOverlay, waitForDashboard } from './fixtures';

const PATH = '/ads/';

test.describe('Advertisement Management — /ads', () => {
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

  test('显示 Advertisements 页面标题', async ({ page }) => {
    await expect(page.getByText(/advertisements/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('广告表格渲染（含列头 Preview / Title / Position）', async ({
    page,
  }) => {
    await expect(page.locator('table').first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText('Preview')).toBeVisible();
    await expect(page.getByText('Title').first()).toBeVisible();
    await expect(page.getByText('Position').first()).toBeVisible();
  });

  test('状态过滤 select 存在', async ({ page }) => {
    const select = page.locator('select').first();
    await expect(select).toBeVisible({ timeout: 10_000 });
  });

  test('位置过滤 select 包含 All Positions', async ({ page }) => {
    const selects = page.locator('select');
    const count = await selects.count();
    // Should have at least 2 dropdowns: status + position
    expect(count).toBeGreaterThanOrEqual(2);
    const posSelect = selects.nth(1);
    await expect(posSelect).toBeVisible();
    await expect(posSelect).toContainText('All Positions');
  });

  test('New Ad 按钮存在', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /new ad/i })
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
  });

  test('点击 New Ad 弹出创建弹窗', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /new ad/i })
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click({ force: true });
    // Modal or panel visible
    await expect(
      page
        .locator('[role="dialog"]')
        .or(page.locator('[data-state="open"]'))
        .or(page.locator('.fixed.inset-0')),
    ).toBeVisible({ timeout: 8_000 });
    await expectNoError(page);
  });

  test('弹窗包含 Title / Ad Position 表单字段', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /new ad/i })
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await btn.click({ force: true });
    await page.waitForTimeout(500);
    await expect(page.getByText('Ad Position')).toBeVisible({ timeout: 8_000 });
  });
});
