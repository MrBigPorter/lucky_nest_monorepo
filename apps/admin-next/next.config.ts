import type { NextConfig } from 'next';
import path from 'path';
import { withSentryConfig } from '@sentry/nextjs';

const isCloudflareBuild = process.env.NEXT_BUILD_TARGET === 'cloudflare';

const nextConfig: NextConfig = {
  // standalone 模式 — 生产用 Node.js 服务器运行 (支持 SSR / Middleware / Server Components)
  // 产物: .next/standalone/ — 包含完整 server.js，通过 Docker 部署到 VPS
  // 旧: output: 'export' (静态导出 → Cloudflare Pages) — 已迁移到 VPS 自托管
  output: isCloudflareBuild ? undefined : 'standalone',
  // Skip type errors caused by @types/react version mismatch across monorepo packages
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
  // 启用 Next.js 图片优化：remotePatterns 白名单 + 允许任意 https 域（admin 内部工具，信任场景）
  // img.joyminis.com: 主 CDN；https://** 覆盖 OAuth 头像（Google/Facebook）等未知来源
  // 注意：SmartImage 用 @unpic/react 自行处理 CDN，不受此配置影响；
  //       此配置仅作用于代码中直接使用 next/image 的少数场景（如 GroupManagementClient 用户头像）
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.joyminis.com' },
      { protocol: 'https', hostname: '**' }, // admin panel — 信任所有 https 图片来源
    ],
  },
  // @lucky/shared: lightweight utils (dayjs/decimal/numbro), no heavy deps.
  // Keep in transpilePackages so Turbopack handles it natively (avoids CJS interop).
  // dist/ is pre-built before dev server starts (compose.yml + CI) for reliability.
  // @repo/ui: pre-built to dist/ — removed from transpilePackages (had framer-motion,
  //   react-quill-new pulling 1186s cold compile; now 10s with optimizePackageImports).
  transpilePackages: ['@lucky/shared'],

  // 允许通过 nginx 反向代理的开发域名访问 /_next/* 资源
  allowedDevOrigins: ['admin-dev.joyminis.com'],

  // ── Turbopack 开发模式：仅处理 node:crypto shim ──
  turbopack: {
    resolveAlias: {
      'node:crypto': './src/lib/crypto-shim.ts',
    },
  },

  experimental: {
    // Tree-shake heavy barrel-export packages so Turbopack only compiles used exports
    // @repo/ui is pre-built ESM with individual files — optimizePackageImports
    // ensures only the imported components (e.g. `cn`) are compiled, not the full barrel
    optimizePackageImports: [
      '@repo/ui',
      'lucide-react',
      'recharts',
      'lodash',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@tanstack/react-table',
      'date-fns',
      'framer-motion',
    ],
  },

  async redirects() {
    return [
      {
        source: '/login-log/:path*',
        destination: '/login-logs/:path*',
        permanent: true,
      },
    ];
  },

  webpack: (config, { isServer, webpack }) => {
    // Polyfill Node.js built-ins for browser bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
      };
      // Replace node:crypto with empty module on client
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:crypto$/,
          (resource: { request: string }) => {
            resource.request = path.resolve(
              __dirname,
              './src/lib/crypto-shim.ts',
            );
          },
        ),
      );
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'joymini',

  project: 'javascript-nextjs',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
