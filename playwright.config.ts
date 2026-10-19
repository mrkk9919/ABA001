import { defineConfig } from '@playwright/test';

/**
 * ABA mobile – Bakong/KHQR E2E suite (T1–T10 journeys)
 *
 * Server: builds the app once, then serves the production bundle with
 * `vite preview` on port 5100 (the vite config requires PORT+BASE_PATH).
 * An already-running server on 5100 is reused when not in CI.
 *
 * Browsers: Playwright's bundled chromium (install via
 * `PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright pnpm exec playwright install chromium`).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-results/report' }]],
  use: {
    baseURL: 'http://localhost:5100',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'PORT=5100 BASE_PATH=/ pnpm run build && PORT=5100 BASE_PATH=/ pnpm run serve',
    url: 'http://localhost:5100/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
