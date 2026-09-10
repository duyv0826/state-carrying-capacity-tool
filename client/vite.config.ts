import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// 后端已在 server/ 落盘，默认监听 3000（SPEC §12 验证步骤 4）。
declare const process: { env: Record<string, string | undefined> };
const API_PROXY = process.env.VITE_API_PROXY ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: API_PROXY, changeOrigin: true },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
