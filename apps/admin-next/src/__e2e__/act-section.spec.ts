/**
 * E2E — Act Section Management (/act-sections)
 *
 * 覆盖: 页面加载  Section 列表  搜索  Create 按钮  弹窗
 */
import {
  test,
  expect,
  expectNoError,
  dismissDevOverlay,
  waitForDashboard,
} from './fixtures';

const PATH = '/act-sections/';

test.describe('Act Section Management — /act-sections', () => {
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

  test('显示 Act/Section 相关标题', async ({ page }) => {
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('Section 列表内容渲染', async ({ page }) => {
    const content = page
      .locator('table, [class*="card"], [class*="Card"], main')
      .first();
    await expect(content).toBeVisible({ timeout: 20_000 });
  });

  test('Search 按钮可点击', async ({ page }) => {
    const btn = page.getByRole('button', { name: /search/i }).first();
    if (await btn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await btn.click({ force: true });
      await expectNoError(page);
    }
  });

  test('Reset 按钮可点击', async ({ page }) => {
    const btn = page.getByRole('button', { name: /reset/i }).first();
    if (await btn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await btn.click({ force: true });
      await expectNoError(page);
    }
  });

  test('Create Section 按钮存在', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /new section/i })
      .or(page.getByRole('button', { name: /create/i }))
      .or(page.getByRole('button', { name: /add/i }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
  });

  test('点击 Create 按钮弹出弹窗', async ({ page }) => {
    const btn = page
      .getByRole('button', { name: /new section/i })
      .or(page.getByRole('button', { name: /create/i }))
      .or(page.getByRole('button', { name: /add/i }))
      .first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click({ force: true });
    await expect(
      page.locator('[role="dialog"]').or(page.locator('[data-state="open"]')),
    ).toBeVisible({ timeout: 10_000 });
    await expectNoError(page);
  });
});
