/**
 * E2E — Product Management (/products)
 *
 * 覆盖: 页面加载  表格渲染  搜索  Add Product 按钮
 */
import { test, expect } from '@playwright/test';
import { expectNoError, dismissDevOverlay, waitForDashboard } from './fixtures';

const PATH = '/products/';

test.describe('Product Management — /products', () => {
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

  test('显示 Products 标题', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /product/i }).first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('商品表格渲染', async ({ page }) => {
    const table = page.locator('table').first();
    await expect(table).toBeVisible({ timeout: 20_000 });
  });

  test('Search 按钮可点击', async ({ page }) => {
    const btn = page.getByRole('button', { name: /search/i }).first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click({ force: true });
    await expectNoError(page);
  });

  test('Reset 按钮可点击', async ({ page }) => {
    const btn = page.getByRole('button', { name: /^reset$/i }).first();
    if (await btn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await btn.click({ force: true });
      await expectNoError(page);
    }
  });

  test('Add Product 按钮存在', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /add product/i })
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
  });

  test('点击 Add Product 弹出创建弹窗', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /add product/i })
      .or(page.getByRole('button', { name: /create/i }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click({ force: true });
    await expect(
      page.locator('[role="dialog"]').or(page.locator('[data-state="open"]')),
    ).toBeVisible({ timeout: 8_000 });
    await expectNoError(page);
  });
});
