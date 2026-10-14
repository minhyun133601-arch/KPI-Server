import { defineConfig } from '@playwright/test';

// Isolated browser fixtures: no application server, accounts or database writes.
export default defineConfig({
  testDir: '.',
  testMatch: 'equipment-history-preventive-maintenance.playwright.js',
  timeout: 30000,
  expect: { timeout: 5000 },
  workers: 1,
  reporter: [['list']],
  outputDir: '../var/playwright-equipment-history',
  use: {
    browserName: 'chromium',
    viewport: { width: 1440, height: 960 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
