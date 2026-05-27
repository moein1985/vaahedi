import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      DATABASE_URL: 'postgresql://postgres:password@localhost:5434/vaahedi_test',
    },
    setupFiles: ['./src/test/setup.ts'],
    hookTimeout: 30000,
    testTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: [
        'src/interface/trpc/routers/**/*.ts',
        'src/domain/**/*.ts',
        'src/application/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/__tests__/**',
        '**/test/**',
        'src/main.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
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