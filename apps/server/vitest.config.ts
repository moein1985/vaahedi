import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    hookTimeout: 30000, // Increase hook timeout to 30 seconds
    testTimeout: 30000, // Increase test timeout to 30 seconds
    pool: 'threads', // Use threads instead of forks for better isolation
    poolOptions: {
      threads: {
        singleThread: true, // Run tests sequentially to avoid database conflicts
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@repo/shared': resolve(__dirname, '../../packages/shared/src'),
      '@repo/db': resolve(__dirname, '../../packages/db/src'),
    },
  },
});