import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 配置
 *
 * 运行方式:
 *   pnpm e2e              # headless 全量
 *   pnpm e2e:ui           # UI 调试模式
 *   pnpm e2e:headed       # 有头浏览器
 *   pnpm e2e:report       # 查看 HTML 报告
 *
 * 认证机制:
 *   setup project 登录一次 → 保存到 playwright/.auth/admin.json
 *   所有业务 test 直接复用，跳过重复登录
 */

export const STORAGE_STATE = 'playwright/.auth/admin.json';

export default defineConfig({
  testDir: './src/__e2e__',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  // Default per-test timeout — generous for slow dev server
  timeout: 60_000,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'https://admin-dev.joyminis.com',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },

  projects: [
    // Step 1: 登录一次 + 预热所有路由 → 保存 storageState
    // Uses a very long timeout because Turbopack compiles pages lazily on first request.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      // 5 minutes: login (up to 60s) + 14 warm-up routes × ~20s each
      timeout: 300_000,
    },
    // Step 2: 所有业务测试复用登录状态
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
