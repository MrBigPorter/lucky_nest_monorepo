# Lucky Admin — 自动化测试指南

> **目标**：看完这篇文档，能独立读懂、运行、并新增项目测试。  
> **项目路径**：`apps/admin-next/`  
> **测试框架**：单元测试用 [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)，E2E 用 [Playwright](https://playwright.dev/)

---

## 目录

1. [为什么要有两套测试？](#一为什么要有两套测试)
2. [目录结构一览](#二目录结构一览)
3. [单元测试（Vitest）](#三单元测试vitest)
4. [E2E 测试（Playwright）](#四e2e-测试playwright)
5. [Mock 速查手册](#五mock-速查手册)
6. [如何新增一个测试文件](#六如何新增一个测试文件)
7. [常见报错 FAQ](#七常见报错-faq)

---

## 一、为什么要有两套测试？

两套测试解决**不同层面**的问题，缺一不可：

```
你的代码
    │
    ├── 组件 A  → 单元测试 ✅ 通过
    ├── Store B → 单元测试 ✅ 通过
    └── 登录流程（A + B + HTTP + Cookie + 路由跳转 连在一起）
                             → 只有 E2E 才能发现问题
```

|  | 单元测试（Vitest） | E2E（Playwright） |
|-|------------------|------------------|
| **速度** | 极快（毫秒级） | 慢（秒~分钟级） |
| **环境** | jsdom（模拟浏览器） | 真实 Chromium |
| **依赖** | 全部 Mock | 真实 API + 真实路由 |
| **发现问题** | 组件逻辑错误 | 集成 / 交互 / 路由问题 |
| **什么时候跑** | 每次 `git push` | PR 合并前 / 手动 |

**核心原则**：单元测试保证"零件没问题"，E2E 保证"整辆车能开"。

---

## 二、目录结构一览

```
apps/admin-next/
├── vitest.config.ts              ← 单元测试配置
├── playwright.config.ts          ← E2E 测试配置
├── playwright/
│   └── .auth/
│       └── admin.json            ← E2E 登录状态缓存（自动生成，勿提交）
└── src/
    ├── __tests__/                ← 单元测试根目录
    │   ├── setup.ts              ← 全局 Mock 初始化（每个测试文件跑前自动执行）
    │   ├── mocks/
    │   │   ├── next-navigation.ts  ← Mock next/navigation（useRouter 等）
    │   │   ├── next-dynamic.tsx    ← Mock next/dynamic
    │   │   └── view-helpers.tsx    ← 通用 Mock 工厂（所有 view 测试共用）
    │   ├── api/
    │   │   └── http.test.ts      ← HttpClient 测试（MSW 拦截真实网络层）
    │   ├── store/
    │   │   ├── useAuthStore.test.ts
    │   │   ├── useToastStore.test.ts
    │   │   └── useAppStore.test.ts
    │   ├── components/
    │   │   └── UIComponents.test.tsx
    │   └── views/                ← 每个页面一个测试文件（共 15 个）
    │       ├── Login.test.tsx
    │       ├── Dashboard.test.tsx
    │       └── ...
    └── __e2e__/                  ← E2E 测试根目录
        ├── auth.setup.ts         ← 【特殊】全局登录 + 路由预热（只跑一次）
        ├── helpers.ts            ← loginViaUI / injectToken 工具函数
        ├── fixtures.ts           ← waitForDashboard / expectNoError 等共享断言
        ├── auth.spec.ts          ← 认证流程 E2E
        ├── navigation.spec.ts    ← 侧边栏导航 E2E
        ├── users.spec.ts
        └── ...（共 15 个 spec 文件）
```

---

## 三、单元测试（Vitest）

### 3.1 如何运行

```bash
# 跑一次退出
yarn workspace @lucky/admin-next test

# 监听模式（改文件自动重跑）
yarn workspace @lucky/admin-next test:watch

# 生成覆盖率报告（输出到 coverage/ 目录）
yarn workspace @lucky/admin-next test:coverage
```

---

### 3.2 基础配置怎么读（`vitest.config.ts`）

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',   // ① 用 jsdom 模拟浏览器 DOM
    globals: true,          // ② 全局注入 describe/it/expect，不用每次 import
    setupFiles: ['./src/__tests__/setup.ts'],  // ③ 每个测试前先跑 setup
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/__e2e__/**'],  // ④ E2E 文件由 Playwright 负责，这里排除
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // ⑤ next/navigation 替换为 Mock 文件（useRouter 等在 jsdom 里会崩）
      'next/navigation': path.resolve(__dirname, './src/__tests__/mocks/next-navigation.ts'),
      'next/dynamic':    path.resolve(__dirname, './src/__tests__/mocks/next-dynamic.tsx'),
    },
  },
});
```

**重点理解 ①**：Vitest 默认在 Node.js 里运行，没有 `document`、`window`。  
`jsdom` 是纯 JS 实现的"假浏览器"，让 React 组件能正常渲染和操作 DOM。

**重点理解 ⑤**：`next/navigation` 的 `useRouter` 依赖 Next.js 服务器运行时，jsdom 里直接 import 会崩。  
通过 alias 将其替换为 `vi.fn()` 实现的 Mock 文件，测试可以控制路由行为。

---

### 3.3 全局 setup 做了什么（`setup.ts`）

每个测试文件跑之前，`setup.ts` 先执行，补全 jsdom 缺失的浏览器 API：

```typescript
// ① 引入 jest-dom 扩展断言
// 没有这行：expect(el).toBeInTheDocument() 会报 "not a function"
import '@testing-library/jest-dom';

// ② 模拟 localStorage（jsdom 内置实现不完整，自己实现一个）
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem:    (key) => store[key] ?? null,
    setItem:    (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear:      () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ③ 模拟 matchMedia（Tailwind 暗色模式使用，jsdom 没有实现）
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

// ④ 静默 console.warn（防止 axios 等库的冗余日志污染测试输出）
vi.spyOn(console, 'warn').mockImplementation(() => {});
```

---

### 3.4 Mock 是什么，为什么要 Mock

**真实比喻**：  
测试"点击登录按钮后跳转首页"，不需要连接真实后端。  
Mock 就是造一个"假后端"，只回答"登录成功"，让你专注测"按钮点击 → 跳转"这个逻辑。

**以 `Login.tsx` 为例，需要 Mock 的外部依赖**：

```
外部依赖（Mock 掉）               →  实际测试的（真实代码）
─────────────────────────────────────────────────────────
next/navigation（useRouter）     →  Login 组件的跳转逻辑
@/api（authApi.login）            →  Login 组件的提交处理
@/store/useAuthStore              →  Login 组件读取 store
framer-motion（动画）             →  组件结构与交互
ahooks（useRequest）              →  Login 组件请求状态管理
```

**Vitest Mock 的三种写法**：

```typescript
// 方式 1：vi.mock() — 替换整个模块
vi.mock('@/api', () => ({
  authApi: { login: vi.fn() },
}));

// 方式 2：vi.fn() — 创建可追踪调用的假函数
const mockFn = vi.fn();
mockFn.mockResolvedValue({ tokens: { accessToken: 'jwt-123' } });

// 方式 3：vi.spyOn() — 监视真实函数（不完全替换）
vi.spyOn(Date, 'now').mockReturnValue(100000);
```

---

### 3.5 测试 Store（`useAuthStore` 为例）

Store 测试最简单，直接调用 store 方法、检查状态变化：

```typescript
// 每个测试前：重置 store + 清空 localStorage
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ isAuthenticated: false, userRole: 'viewer', token: null });
});

describe('login 方法', () => {
  it('存储 token 并更新 isAuthenticated', () => {
    // 用 act 包裹，等待 React 状态更新完毕再断言
    act(() => {
      useAuthStore.getState().login('my-jwt-token', 'admin');
    });

    const { isAuthenticated, token, userRole } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(token).toBe('my-jwt-token');
    expect(userRole).toBe('admin');

    // 验证副作用：localStorage 也被写入了
    expect(localStorage.getItem('auth_token')).toBe('my-jwt-token');
  });
});
```

**为什么要 `act()`**：  
Zustand 的 `set()` 是同步的，但 React 的重渲染是异步批处理的。  
`act()` 等待所有挂起的更新处理完毕，确保断言时读到的是最新状态。

---

### 3.6 测试组件（`Login` 页为例）

组件测试四步走：**声明 Mock → 渲染 → 模拟操作 → 断言**

#### 第一步：声明 Mock（必须在 import 组件之前）

```typescript
// vi.hoisted() 的作用：
// vi.mock() 调用会被 Vitest 提升（hoisting）到文件最顶部执行，
// 如果 mock 工厂里引用了普通变量，此时变量还未初始化（undefined）。
// vi.hoisted() 保证该变量和 vi.mock() 同步提升，解决这个问题。
const mockRouterPush = vi.hoisted(() => vi.fn());
const mockAuthLogin  = vi.hoisted(() => vi.fn());

vi.mock('framer-motion', () => framerMotionMock); // 动画替换为轻量 stub
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));
vi.mock('@/api', () => ({
  authApi: { login: mockAuthLogin },
}));

// 重要：被测组件必须在所有 vi.mock() 之后 import
import { Login } from '@/views/Login';
```

#### 第二步：渲染 + DOM 断言

```typescript
it('渲染用户名和密码输入框', () => {
  render(<Login />);
  // Login.tsx 中 Input 组件有 placeholder="Username"
  expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
});
```

#### 第三步：模拟用户输入

```typescript
// Login.tsx 使用 react-hook-form + zod 校验
// 必须用 userEvent.type() 逐字符输入，才能触发 onChange + 校验
// fireEvent.change() 不会触发 react-hook-form 的受控组件更新
const user = userEvent.setup();
await user.type(screen.getByPlaceholderText('Username'), 'admin');
await user.type(screen.getByPlaceholderText('Password'), 'password123');
```

#### 第四步：等待异步操作并断言

```typescript
it('登录成功后存储 token 并跳转首页', async () => {
  mockAuthLogin.mockResolvedValue({ tokens: { accessToken: 'jwt-abc' } });

  const user = userEvent.setup();
  render(<Login />);
  await user.type(screen.getByPlaceholderText('Username'), 'admin');
  await user.type(screen.getByPlaceholderText('Password'), 'secret99');
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  // waitFor：轮询等待异步操作完成再断言
  // Login.tsx 中：runAsync(data) → authApi.login() Promise → onSuccess 回调
  await waitFor(() => {
    expect(mockAuthLogin).toHaveBeenCalledWith({ username: 'admin', password: 'secret99' });
    expect(mockLogin).toHaveBeenCalledWith('jwt-abc');
    expect(mockRouterPush).toHaveBeenCalledWith('/');
  });
});
```

---

### 3.7 测试 HTTP 客户端（MSW 拦截网络层）

`http.test.ts` 使用 [MSW（Mock Service Worker）](https://mswjs.io/) 在网络层拦截，而不是直接 Mock axios。

**为什么 MSW 比 Mock axios 好**：

```
直接 Mock axios：替换整个 axios → 拦截器/错误处理逻辑全部跑不到 → 覆盖太少

MSW 拦截：axios 真实运行 → 发出请求 → MSW 在网络层截住 → 返回假数据
         → HttpClient 的 token 注入、业务码判断、401 跳转全部被测到
```

```typescript
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers()); // 每个测试后清空拦截规则

// 测试：token 自动注入 Authorization 头
it('有 token 时请求头带 Authorization', async () => {
  localStorage.setItem('auth_token', 'my-jwt');
  let capturedAuth = '';
  server.use(
    mswHttp.get('http://localhost/api/profile', ({ request }) => {
      capturedAuth = request.headers.get('Authorization') ?? '';
      return HttpResponse.json({ code: 10000, data: { id: 1 }, message: 'ok' });
    }),
  );
  await http.get('/profile');
  expect(capturedAuth).toBe('Bearer my-jwt');
});

// 测试：401 自动清除 token + 跳转登录页
it('业务 code=401 时清除 token 并跳转 /login', async () => {
  localStorage.setItem('auth_token', 'old-token');
  server.use(
    mswHttp.get('http://localhost/api/secret', () =>
      HttpResponse.json({ code: 401, message: '未授权', data: null })
    )
  );
  await expect(http.get('/secret')).rejects.toBeDefined();
  expect(localStorage.getItem('auth_token')).toBeNull();
  expect(window.location.href).toBe('/login');
});
```

---

### 3.8 通用 Mock 工厂（`view-helpers.tsx`）

避免每个 view 测试文件重复写几十行 Mock，统一封装在 `view-helpers.tsx`。

#### `makeUseRequest`：模拟 ahooks `useRequest`

```typescript
// Login.tsx 里 useRequest 的使用：
const { loading, runAsync } = useRequest(signIn, { manual: true, onSuccess: ... });

// 测试中：控制 Dashboard 3 个 useRequest 按顺序返回不同数据
mockUseRequest
  .mockReturnValueOnce(makeUseRequest(FINANCE_MOCK))   // 第 1 次调用
  .mockReturnValueOnce(makeUseRequest(ORDER_MOCK))     // 第 2 次调用
  .mockReturnValueOnce(makeUseRequest(USER_MOCK));     // 第 3 次调用

// 模拟 loading 状态（组件渲染 Skeleton）
mockUseRequest.mockReturnValue(makeUseRequest(undefined, true));
```

#### `makeUseAntdTable`：模拟带分页的表格钩子

```typescript
// 有数据的状态
mockUseAntdTable.mockReturnValue(makeUseAntdTable(BANNERS_MOCK, 2));

// loading 状态（第三个参数）
mockUseAntdTable.mockReturnValue(makeUseAntdTable([], 0, true));
```

#### 轻量组件 Stub

```typescript
vi.mock('framer-motion', () => framerMotionMock);  // 动画 → 普通 HTML
vi.mock('@repo/ui', () => repoUiMock);             // UI 库 → 最简化 HTML
vi.mock('@/components/scaffold/SmartTable', () => ({ SmartTable: SmartTableMock }));
```

---

## 四、E2E 测试（Playwright）

### 4.1 如何运行

```bash
# 全量无界面（CI 模式）
yarn workspace @lucky/admin-next test:e2e

# 带调试 UI（强烈推荐！可以看到每一步操作）
yarn workspace @lucky/admin-next test:e2e:ui

# 有头浏览器（看到真实浏览器窗口）
yarn workspace @lucky/admin-next test:e2e:headed

# 查看 HTML 报告（含失败截图和视频）
yarn workspace @lucky/admin-next test:e2e:report

# 只跑某个文件
npx playwright test users.spec.ts

# 只跑包含关键词的 test
npx playwright test --grep "登录后跳转"
```

> **前置条件**：本地服务必须已启动（`make up`），`https://admin-dev.joyminis.com` 可以访问。

---

### 4.2 配置文件怎么读（`playwright.config.ts`）

```typescript
export default defineConfig({
  fullyParallel: false,           // 不并行：Admin 有共享数据库，并行测试会互相干扰
  retries: process.env.CI ? 2 : 0, // CI 里失败自动重试 2 次（网络抖动容错）
  workers: 1,                     // 单线程，保证测试顺序可控
  timeout: 120_000,               // 每个 test 最多 2 分钟（Turbopack 编译慢）

  use: {
    baseURL: 'https://admin-dev.joyminis.com',
    ignoreHTTPSErrors: true,      // 本地自签名证书，忽略 HTTPS 错误
    trace: 'on-first-retry',      // 第一次重试时录制 trace（排查失败用）
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // Step 1：全局 Setup（只跑一次，登录并预热所有路由）
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      timeout: 1_800_000,  // 30 分钟（首次 Turbopack 冷编译 14 个路由）
    },
    // Step 2：所有业务测试（复用 setup 的登录状态）
    {
      name: 'chromium',
      use: {
        storageState: 'playwright/.auth/admin.json', // 加载已保存的登录状态
      },
      dependencies: ['setup'], // 必须等 setup 跑完才开始
    },
  ],
});
```

**`storageState` 原理**：把浏览器的 localStorage + Cookie 序列化到 JSON 文件。  
后续测试加载这个文件 = 浏览器已登录状态，跳过登录流程，直接测业务页面。

---

### 4.3 「只登录一次」的秘密（`auth.setup.ts`）

```typescript
setup('authenticate and warmup all routes', async ({ page }) => {
  // Step 1：通过 UI 登录一次
  await loginViaUI(page);
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 120_000 });

  // 把登录状态（Cookie + localStorage）保存到文件
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });

  // Step 2：预热所有路由
  // 问题：Turbopack 懒编译，第一次访问某路由才开始编译，耗时 1~2 分钟
  // 解决：setup 阶段提前访问所有路由触发编译，后续 spec 秒级打开
  const WARMUP_ROUTES = [
    '/', '/orders/', '/users/', '/products/',
    '/categories/', '/banners/', '/finance/', '/marketing/',
    '/kyc/', '/groups/', '/admin-users/', '/address/',
    '/act/section/', '/payment/channels/',
  ];
  for (const route of WARMUP_ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 300_000 });
    await page.locator('aside').waitFor({ state: 'visible', timeout: 300_000 });
  }
});
```

**执行流程**：

```
playwright test
      │
[setup project] auth.setup.ts
  → 登录（一次）→ 保存 admin.json → 预热 14 个路由
      │
[chromium project] *.spec.ts（串行）
  → 每个 spec 加载 admin.json → 浏览器已登录 → 直接测试业务
```

---

### 4.4 共享辅助工具

#### `fixtures.ts` — 页面级等待与断言

```typescript
// 等待侧边栏 <aside> 可见 = Auth Guard 完成 + DashboardLayout 渲染完毕
export async function waitForDashboard(page: Page, timeout = 60_000) {
  await page.locator('aside').waitFor({ state: 'visible', timeout });
}

// 快速验证页面没有崩溃（不出现 Next.js 错误页文字）
export async function expectNoError(page: Page) {
  await expect(page.locator('body')).not.toContainText('Application error');
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
}

// 清除 Next.js 开发模式 overlay（它会遮挡按钮，导致点击失败）
export async function dismissDevOverlay(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal, [data-nextjs-dev-overlay]')
      .forEach((el) => el.remove());
  }).catch(() => {});
}
```

#### `helpers.ts` — 登录工具

```typescript
// 通过 UI 表单完整执行登录（auth.setup.ts 使用）
export async function loginViaUI(page: Page): Promise<void> {
  await page.goto('/login/');
  await page.evaluate(() => document.querySelector('nextjs-portal')?.remove()).catch(() => {});
  await page.getByLabel('Username').fill(TEST_ADMIN.username);
  await page.getByLabel('Password').fill(TEST_ADMIN.password);
  await page.getByRole('button', { name: /sign in/i }).click({ force: true });
  // waitUntil: 'commit' = 只等 URL 提交变化，比 'load' 快很多
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 600_000,
    waitUntil: 'commit',
  });
}

// 跳过 UI 直接注入 token（调试单个 spec 时用，速度更快）
export async function injectToken(context: BrowserContext, token: string) {
  await context.addInitScript((t) => {
    localStorage.setItem('auth_token', t);
  }, token);
}
```

---

### 4.5 写一个业务 spec（`users.spec.ts` 解析）

```typescript
import { test, expect } from '@playwright/test';
import { expectNoError, waitForDashboard } from './fixtures';

test.describe('User Management — /users', () => {
  // 每个 test 前：导航到页面 → 等待 Layout → 验证无崩溃
  test.beforeEach(async ({ page }) => {
    await page.goto('/users/');
    await waitForDashboard(page);
    await expectNoError(page);
  });

  test('显示页面标题', async ({ page }) => {
    await expect(page.getByText(/client database/i)).toBeVisible({ timeout: 20_000 });
  });

  test('渲染用户表格', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/user info/i).first()).toBeVisible();
  });

  test('搜索框可以输入内容', async ({ page }) => {
    const input = page.getByPlaceholder(/enter id/i).first();
    await input.fill('12345');
    await expect(input).toHaveValue('12345');
  });

  test('点击 Search 按钮不崩溃', async ({ page }) => {
    await page.getByRole('button', { name: /search/i }).first().click();
    await expectNoError(page);
  });
});
```

---

### 4.6 Auth 流程测试的特殊处理（`auth.spec.ts`）

所有 spec 默认加载了已登录的 `storageState`，但 auth 测试需要**未登录状态**。  
解决方法：每个 test 开头手动清除登录凭据：

```typescript
test('未登录访问 / 时自动跳转到 /login/', async ({ page }) => {
  // 清除 storageState 里的 Cookie 和 localStorage
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear()).catch(() => {});

  await page.goto('/');
  await page.waitForURL(/\/login/, { timeout: 10_000 });
  expect(page.url()).toContain('/login');
});
```

---

## 五、Mock 速查手册

### vi 函数

```typescript
// 创建 mock 函数
const fn = vi.fn();

// 控制返回值
fn.mockReturnValue(42);               // 每次调用都返回 42
fn.mockReturnValueOnce('first');      // 仅下一次调用返回 'first'
fn.mockResolvedValue({ ok: true });   // 返回 Promise.resolve(...)
fn.mockRejectedValue(new Error());    // 返回 Promise.reject(...)
fn.mockImplementation((x) => x * 2); // 自定义实现

// 调用断言
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
expect(fn).toHaveBeenCalledTimes(3);
expect(fn).toHaveBeenLastCalledWith('last-arg');
expect(fn).not.toHaveBeenCalled();

// 重置（通常在 beforeEach 里）
vi.clearAllMocks();    // 清调用记录，保留 mock 实现
vi.resetAllMocks();    // 清调用记录 + 清 mockReturnValue
vi.restoreAllMocks();  // 恢复所有 spyOn 的真实实现
```

### Mock Zustand Store 两种模式

```typescript
// Hook 模式（组件里 useXxxStore(selector) 的用法）
vi.mock('@/store/useToastStore', () => ({
  useToastStore: (sel: (s: unknown) => unknown) => sel({ addToast: mockAddToast }),
}));

// 静态模式（非组件里 useXxxStore.getState() 的用法，如 HttpClient）
vi.mock('@/store/useToastStore', () => ({
  useToastStore: { getState: () => ({ addToast: mockAddToast }) },
}));
```

### Testing Library 常用 API

```typescript
// 查找元素（找不到抛错）
screen.getByRole('button', { name: /submit/i })
screen.getByText('Hello')
screen.getByPlaceholderText('Enter name')
screen.getByLabelText('Username')
screen.getByTestId('smart-table')

// 查找元素（找不到返回 null，不抛错）
screen.queryByText('Maybe not there')

// 异步查找（轮询等待元素出现）
await screen.findByText('Loaded!')

// 触发事件
fireEvent.click(button)
await userEvent.type(input, 'hello world') // 逐字符输入，触发完整事件链

// 等待断言通过（处理异步状态更新）
await waitFor(() => expect(something).toBe(true))
```

---

## 六、如何新增一个测试文件

### 新增单元测试（复制此模板）

```typescript
// src/__tests__/views/MyPage.test.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { repoUiMock, makeUseRequest, PageHeaderMock } from '../mocks/view-helpers';

// Step 1：声明 hoisted 变量
const mockUseRequest = vi.hoisted(() => vi.fn());

// Step 2：Mock 所有外部依赖
vi.mock('@repo/ui', () => repoUiMock);
vi.mock('@/components/scaffold/PageHeader', () => ({ PageHeader: PageHeaderMock }));
vi.mock('ahooks', () => ({
  useRequest: (...args: unknown[]) => mockUseRequest(...args),
}));
vi.mock('@/api', () => ({
  myApi: { getData: vi.fn().mockResolvedValue({ list: [], total: 0 }) },
}));

// Step 3：import 被测组件（必须在所有 vi.mock 之后）
import { MyPage } from '@/views/MyPage';

describe('MyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRequest.mockReturnValue(makeUseRequest({ list: [], total: 0 }));
  });

  it('renders without crashing', () => {
    expect(render(<MyPage />).container.firstChild).not.toBeNull();
  });

  it('shows page title', () => {
    render(<MyPage />);
    expect(screen.getByText(/my page title/i)).toBeInTheDocument();
  });
});
```

### 新增 E2E 测试（复制此模板）

```typescript
// src/__e2e__/my-page.spec.ts
import { test, expect } from '@playwright/test';
import { expectNoError, waitForDashboard } from './fixtures';

test.describe('My Page — /my-page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-page/');
    await waitForDashboard(page);
    await expectNoError(page);
  });

  test('页面加载不崩溃', async ({ page }) => {
    await expect(page.getByText(/my page title/i)).toBeVisible({ timeout: 20_000 });
  });

  test('显示数据表格', async ({ page }) => {
    await expect(page.locator('table').first()).toBeVisible({ timeout: 20_000 });
  });
});
```

> **记得**：新增 E2E spec 后，把新路由加到 `auth.setup.ts` 的 `WARMUP_ROUTES` 数组里！

---

## 七、常见报错 FAQ

**Q：`useRouter is not a function`**  
A：`vitest.config.ts` 的 alias 没有指向 `next-navigation.ts`，检查路径配置。

**Q：`Cannot read properties of undefined (reading 'xxx')`**  
A：Mock 返回值是 `undefined`，组件访问深层属性崩溃。改用工厂函数提供完整结构：  
`mockUseRequest.mockReturnValue(makeUseRequest({ list: [], total: 0 }))`

**Q：`Warning: An update to X was not wrapped in act(...)`**  
A：异步状态更新没被 act 包裹。用 `await waitFor(() => ...)` 或 `await act(async () => { ... })`。

**Q：E2E 超时 `Timeout 120000ms exceeded`**  
A：先单独跑 setup 触发 Turbopack 编译：`npx playwright test auth.setup.ts`，完成后再跑其他 spec。

**Q：E2E `getByLabel('Username')` 找不到元素**  
A：① 检查 `<label>` 的 `htmlFor` 是否匹配 `<input>` 的 `id`；② 加 `dismissDevOverlay(page)` 清除遮挡层。

**Q：本地测试通过，CI 里失败**  
A：① 检查 GitHub Secrets 是否有 `E2E_ADMIN_USERNAME` / `E2E_ADMIN_PASSWORD`；② 下载 CI Artifacts 查看失败截图。

