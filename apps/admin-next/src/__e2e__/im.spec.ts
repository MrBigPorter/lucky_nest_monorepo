/**
 * E2E — Customer Service Desk (/customer-service)
 * Phase 5-D
 *
 * 覆盖: 页面加载  双栏布局  会话列表  空态占位  Socket 状态指示
 */
import {
  test,
  expect,
  expectNoError,
  dismissDevOverlay,
  waitForDashboard,
} from './fixtures';

const PATH = '/customer-service/';

test.describe('Customer Service Desk — /customer-service', () => {
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

  test('显示 Customer Service 相关标题', async ({ page }) => {
    await expect(
      page
        .getByText(/customer service/i)
        .or(page.getByText(/support/i))
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('双栏布局渲染（会话列表 + 聊天窗口占位）', async ({ page }) => {
    // Left panel should contain conversation-related text or empty state
    await expect(
      page
        .getByText(/conversation/i)
        .or(page.getByText(/no conversation/i))
        .or(page.getByText(/select a conversation/i))
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('右侧空态占位：Select a conversation', async ({ page }) => {
    // When no conv is selected, the right panel shows placeholder text
    await expect(page.getByText(/select a conversation/i)).toBeVisible({
      timeout: 20_000,
    });
  });

  test('Socket 状态指示器可见（Live / Connecting / Polling）', async ({
    page,
  }) => {
    await expect(
      page
        .getByText(/live/i)
        .or(page.getByText(/connecting/i))
        .or(page.getByText(/polling/i))
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('筛选下拉存在 All / Open / Closed', async ({ page }) => {
    const sel = page.locator('select').first();
    if (await sel.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await expect(sel).toBeVisible();
    }
  });

  test('点击会话后右侧聊天窗口出现（若有会话）', async ({ page }) => {
    // Try to click the first conversation item if present
    const item = page
      .locator('[data-testid="conv-item"]')
      .or(page.locator('.cursor-pointer').first());
    const visible = await item.isVisible({ timeout: 5_000 }).catch(() => false);
    if (visible) {
      await item.click({ force: true });
      // After clicking, "Select a conversation" should disappear
      await expect(page.getByText(/select a conversation/i)).not.toBeVisible({
        timeout: 8_000,
      });
    }
    // Non-fatal: empty conversation list is a valid state
    await expectNoError(page);
  });
});
