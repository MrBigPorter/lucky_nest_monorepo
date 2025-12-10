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
    proxy: {
      // 只要遇到以 /cdn-cgi 开头的请求
      '/cdn-cgi': {
        // 偷偷转发到你的真实线上域名
        target: 'https://img.joyminis.com',
        // 必须加这个，欺骗 Cloudflare 说是从它自己域名发来的
        changeOrigin: true,
      },
    },
  },
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // 告诉 Vite：只要看到 @lucky/shared，就直接去读 packages/shared/src/index.ts
      '@lucky/shared': path.resolve(
        __dirname,
        '../../packages/shared/src/index.ts',
      ),
    },
  },
});
