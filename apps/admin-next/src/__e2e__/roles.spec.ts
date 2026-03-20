/**
 * E2E — RBAC Roles Management (/roles)
 *
 * 覆盖: 页面加载  角色卡片列表  内联用户面板
 */
import { test, expect } from '@playwright/test';
import { expectNoError, dismissDevOverlay, waitForDashboard } from './fixtures';

const PATH = '/roles/';

test.describe('Roles Management — /roles', () => {
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

  test('显示 Roles 相关标题', async ({ page }) => {
    await expect(page.getByText(/roles/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('角色卡片渲染（SUPER_ADMIN / ADMIN 等）', async ({ page }) => {
    await expect(
      page
        .getByText(/super.admin/i)
        .or(page.getByText(/admin/i))
        .first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('每个角色卡显示用户数量', async ({ page }) => {
    // RolesManagement shows "N users" per role card
    await expect(page.getByText(/users?$/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('点击角色卡打开内联用户面板', async ({ page }) => {
    const card = page
      .getByText(/super.admin/i)
      .or(page.getByText(/^admin$/i))
      .first();
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.click({ force: true });
    // After click, an inline panel with user details should be visible
    await expect(
      page
        .getByText(/members/i)
        .or(page.getByText(/users in/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
    await expectNoError(page);
  });
});
