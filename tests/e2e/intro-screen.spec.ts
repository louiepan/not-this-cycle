import { test, expect, type Page } from '@playwright/test';

/**
 * E2E coverage for IntroScreen — the name + email capture surface.
 *
 * Note: as of commit a6c4c8d the intro screen does NOT persist anything
 * to localStorage. Refresh always brings the player back to the intro.
 * These tests verify that contract: form behavior, validation, advancement
 * to the offer screen, and the refresh-resets-state guarantee.
 *
 * Game-loop coverage (timer, decisions, escalation) is intentionally out
 * of scope — a real session takes 5 minutes and is not worth running in
 * CI. The pure rules engine, rating engine, and continuity selector are
 * covered by vitest unit tests in `src/`.
 */

const PLAYER_STORAGE_KEY = 'ntc:player:v1';

async function clearAppStorage(page: Page) {
  await page.goto('/');
  await page.evaluate((key) => {
    window.localStorage.clear();
    // Belt-and-suspenders: clear the player key by name too in case
    // a future iteration adds another origin's storage.
    window.localStorage.removeItem(key);
  }, PLAYER_STORAGE_KEY);
}

test.describe('IntroScreen — first-time visitor', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page);
  });

  test('renders the intro form with empty fields', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /survive calibration/i })
    ).toBeVisible();
    await expect(page.locator('#intro-name')).toHaveValue('');
    await expect(page.locator('#intro-email')).toHaveValue('');
    await expect(page.getByRole('button', { name: /get my offer/i })).toBeDisabled();
  });

  test('submit button stays disabled with invalid email', async ({ page }) => {
    await page.goto('/');

    await page.locator('#intro-name').fill('Louis Pan');
    await page.locator('#intro-email').fill('not-an-email');
    await expect(page.getByRole('button', { name: /get my offer/i })).toBeDisabled();
  });

  test('shows inline email validation error after blur', async ({ page }) => {
    await page.goto('/');

    await page.locator('#intro-email').fill('not-an-email');
    await page.locator('#intro-email').blur();

    // Scope to the form's error message — Next.js inserts a global route
    // announcer with role="alert" that collides with a bare getByRole call.
    await expect(page.locator('#intro-email-error')).toContainText(/valid email/i);
  });

  test('submitting a valid form advances away from the intro screen', async ({ page }) => {
    await page.goto('/');

    await page.locator('#intro-name').fill('Louis Pan');
    await page.locator('#intro-email').fill('louis@example.com');

    const submitButton = page.getByRole('button', { name: /get my offer/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Intro heading should disappear once submitted.
    await expect(
      page.getByRole('heading', { name: /survive calibration/i })
    ).toBeHidden();
    // Intro form input should no longer be in the DOM.
    await expect(page.locator('#intro-name')).toHaveCount(0);
  });

  test('marketing consent checkbox can be toggled before submit', async ({ page }) => {
    await page.goto('/');

    const checkbox = page.getByRole('checkbox');
    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Filling the rest of the form should not affect the checkbox state.
    await page.locator('#intro-name').fill('Louis Pan');
    await page.locator('#intro-email').fill('louis@example.com');
    await expect(checkbox).toBeChecked();
  });
});

test.describe('IntroScreen — refresh behavior', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppStorage(page);
  });

  test('refresh after submission brings the intro screen back', async ({ page }) => {
    // Submit the form.
    await page.goto('/');
    await page.locator('#intro-name').fill('Louis Pan');
    await page.locator('#intro-email').fill('louis@example.com');
    await page.getByRole('button', { name: /get my offer/i }).click();
    await expect(
      page.getByRole('heading', { name: /survive calibration/i })
    ).toBeHidden();

    // Hard reload — we explicitly do NOT want the intro to persist across
    // refresh per the design decision in commit a6c4c8d.
    await page.reload();

    await expect(
      page.getByRole('heading', { name: /survive calibration/i })
    ).toBeVisible();
    await expect(page.locator('#intro-name')).toHaveValue('');
    await expect(page.locator('#intro-email')).toHaveValue('');
  });

  test('intro does not write anything to localStorage on submit', async ({ page }) => {
    await page.goto('/');
    const keysBefore = await page.evaluate(() => Object.keys(window.localStorage));

    await page.locator('#intro-name').fill('Louis Pan');
    await page.locator('#intro-email').fill('louis@example.com');
    await page.getByRole('button', { name: /get my offer/i }).click();

    // Wait for the navigation away from intro to confirm submit fired.
    await expect(
      page.getByRole('heading', { name: /survive calibration/i })
    ).toBeHidden();

    const keysAfter = await page.evaluate(() => Object.keys(window.localStorage));
    // Intro itself must not write anything. The player run-history key
    // (`ntc:player:v1`) is only written after a completed game, not after
    // the intro alone — and we don't play through here.
    expect(keysAfter).toEqual(keysBefore);
  });
});
