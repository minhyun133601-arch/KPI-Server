import { defineConfig } from '@playwright/test';

// Isolated browser fixtures do not start the server or access the database.
export default defineConfig({
  testDir: '.',
  testMatch: 'utility-*-regression.playwright.js',
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  reporter: [['list']],
  outputDir: '../var/playwright-utility-regression',
  use: {
    browserName: 'chromium',
    viewport: { width: 1440, height: 960 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
