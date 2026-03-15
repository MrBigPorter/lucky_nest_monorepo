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
  // Transpile monorepo packages so webpack can handle TypeScript
  transpilePackages: ['@lucky/shared', '@repo/ui'],
  webpack: (config, { isServer }) => {
    // 解析 @lucky/shared monorepo 包
    config.resolve.alias['@lucky/shared'] = path.resolve(
      __dirname,
      '../../packages/shared/src/index.ts',
    );
    config.resolve.alias['@repo/ui'] = path.resolve(
      __dirname,
      '../../packages/ui/src',
    );

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
