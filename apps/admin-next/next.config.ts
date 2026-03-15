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
  // Transpile monorepo packages so both webpack & Turbopack handle TypeScript
  transpilePackages: ['@lucky/shared', '@repo/ui'],

  // 允许通过 nginx 反向代理的开发域名访问 /_next/* 资源
  allowedDevOrigins: ['admin-dev.joyminis.com'],

  // ── Turbopack 开发模式：仅处理 node:crypto shim ──
  // @lucky/shared 和 @repo/ui 已通过 yarn workspaces symlink 解析，无需 alias
  turbopack: {
    resolveAlias: {
      'node:crypto': './src/lib/crypto-shim.ts',
    },
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
