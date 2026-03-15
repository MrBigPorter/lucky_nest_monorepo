import type { NextConfig } from 'next';
import path from 'path';
import webpack from 'webpack';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // 静态导出 → Cloudflare Pages 部署 (仅生产模式)
  // 开发模式下不设置，以支持 Middleware 认证
  ...(isProd ? { output: 'export' } : {}),
  // Skip type errors caused by @types/react version mismatch across monorepo packages
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
  // 静态导出模式下必须禁用 Next.js 内置图片优化
  images: {
    unoptimized: true,
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

  webpack: (config, { isServer }) => {
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
        new webpack.NormalModuleReplacementPlugin(/^node:crypto$/, (resource: { request: string }) => {
          resource.request = path.resolve(__dirname, './src/lib/crypto-shim.ts');
        }),
      );
    }
    return config;
  },
};

export default nextConfig;
