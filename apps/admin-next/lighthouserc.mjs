/**
 * Lighthouse CI 配置文件
 * Lighthouse CI Configuration
 *
 * 文件作用：告诉 LHCI 三件事：
 *   1. collect  — 测哪些页面，怎么测
 *   2. upload   — 结果存在哪（免费临时存储）
 *   3. assert   — 什么指标超阈值时报警/报错
 *
 * 运行方式（CI 自动）：
 *   lhci autorun   ← 等价于 collect + upload + assert 顺序执行
 *
 * 运行方式（本地手动）：
 *   LHCI_COOKIE="auth_token=xxx" yarn lhci
 *
 * 认证方式：
 *   通过环境变量 LHCI_COOKIE 传入登录 Cookie。
 *   CI 里由工作流预先调 API 登录拿 Token 并设置此环境变量。
 */

export default {
  ci: {
    // ── 1. collect：页面采集配置 ──────────────────────────────
    collect: {
      /**
       * 目标页面列表。
       * Target pages to audit.
       */
      url: [
        'https://admin.joyminis.com/login',
        'https://admin.joyminis.com/',
        'https://admin.joyminis.com/analytics',
        'https://admin.joyminis.com/finance',
        'https://admin.joyminis.com/orders',
      ],

      /**
       * 每个页面运行次数。CI 用 1 次节省时间，本地可改 3 次。
       * Number of Lighthouse runs per page. Use 1 in CI for speed.
       */
      numberOfRuns: 1,

      settings: {
        /** 桌面端预设 / Desktop preset — admin is desktop-first */
        preset: 'desktop',

        /**
         * 内网测试不模拟慢网，反映真实服务器速度。
         * No throttling for production testing.
         */
        throttling: {
          rttMs: 0,
          throughputKbps: 0,
          cpuSlowdownMultiplier: 1,
        },

        /**
         * 屏幕参数必须与 formFactor 一致，否则 Chrome DevTools Protocol 报错。
         * Screen emulation must match formFactor to avoid CBOR deserialization error.
         */
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },

        formFactor: 'desktop',

        /**
         * 注入登录 Cookie — 平凑对象（非 JSON 字符串），LHCI 内部用 Node.js API 接受对象格式。
         * Auth cookie injection — plain object (not JSON string), as LHCI uses Lighthouse Node.js API.
         *
         * 若环境变量为空，受保护页面会 redirect 到 /login，仍能收到 /login 的数据。
         * If empty, protected pages redirect to /login — /login data is still collected.
         */
        extraHeaders: {
          Cookie: process.env.LHCI_COOKIE || '',
        },
      },
    },

    // ── 2. upload：结果上传 ──────────────────────────────────
    upload: {
      /**
       * Google 免费临时存储，7 天后删除，结果 URL 会贴到 PR 评论。
       * Google's free temporary storage. Results URL posted to PR comments. Auto-deletes after 7 days.
       */
      target: 'temporary-public-storage',
    },

    // ── 3. assert：阈值断言 ──────────────────────────────────
    assert: {
      /**
       * "warn"  → 超阈值时输出警告，不阻塞 PR / warning in CI output, does not block PR
       * "error" → 超阈值时非 0 退出码，可阻塞 PR / non-zero exit code, can block PR merge
       *
       * 当前实测基准（外网 VPS San Jose）：
       *   Dashboard 963ms, Analytics 1645ms, Finance 1506ms, Orders 1543ms
       */
      assertions: {
        /** LCP > 2500ms 警告（Google "needs improvement" 边界） */
        'largest-contentful-paint': [
          'warn',
          { maxNumericValue: 2500, aggregationMethod: 'optimistic' },
        ],

        /** TBT > 200ms 警告（当前全部达标，检测重 JS 退化） */
        'total-blocking-time': [
          'warn',
          { maxNumericValue: 200, aggregationMethod: 'optimistic' },
        ],

        /** CLS > 0.1 报错（当前全部 0，Suspense 骨架屏保障） */
        'cumulative-layout-shift': [
          'error',
          { maxNumericValue: 0.1, aggregationMethod: 'optimistic' },
        ],

        /** Performance 分数低于 70 报错（当前最低 85） */
        'categories:performance': ['error', { minScore: 0.7 }],
      },
    },
  },
};
