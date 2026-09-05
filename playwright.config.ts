import { defineConfig, devices } from '@playwright/test';

const runId = process.env.LITTLE_SPOON_TEST_RUN ??= new Date().toISOString().replace(/[:.]/g, '-');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 3,
  timeout: 30_000,
  outputDir: `artifacts/e2e/${runId}/results`,
  reporter: [['list'], ['json', { outputFile: `artifacts/e2e/${runId}/report.json` }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-CA',
    timezoneId: 'America/Regina',
    colorScheme: 'light',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
