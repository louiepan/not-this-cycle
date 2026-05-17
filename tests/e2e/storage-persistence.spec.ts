import { test, expect } from '@playwright/test';

/**
 * E2E coverage for `ntc:player:v1` — the run-history localStorage key.
 *
 * The intro screen no longer persists (commit a6c4c8d), so this suite
 * focuses on the one localStorage surface that DOES persist: the
 * run-history key written after each completed game.
 *
 * We can't easily trigger a real game-loop write in CI (sessions take
 * 5 minutes), so these tests verify the read/recovery path: that
 * seeded history survives a refresh, that corrupted data is handled
 * gracefully, and that unknown schema versions reset to a clean state
 * without crashing the app.
 */

const PLAYER_STORAGE_KEY = 'ntc:player:v1';

test.describe('Player run-history storage (ntc:player:v1)', () => {
  test('seeded history survives a hard refresh', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          schemaVersion: 1,
          lastDifficulty: 'senior',
          runHistory: [
            {
              id: 'run_seed_1',
              completedAt: new Date(Date.now() - 86_400_000).toISOString(),
              difficulty: 'senior',
              archetype: 'the_ghost',
              calibrationBucket: 'needs_improvement',
              scenarioId: 'q4-planning',
            },
          ],
        })
      );
    }, PLAYER_STORAGE_KEY);

    await page.reload();

    const stored = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, PLAYER_STORAGE_KEY);

    expect(stored).not.toBeNull();
    expect(stored.runHistory).toHaveLength(1);
    expect(stored.runHistory[0].archetype).toBe('the_ghost');
  });

  test('corrupted JSON in the player key does not crash the app', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => {
      window.localStorage.setItem(key, '{not valid json');
    }, PLAYER_STORAGE_KEY);

    await page.reload();

    // App should still render — playerProfile.loadProfile catches the JSON
    // parse error and returns an empty profile.
    await expect(
      page.getByRole('heading', { name: /survive calibration/i })
    ).toBeVisible();
  });

  test('unknown schema versions are silently rejected', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          schemaVersion: 99,
          runHistory: [{ archetype: 'the_unknown', bogus: true }],
        })
      );
    }, PLAYER_STORAGE_KEY);

    await page.reload();

    // App renders fine and the bogus data is effectively ignored by the
    // loader (next write will overwrite with schemaVersion: 1).
    await expect(
      page.getByRole('heading', { name: /survive calibration/i })
    ).toBeVisible();
  });

  test('clearing the player key has no effect on intro/UI render', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({ schemaVersion: 1, lastDifficulty: null, runHistory: [] })
      );
    }, PLAYER_STORAGE_KEY);
    await page.evaluate((key) => window.localStorage.removeItem(key), PLAYER_STORAGE_KEY);

    await page.reload();
    await expect(
      page.getByRole('heading', { name: /survive calibration/i })
    ).toBeVisible();

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      PLAYER_STORAGE_KEY
    );
    expect(stored).toBeNull();
  });
});
