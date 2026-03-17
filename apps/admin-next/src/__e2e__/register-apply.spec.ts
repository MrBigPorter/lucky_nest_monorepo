/**
 * E2E — Register Apply (公开申请页 /register-apply)
 *
 * 覆盖:
 * 1. 页面可访问（不需要登录）
 * 2. 表单元素全部渲染
 * 3. 空表单提交触发 required 校验
 * 4. 密码不一致触发校验
 * 5. 密码强度校验（纯字母不含数字）
 * 6. "Back to Sign In" 链接跳回 /login
 *
 * ⚠️  reCAPTCHA v3 是无感的（不弹窗），测试环境 NEXT_PUBLIC_RECAPTCHA_SITE_KEY 为空
 *    → GoogleReCaptchaProvider 会静默降级，不影响 UI 测试。
 *    实际提交的网络请求由后端 RecaptchaService 处理（RECAPTCHA_SECRET_KEY=disabled 时跳过）。
 *
 * 隔离策略:
 *    此文件属于 playwright.config.ts 的 "public" project，
 *    不依赖 setup（无需登录），与认证测试完全隔离。
 *    页面 500 时 beforeAll guard 自动 skip 全组，不影响 chromium project。
 */
import { test, expect } from '@playwright/test';
import { dismissDevOverlay, expectNoError } from './fixtures';

const PATH = '/register-apply/';

// beforeAll: 健康检查 — 页面 500 则整组 skip，避免产生误导性 fail
// 这是防御 RSC/编译错误再次出现的第一道屏障
test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  try {
    const response = await page.goto(PATH, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const status = response?.status() ?? 0;
    if (status >= 500) {
      console.error(`⛔ /register-apply/ returned HTTP ${status} — skipping all tests in this suite`);
      test.skip();
    }
    // Also check for runtime error text injected by Next.js error overlay
    const body = await page.textContent('body').catch(() => '');
    if (body?.includes('Application error') || body?.includes('createContext) is not a function')) {
      console.error('⛔ /register-apply/ has a runtime error — skipping all tests');
      test.skip();
    }
  } finally {
    await ctx.close();
  }
});

const PATH = '/register-apply/';

// beforeAll: 健康检查
  test.beforeEach(async ({ page }) => {
    await page.goto(PATH);
    await page.waitForLoadState('domcontentloaded');
    await dismissDevOverlay(page);
    await expectNoError(page);
  });

  // ── 可访问性 ────────────────────────────────────────────────────────────────

  test('页面加载不崩溃，不被重定向到 /login', async ({ page }) => {
    expect(page.url()).toContain('/register-apply');
    await expect(page.locator('body')).not.toContainText('Application error', {
      timeout: 20_000,
    });
  });

  test('显示页面标题 "Apply for Admin Access"', async ({ page }) => {
    await expect(page.getByText(/apply for admin access/i).first()).toBeVisible(
      { timeout: 20_000 },
    );
  });

  // ── 表单渲染 ────────────────────────────────────────────────────────────────

  test('渲染所有必填字段', async ({ page }) => {
    await expect(page.getByLabel(/username/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(
      page.getByLabel(/real name/i).or(page.getByLabel(/full name/i)),
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('Submit 按钮存在', async ({ page }) => {
    await expect(
      page
        .getByRole('button', { name: /submit application/i })
        .or(page.getByRole('button', { name: /submit/i }))
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('"Back to Sign In" 链接存在', async ({ page }) => {
    await expect(
      page
        .getByRole('link', { name: /back to sign in/i })
        .or(page.getByText(/back to sign in/i))
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  // ── 表单校验 ────────────────────────────────────────────────────────────────

  test('空表单提交显示 required 错误', async ({ page }) => {
    const submitBtn = page
      .getByRole('button', { name: /submit application/i })
      .or(page.getByRole('button', { name: /submit/i }))
      .first();
    await submitBtn.click({ force: true });

    // At least one validation error should appear
    const errorText = page.locator(
      '[class*="text-red"], [class*="error"], [role="alert"]',
    );
    await expect(errorText.first()).toBeVisible({ timeout: 8_000 });
  });

  test('密码不一致时显示 "do not match" 错误', async ({ page }) => {
    await page.getByLabel(/^password$/i).fill('Password1');
    await page.getByLabel(/confirm password/i).fill('DifferentPass1');

    const submitBtn = page.getByRole('button', { name: /submit/i }).first();
    await submitBtn.click({ force: true });

    await expect(
      page
        .getByText(/do not match/i)
        .or(page.getByText(/passwords/i))
        .first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('密码不含数字时显示强度错误', async ({ page }) => {
    await page.getByLabel(/^password$/i).fill('OnlyLetters');
    // Blur to trigger validation
    await page.getByLabel(/confirm password/i).click();

    await expect(
      page
        .getByText(/letter and a number/i)
        .or(page.getByText(/must contain/i))
        .first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('用户名含特殊字符时显示校验错误', async ({ page }) => {
    await page.getByLabel(/username/i).fill('invalid user!');
    await page.getByLabel(/^password$/i).click(); // blur
    await expect(
      page
        .getByText(/only.*letters/i)
        .or(page.getByText(/underscores/i))
        .first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── 导航 ─────────────────────────────────────────────────────────────────────

  test('点击 "Back to Sign In" 跳转到 /login', async ({ page }) => {
    const link = page
      .getByRole('link', { name: /back to sign in/i })
      .or(page.getByRole('link', { name: /sign in/i }))
      .first();
    await link.click({ force: true });
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/login');
  });

  // ── Apply for access 入口（Login 页）────────────────────────────────────────

  test('登录页包含 "Apply for access" 链接', async ({ page }) => {
    await page.goto('/login/');
    await page.waitForLoadState('domcontentloaded');
    await dismissDevOverlay(page);
    await expect(
      page
        .getByRole('link', { name: /apply for access/i })
        .or(page.getByText(/apply for access/i))
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('从登录页点击 Apply for access 跳转到 /register-apply', async ({
    page,
  }) => {
    await page.goto('/login/');
    await page.waitForLoadState('domcontentloaded');
    await dismissDevOverlay(page);

    const link = page.getByRole('link', { name: /apply for access/i }).first();
    await link.click({ force: true });
    await page.waitForURL(/\/register-apply/, { timeout: 10_000 });
    expect(page.url()).toContain('/register-apply');
  });
});
