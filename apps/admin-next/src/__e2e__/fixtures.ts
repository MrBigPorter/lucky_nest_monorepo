/**
 * Shared E2E fixtures & page-level helpers.
 */
import { test as base, expect, Page } from '@playwright/test';

export { expect };

// ── Custom test fixture ───────────────────────────────────────────
export const test = base.extend<{
  gotoPage: (path: string) => Promise<void>;
}>({
  gotoPage: async ({ page }, use) => {
    await use(async (path: string) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
    });
  },
});

// ── Dev overlay helper ────────────────────────────────────────────
export async function dismissDevOverlay(page: Page) {
  await page.evaluate(() => {
    document
      .querySelectorAll('nextjs-portal, [data-nextjs-dev-overlay]')
      .forEach((el) => el.remove());
  }).catch(() => {});
}

// ── Dashboard hydration helper ────────────────────────────────────
/**
 * Wait for the DashboardLayout's sidebar (<aside>) to become visible.
 * The sidebar appears as soon as the client-side auth guard completes,
 * regardless of pending data fetches.  Much faster than waiting for
 * data spinners, and safe to use in every beforeEach hook.
 *
 * Use a longer timeout (default 60 s) for cold Turbopack compilations
 * (login flow, first page visit after server restart).
 */
export async function waitForDashboard(page: Page, timeout = 60_000) {
  await page.locator('aside').waitFor({ state: 'visible', timeout });
}

// ── Shared assertions ─────────────────────────────────────────────
export async function expectNoError(page: Page) {
  await expect(page.locator('body')).not.toContainText('Application error', {
    timeout: 10_000,
  });
  await expect(page.locator('body')).not.toContainText(
    'Internal Server Error',
    { timeout: 500 },
  );
}

export async function waitForContent(page: Page, timeout = 20_000) {
  await page
    .locator('table tr, [data-testid], h1, h2, h3')
    .first()
    .waitFor({ state: 'visible', timeout });
}

export async function gotoAndWait(page: Page, path: string) {
  await page.goto(path);
  await waitForDashboard(page);
  await expectNoError(page);
  return page;
}

export async function forceClick(page: Page, locator: ReturnType<Page['getByRole']>) {
  await dismissDevOverlay(page);
  await locator.click({ force: true });
}
