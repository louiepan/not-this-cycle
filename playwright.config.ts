import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Not This Cycle.
 *
 * Runs against `next dev` locally for fast feedback and against `next start`
 * (after `next build`) in CI for production parity. The current suite focuses
 * on the IntroScreen / localStorage hydration boundary — the actual 5-minute
 * gameplay loop is too long to exercise in E2E and is covered by unit tests
 * for the pure modules (engine, narrative, playerProfile, continuityLines).
 */

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;
const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 1 : undefined,
  reporter: IS_CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // In CI we build once and serve the production output, which is faster than
    // dev-mode HMR and matches what users will hit.
    command: IS_CI ? 'npm run build && npm run start' : 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !IS_CI,
    timeout: 180_000,
    env: {
      // Silence Next telemetry in CI logs.
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
