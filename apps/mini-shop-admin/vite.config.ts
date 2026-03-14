import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import path from 'path';

export default defineConfig({
  server: {
    port: 4000,
    host: '0.0.0.0',
    watch: {
      ignored: ['!**/node_modules/@lucky/shared/**'],
    },
    allowedHosts: [
      'mini-shop-admin',
      'admin.joyminis.com',
      'dev.joyminis.com',
      'admin-dev.joyminis.com',
    ],
  },
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@lucky/shared': path.resolve(
        __dirname,
        '../../packages/shared/src/index.ts',
      ),
    },
  },
  build: {
    // 生产移除 console/debugger
    minify: 'esbuild',
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 数据层
          'vendor-data': [
            '@tanstack/react-query',
            '@tanstack/react-table',
            'axios',
            'zustand',
            'zod',
          ],
          // UI 图标 + 动画
          'vendor-ui': [
            'lucide-react',
            'framer-motion',
            '@dnd-kit/core',
            '@dnd-kit/sortable',
          ],
          // 图表 (单独拆分, 体积大)
          'vendor-charts': ['recharts'],
          // 表单
          'vendor-form': ['react-hook-form', '@hookform/resolvers'],
        },
      },
    },
    // 单个 chunk 超过 300KB 才警告
    chunkSizeWarningLimit: 300,
  },
  esbuild: {
    // 生产构建移除 console.log 和 debugger
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
