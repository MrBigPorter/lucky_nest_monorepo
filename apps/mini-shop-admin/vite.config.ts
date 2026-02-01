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
    allowedHosts: ['mini-shop-admin', 'admin.joyminis.com', 'dev.joyminis.com'],
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
