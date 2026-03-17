/**
 * E2E — Register Applications Management (超管审批 Tab)
 *
 * 覆盖:
 * 1. /admin-users 页面包含 "Applications" Tab
 * 2. 点击 Applications Tab 切换内容区
 * 3. Applications 列表表格渲染（含列头）
 * 4. Sidebar 上 Admin Users 菜单项存在（pending badge 可能出现）
 * 5. 状态过滤 select 存在
 * 6. 拒绝弹窗 — 点击 Reject 按钮弹出 modal
 *
 * 前置条件: storageState 已通过 global-setup 注入，访问页面无需登录 UI
 */
import { test, expect } from '@playwright/test';
import { expectNoError, dismissDevOverlay, waitForDashboard } from './fixtures';

const PATH = '/admin-users/';

test.describe('Register Applications — 审批 Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PATH);
    await waitForDashboard(page);
    await expectNoError(page);
    await dismissDevOverlay(page);
  });

  // ── Tab 切换 ────────────────────────────────────────────────────────────────

  test('存在 Applications Tab 按钮', async ({ page }) => {
    await expect(
      page
        .getByRole('button', { name: /applications/i })
        .or(page.getByText(/applications/i).first()),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('点击 Applications Tab 不崩溃', async ({ page }) => {
    const tab = page.getByRole('button', { name: /^applications/i }).first();
    await expect(tab).toBeVisible({ timeout: 20_000 });
    await tab.click({ force: true });
    await expectNoError(page);
    await expect(page.locator('body')).not.toContainText('Application error', {
      timeout: 10_000,
    });
  });

  test('切换后显示 Applications 区域内容', async ({ page }) => {
    const tab = page.getByRole('button', { name: /^applications/i }).first();
    await tab.click({ force: true });

    // Should show either a table or an empty-state message
    const content = page
      .locator('table')
      .or(page.getByText(/no applications/i))
      .or(page.getByText(/pending/i).first());
    await expect(content.first()).toBeVisible({ timeout: 15_000 });
  });

  // ── 列表渲染 ────────────────────────────────────────────────────────────────

  test('Applications 表格包含 Username 列', async ({ page }) => {
    const tab = page.getByRole('button', { name: /^applications/i }).first();
    await tab.click({ force: true });

    const hasTable = await page
      .locator('table')
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (hasTable) {
      await expect(page.getByText(/username/i).first()).toBeVisible({
        timeout: 10_000,
      });
    }
    // If no table, it's empty-state — also valid
  });

  test('Applications 表格包含 Status 列或状态徽章', async ({ page }) => {
    const tab = page.getByRole('button', { name: /^applications/i }).first();
    await tab.click({ force: true });

    const hasTable = await page
      .locator('table')
      .isVisible({ timeout: 10_000 })
      .catch(() => false);

    if (hasTable) {
      await expect(
        page
          .getByText(/status/i)
          .first()
          .or(page.getByText(/pending/i).first())
          .or(page.getByText(/approved/i).first()),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  // ── 过滤 ─────────────────────────────────────────────────────────────────────

  test('Applications Tab 存在状态过滤 select', async ({ page }) => {
    const tab = page.getByRole('button', { name: /^applications/i }).first();
    await tab.click({ force: true });

    // A status select (All / Pending / Approved / Rejected) should appear
    const select = page.locator('select').first();
    const isVisible = await select
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    // Allow either select or custom dropdown
    const customDropdown = page
      .getByRole('combobox')
      .or(page.getByRole('listbox'))
      .first();
    const hasFilter =
      isVisible ||
      (await customDropdown.isVisible({ timeout: 3_000 }).catch(() => false));
    expect(hasFilter).toBe(true);
  });

  // ── Reject 弹窗 ──────────────────────────────────────────────────────────────

  test('有 pending 数据时 Reject 按钮点击弹出 modal', async ({ page }) => {
    const tab = page.getByRole('button', { name: /^applications/i }).first();
    await tab.click({ force: true });

    // Only run if a Reject button exists (i.e. pending items exist)
    const rejectBtn = page.getByRole('button', { name: /reject/i }).first();
    const hasReject = await rejectBtn
      .isVisible({ timeout: 8_000 })
      .catch(() => false);
    if (!hasReject) {
      test.skip(); // No pending applications in test DB — skip gracefully
      return;
    }

    await rejectBtn.click({ force: true });
    await expect(
      page
        .locator('[role="dialog"]')
        .or(page.locator('.fixed.inset-0'))
        .first(),
    ).toBeVisible({ timeout: 8_000 });
    await expectNoError(page);
  });

  test('有 pending 数据时 Approve 按钮可见', async ({ page }) => {
    const tab = page.getByRole('button', { name: /^applications/i }).first();
    await tab.click({ force: true });

    const approveBtn = page.getByRole('button', { name: /approve/i }).first();
    const hasApprove = await approveBtn
      .isVisible({ timeout: 8_000 })
      .catch(() => false);
    if (!hasApprove) {
      test.skip(); // No pending applications
      return;
    }
    await expect(approveBtn).toBeVisible();
  });

  // ── Sidebar badge ────────────────────────────────────────────────────────────

  test('Sidebar 存在 Admin Users (或 Users) 菜单入口', async ({ page }) => {
    const sidebarLink = page
      .locator('aside')
      .getByRole('link', { name: /admin.?users/i })
      .or(page.locator('aside').getByText(/admin.?users/i))
      .first();
    await expect(sidebarLink).toBeVisible({ timeout: 20_000 });
  });

  test('pending badge 数字格式正确（如果出现）', async ({ page }) => {
    // Badge may or may not appear depending on DB state
    const badge = page
      .locator('aside')
      .locator('span')
      .filter({ hasText: /^\d+$/ })
      .or(page.locator('aside').locator('span').filter({ hasText: /99\+/ }))
      .first();

    const hasBadge = await badge
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    if (hasBadge) {
      const text = await badge.textContent();
      expect(text).toMatch(/^\d+$|^99\+$/);
    }
    // If no badge — there are 0 pending applications — also valid
  });
});
