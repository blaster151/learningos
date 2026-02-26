/**
 * E2E Auth Helper — login via the UI using Firebase Auth Emulator
 *
 * Creates a test user in the emulator (if needed) and logs in via
 * the email/password form on /login. Returns once the dashboard loads.
 *
 * Requires:
 *   - Firebase Auth Emulator running on http://localhost:9099
 *   - NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true in the dev server env
 */

import { type Page } from '@playwright/test';

const TEST_EMAIL = 'e2e-test@learningos.test';
const TEST_PASSWORD = 'TestPassword123!';
const AUTH_EMULATOR_URL = 'http://localhost:9099';

/**
 * Ensure the test user exists in the Firebase Auth emulator.
 * Uses the emulator REST API directly (no SDK needed).
 */
async function ensureTestUser() {
  // Try to create the user — if it already exists the emulator returns 400
  // which we silently ignore.
  try {
    const res = await fetch(
      `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          returnSecureToken: true,
        }),
      }
    );
    const data = await res.json();
    if (!res.ok && data?.error?.message !== 'EMAIL_EXISTS') {
      console.warn('[e2e auth] Emulator signUp failed:', data?.error?.message);
    }
  } catch (err) {
    console.warn('[e2e auth] Could not reach Auth emulator — is it running?', err);
  }
}

/**
 * Log in through the UI and wait for the dashboard to load.
 * Call this in beforeEach (or beforeAll + storageState) for any
 * test that needs an authenticated user.
 */
export async function loginAsTestUser(page: Page) {
  await ensureTestUser();

  await page.goto('/login', { timeout: 60000 });

  // Fill in credentials
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard (or onboarding for first login)
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });

  // If redirected to onboarding, complete it minimally
  const url = page.url();
  if (url.includes('/onboarding')) {
    // Try to skip or complete onboarding quickly
    const skipBtn = page.getByRole('button', { name: /skip/i });
    const continueBtn = page.getByRole('button', { name: /continue|get started|finish/i });

    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBtn.click();
    } else if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueBtn.click();
    }

    await page.waitForURL(/\/dashboard/, { timeout: 15000 }).catch(() => {
      // May already be on dashboard
    });
  }
}

export { TEST_EMAIL, TEST_PASSWORD };
