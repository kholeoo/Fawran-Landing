import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // MapLibre ships a stylesheet that components import directly. Without this,
  // Vite hands it to the project's Tailwind v4 PostCSS config, which is built
  // for Next and fails to load here. Tests assert behaviour, not styling.
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
  },
});
