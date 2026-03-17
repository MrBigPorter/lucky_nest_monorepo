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
  // Default per-test timeout — generous for dev server after warmup
  timeout: 120_000,

  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ?? 'https://admin-dev.joyminis.com',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },

  projects: [
    // Step 1: 登录一次 + 预热所有路由 → 保存 storageState
    // Timeout is generous: Turbopack cold-compiles each page on first request.
    // With persistent cache enabled, subsequent runs only need ~30s total.
    // Worst-case cold start: 14 routes × 2min = 28min → 30min ceiling.
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      timeout: 1_800_000, // 30 minutes — covers cold-start compilation of all pages
    },
    // Step 2: 所有业务测试复用登录状态
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
      testIgnore: [/auth\.setup\.ts/, /register-apply\.spec\.ts/],
    },
    // Step 3: 公开页测试（无需登录，不依赖 setup）
    // 公开页 500 不会拖累认证测试，两者完全隔离
    {
      name: 'public',
      use: {
        ...devices['Desktop Chrome'],
        storageState: { cookies: [], origins: [] },
      },
      testMatch: /register-apply\.spec\.ts|home\.spec\.ts/,
    },
  ],
});
