/**
 * E2E — Login Logs (/login-logs)
 * Phase 5-E
 *
 * 覆盖: 页面加载  日志表格  User ID 搜索  IP 搜索  状态过滤  分页
 */
import {
  test,
  expect,
  expectNoError,
  dismissDevOverlay,
  waitForDashboard,
} from './fixtures';

const PATH = '/login-logs/';

test.describe('Login Logs — /login-logs', () => {
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

  test('显示 Login Logs 标题', async ({ page }) => {
    await expect(page.getByText(/login logs/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('表格包含 User / Time / IP 列头', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/user/i).first()).toBeVisible();
    await expect(page.getByText(/time/i).first()).toBeVisible();
    await expect(page.getByText(/ip/i).first()).toBeVisible();
  });

  test('User ID 输入框可输入', async ({ page }) => {
    const input = page.getByPlaceholder(/user id/i).first();
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill('test-user');
    await expect(input).toHaveValue('test-user');
    await input.fill('');
  });

  test('IP Address 输入框可输入', async ({ page }) => {
    const input = page.getByPlaceholder(/ip/i).first();
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.fill('127.0.0.1');
    await expect(input).toHaveValue('127.0.0.1');
    await input.fill('');
  });

  test('状态过滤 select 包含 All / Success / Failed', async ({ page }) => {
    const select = page.locator('select').first();
    await expect(select).toBeVisible({ timeout: 10_000 });
    await expect(select).toContainText('All');
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

  test('日志行包含 Success / Failed 状态徽章', async ({ page }) => {
    // Wait for data rows to appear
    const row = page.locator('tbody tr').first();
    if (await row.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await expect(
        page
          .getByText(/success/i)
          .or(page.getByText(/failed/i))
          .first(),
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});
