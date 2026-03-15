/**
 * Global auth setup — runs ONCE before all E2E tests.
 *
 * 1. Logs in via UI and saves storageState to playwright/.auth/admin.json
 * 2. Warms up ALL routes so Turbopack compiles each page before individual
 *    specs run (avoids per-spec 30-120s first-compile delays).
 *
 * All business spec files pick up the saved storageState via playwright.config.ts.
 */
import { test as setup, expect } from '@playwright/test';
import { loginViaUI } from './helpers';

const AUTH_FILE = 'playwright/.auth/admin.json';

// All protected routes — keep in sync with apps/admin-next/src/routes/index.ts
const WARMUP_ROUTES = [
  '/',
  '/orders/',
  '/users/',
  '/products/',
  '/categories/',
  '/banners/',
  '/finance/',
  '/marketing/',
  '/kyc/',
  '/groups/',
  '/admin-users/',
  '/address/',
  '/act/section/',
  '/payment/channels/',
];

setup('authenticate and warmup all routes', async ({ page }) => {
  // ── Step 1: Login ──────────────────────────────────────────────────────────
  await loginViaUI(page);

  // Wait until the dashboard h1 is visible (confirms successful login + compile)
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 120_000 });

  // Persist session so all business tests skip the login step
  await page.context().storageState({ path: AUTH_FILE });

  // ── Step 2: Warmup ─────────────────────────────────────────────────────────
  // Visit each route so Turbopack compiles it now rather than during a spec.
  // If a route is already compiled (persistent cache hit), this is near-instant.
  console.log(`\n🔥 Warming up ${WARMUP_ROUTES.length} routes…`);
  for (const route of WARMUP_ROUTES) {
    try {
      console.log(`  → ${route}`);
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 300_000 });
      // Wait for the sidebar which signals the layout is fully rendered
      await page.locator('aside').waitFor({ state: 'visible', timeout: 300_000 });
    } catch {
      // Non-fatal: some routes may redirect or take longer than expected.
      // The spec itself will retry on its own timeout.
      console.warn(`  ⚠️  Warmup failed for ${route} — continuing`);
    }
  }
  console.log('✅ Warmup complete\n');
});

