/**
 * Global auth setup — runs ONCE before all E2E tests.
 *
 * Logs in via UI, then saves the browser storageState (localStorage + cookies)
 * to playwright/.auth/admin.json.  All business spec files pick up this file
 * via `storageState` in playwright.config.ts and skip the login step entirely.
 */
import { test as setup, expect } from '@playwright/test';
import { loginViaUI } from './helpers';

const AUTH_FILE = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  await loginViaUI(page);

  // Make sure we really landed on the Dashboard before saving state.
  // Wait for any h1 visible — the dashboard h1 text is "Dashboard".
  await expect(
    page.locator('h1').first(),
  ).toBeVisible({ timeout: 30_000 });

  // Persist session for all subsequent tests
  await page.context().storageState({ path: AUTH_FILE });
});

