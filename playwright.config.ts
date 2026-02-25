import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    locale: 'fa-IR',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env['CI'] ? {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
  } : undefined,
  // For local testing, make sure database is running
  // Run: docker compose -f docker-compose.dev.yml up -d
});