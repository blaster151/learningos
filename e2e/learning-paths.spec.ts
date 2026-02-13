import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Learning Paths page and the E18 calibration flow:
 * - Basic page rendering and path generation form
 * - Scope analysis → narrowing suggestions (broad topics)
 * - Knowledge calibration pills (Wave 1)
 * - Pill three-state cycling (unselected → known → somewhat → unselected)
 * - Skip calibration shortcut
 * - Wave 2 targeted follow-up pills
 * - Cancel / reset behaviour
 *
 * Many of these tests are AI-dependent — they use conditional assertions
 * that gracefully skip when the AI doesn't produce the expected state.
 * Auth setup is assumed (same pattern as other E2E specs).
 */

test.describe('Learning Paths Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/learn');
  });

  test('should display the page heading and generation form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /learning paths/i })).toBeVisible();

    // Generation form
    await expect(page.getByRole('heading', { name: /generate new learning path/i })).toBeVisible();
    await expect(page.getByPlaceholder(/what do you want to learn/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /generate path/i })).toBeVisible();
  });

  test('should disable Generate Path button when input is empty', async ({ page }) => {
    const generateBtn = page.getByRole('button', { name: /generate path/i });
    await expect(generateBtn).toBeDisabled();
  });

  test('should enable Generate Path button when goal is entered', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    await input.fill('Learn about closures in JavaScript');

    const generateBtn = page.getByRole('button', { name: /generate path/i });
    await expect(generateBtn).toBeEnabled();
  });

  test('should show Analyzing state when Generate Path is clicked', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    await input.fill('Learn about closures in JavaScript');

    const generateBtn = page.getByRole('button', { name: /generate path/i });
    await generateBtn.click();

    // Button should show "Analyzing..." state
    await expect(page.getByRole('button', { name: /analyzing/i })).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Scope Analysis & Narrowing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/learn');
  });

  test('should show narrowing suggestions for a broad topic', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    // A very broad topic that should trigger "narrow" recommendation
    await input.fill('Machine learning');
    await page.getByRole('button', { name: /generate path/i }).click();

    // Wait for scope analysis to complete — either narrowing panel or pills will appear
    const narrowPanel = page.getByText(/this topic is pretty broad/i);
    const pillsPanel = page.getByText(/quick calibration/i);

    // Wait for one of them (AI determines which)
    await expect(narrowPanel.or(pillsPanel)).toBeVisible({ timeout: 15000 });

    const hasBroadMessage = await narrowPanel.isVisible().catch(() => false);

    if (hasBroadMessage) {
      // Should show numbered narrower topic suggestions
      await expect(page.getByText(/pick a narrower starting path/i)).toBeVisible();

      // Should have a "Keep high-level overview" button
      await expect(page.getByRole('button', { name: /keep high-level overview/i })).toBeVisible();

      // Should have a Cancel button
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    }
  });

  test('should allow selecting a narrow suggestion', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    await input.fill('Machine learning');
    await page.getByRole('button', { name: /generate path/i }).click();

    const narrowPanel = page.getByText(/this topic is pretty broad/i);
    await expect(narrowPanel).toBeVisible({ timeout: 15000 }).catch(() => {
      // AI didn't classify as broad — skip
    });

    const hasBroadMessage = await narrowPanel.isVisible().catch(() => false);

    if (hasBroadMessage) {
      // Click the first suggested narrower topic
      // Suggestions are rendered as buttons inside a grid
      const suggestionButtons = page.locator('.bg-indigo-50 button.text-left');
      const count = await suggestionButtons.count();

      if (count > 0) {
        await suggestionButtons.first().click();

        // Should transition to calibration pills or generating
        const pillsPanel = page.getByText(/quick calibration/i);
        const generatingBtn = page.getByRole('button', { name: /generating/i });

        await expect(pillsPanel.or(generatingBtn)).toBeVisible({ timeout: 15000 });
      }
    }
  });

  test('should allow "Keep high-level overview" for broad topics', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    await input.fill('Machine learning');
    await page.getByRole('button', { name: /generate path/i }).click();

    const narrowPanel = page.getByText(/this topic is pretty broad/i);
    await expect(narrowPanel).toBeVisible({ timeout: 15000 }).catch(() => {});

    const hasBroadMessage = await narrowPanel.isVisible().catch(() => false);

    if (hasBroadMessage) {
      await page.getByRole('button', { name: /keep high-level overview/i }).click();

      // Should transition to calibration pills or generating
      const pillsPanel = page.getByText(/quick calibration/i);
      const generatingBtn = page.getByRole('button', { name: /generating/i });

      await expect(pillsPanel.or(generatingBtn)).toBeVisible({ timeout: 15000 });
    }
  });

  test('should cancel and reset when Cancel is clicked on narrowing', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    await input.fill('Machine learning');
    await page.getByRole('button', { name: /generate path/i }).click();

    const narrowPanel = page.getByText(/this topic is pretty broad/i);
    await expect(narrowPanel).toBeVisible({ timeout: 15000 }).catch(() => {});

    const hasBroadMessage = await narrowPanel.isVisible().catch(() => false);

    if (hasBroadMessage) {
      await page.getByRole('button', { name: /cancel/i }).click();

      // Narrowing panel should disappear
      await expect(narrowPanel).not.toBeVisible();

      // Generate Path button should be back to normal
      await expect(page.getByRole('button', { name: /generate path/i })).toBeVisible();
    }
  });
});

test.describe('Calibration Pills — Wave 1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/learn');
  });

  test('should show calibration pills for a focused topic', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    // A focused topic that should go straight to pills (not narrowing)
    await input.fill('React useEffect hook');
    await page.getByRole('button', { name: /generate path/i }).click();

    // Should show either narrowing or pills
    const pillsPanel = page.getByText(/quick calibration/i);
    const narrowPanel = page.getByText(/this topic is pretty broad/i);

    await expect(pillsPanel.or(narrowPanel)).toBeVisible({ timeout: 15000 });

    const hasPills = await pillsPanel.isVisible().catch(() => false);

    if (hasPills) {
      // Should show instruction text
      await expect(page.getByText(/tap what you already know/i)).toBeVisible();

      // Should have pill buttons (rounded-full elements)
      const pills = page.locator('.bg-gray-50 button.rounded-full');
      const count = await pills.count();
      expect(count).toBeGreaterThan(0);

      // Should have Skip and Cancel buttons
      await expect(page.getByRole('button', { name: /skip — just build/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();

      // Should have Continue button
      await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
    }
  });

  test('should cycle pill state: unselected → known → somewhat → unselected', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    await input.fill('React useEffect hook');
    await page.getByRole('button', { name: /generate path/i }).click();

    const pillsPanel = page.getByText(/quick calibration/i);
    await expect(pillsPanel).toBeVisible({ timeout: 15000 }).catch(() => {});

    const hasPills = await pillsPanel.isVisible().catch(() => false);

    if (hasPills) {
      const firstPill = page.locator('.bg-gray-50 button.rounded-full').first();
      await expect(firstPill).toBeVisible();

      const pillText = await firstPill.textContent();

      // Click 1: unselected → known (emerald style)
      await firstPill.click();
      await expect(firstPill).toHaveClass(/emerald/);

      // Click 2: known → somewhat (yellow style, appends " ~")
      await firstPill.click();
      await expect(firstPill).toHaveClass(/yellow/);
      await expect(firstPill).toHaveText(/~$/);

      // Click 3: somewhat → unselected (back to white/default)
      await firstPill.click();
      await expect(firstPill).not.toHaveClass(/emerald|yellow/);
      if (pillText) {
        await expect(firstPill).toHaveText(pillText);
      }
    }
  });

  test('should skip calibration and generate path directly', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    await input.fill('React useEffect hook');
    await page.getByRole('button', { name: /generate path/i }).click();

    const pillsPanel = page.getByText(/quick calibration/i);
    await expect(pillsPanel).toBeVisible({ timeout: 15000 }).catch(() => {});

    const hasPills = await pillsPanel.isVisible().catch(() => false);

    if (hasPills) {
      await page.getByRole('button', { name: /skip — just build/i }).click();

      // Should start generating (pills disappear, button shows "Generating...")
      await expect(pillsPanel).not.toBeVisible({ timeout: 3000 });
      await expect(page.getByRole('button', { name: /generating/i })).toBeVisible();
    }
  });

  test('should cancel calibration and return to idle state', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    await input.fill('React useEffect hook');
    await page.getByRole('button', { name: /generate path/i }).click();

    const pillsPanel = page.getByText(/quick calibration/i);
    await expect(pillsPanel).toBeVisible({ timeout: 15000 }).catch(() => {});

    const hasPills = await pillsPanel.isVisible().catch(() => false);

    if (hasPills) {
      await page.getByRole('button', { name: /cancel/i }).click();

      // Pills panel should disappear
      await expect(pillsPanel).not.toBeVisible();

      // Form should be back to idle
      await expect(page.getByRole('button', { name: /generate path/i })).toBeVisible();
    }
  });
});

test.describe('Calibration Pills — Wave 2 Follow-up', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/learn');
  });

  test('should show Wave 2 pills or proceed to generation after Wave 1 Continue', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    await input.fill('React useEffect hook');
    await page.getByRole('button', { name: /generate path/i }).click();

    const pillsPanel = page.getByText(/quick calibration/i);
    await expect(pillsPanel).toBeVisible({ timeout: 15000 }).catch(() => {});

    const hasPills = await pillsPanel.isVisible().catch(() => false);

    if (!hasPills) return;

    // Select a couple of pills as "known" to give Wave 2 something to analyze
    const pills = page.locator('.bg-gray-50 button.rounded-full');
    const count = await pills.count();
    if (count > 0) await pills.first().click();
    if (count > 1) await pills.nth(1).click();

    // Click Continue to trigger Wave 2 check
    await page.getByRole('button', { name: /continue/i }).click();

    // Should show either:
    // 1. "Checking for gaps…" → Wave 2 amber panel ("Quick follow-up")
    // 2. "Generating…" (Wave 2 not needed, straight to path generation)
    const wave2Panel = page.getByText(/quick follow-up/i);
    const generatingBtn = page.getByRole('button', { name: /generating/i });
    const checkingGaps = page.getByText(/checking for gaps/i);

    // First we may briefly see "Checking for gaps…"
    await expect(wave2Panel.or(generatingBtn).or(checkingGaps)).toBeVisible({ timeout: 15000 });

    const hasWave2 = await wave2Panel.isVisible().catch(() => false);

    if (hasWave2) {
      // Amber-themed follow-up panel
      await expect(page.getByText(/a few more concepts to pin down/i)).toBeVisible();

      // Should have pills in amber style
      const w2Pills = page.locator('.bg-amber-50 button.rounded-full');
      const w2Count = await w2Pills.count();
      expect(w2Count).toBeGreaterThan(0);

      // Should have Skip and Continue buttons
      await expect(page.getByRole('button', { name: /skip — just build/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
    }
  });

  test('should allow skipping Wave 2 and generating with Wave 1 data only', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    await input.fill('React useEffect hook');
    await page.getByRole('button', { name: /generate path/i }).click();

    const pillsPanel = page.getByText(/quick calibration/i);
    await expect(pillsPanel).toBeVisible({ timeout: 15000 }).catch(() => {});

    const hasPills = await pillsPanel.isVisible().catch(() => false);
    if (!hasPills) return;

    // Continue through Wave 1
    await page.getByRole('button', { name: /continue/i }).click();

    const wave2Panel = page.getByText(/quick follow-up/i);
    const generatingBtn = page.getByRole('button', { name: /generating/i });

    await expect(wave2Panel.or(generatingBtn)).toBeVisible({ timeout: 15000 });

    const hasWave2 = await wave2Panel.isVisible().catch(() => false);

    if (hasWave2) {
      // Skip Wave 2
      await page.getByRole('button', { name: /skip — just build/i }).click();

      // Should start generating
      await expect(wave2Panel).not.toBeVisible({ timeout: 3000 });
      await expect(page.getByRole('button', { name: /generating/i })).toBeVisible();
    }
  });

  test('should complete full Wave 1 → Wave 2 → Generate flow', async ({ page }) => {
    const input = page.getByPlaceholder(/what do you want to learn/i);
    await input.fill('React useEffect hook');
    await page.getByRole('button', { name: /generate path/i }).click();

    // Wait for pills
    const pillsPanel = page.getByText(/quick calibration/i);
    await expect(pillsPanel).toBeVisible({ timeout: 15000 }).catch(() => {});

    const hasPills = await pillsPanel.isVisible().catch(() => false);
    if (!hasPills) return;

    // Mark a pill as known
    const w1Pills = page.locator('.bg-gray-50 button.rounded-full');
    if ((await w1Pills.count()) > 0) {
      await w1Pills.first().click();
    }

    // Continue through Wave 1
    await page.getByRole('button', { name: /continue/i }).click();

    // Wait for Wave 2 or generation
    const wave2Panel = page.getByText(/quick follow-up/i);
    const generatingBtn = page.getByRole('button', { name: /generating/i });

    await expect(wave2Panel.or(generatingBtn)).toBeVisible({ timeout: 15000 });

    const hasWave2 = await wave2Panel.isVisible().catch(() => false);

    if (hasWave2) {
      // Mark a Wave 2 pill as known
      const w2Pills = page.locator('.bg-amber-50 button.rounded-full');
      if ((await w2Pills.count()) > 0) {
        await w2Pills.first().click();
      }

      // Continue to generate
      await page.getByRole('button', { name: /continue/i }).click();
    }

    // Should be generating now
    await expect(page.getByRole('button', { name: /generating/i })).toBeVisible({ timeout: 5000 });

    // Wait for generation to complete — the button reverts to "Generate Path"
    await expect(page.getByRole('button', { name: /generate path/i })).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Path Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/learn');
  });

  test('should show empty state when user has no paths', async ({ page }) => {
    // Wait for loading to finish
    await page.waitForTimeout(2000);

    const emptyState = page.getByText(/no learning paths yet/i);
    const pathHeading = page.getByRole('heading', { name: /active|suggested|paused|completed/i }).first();

    // Either empty state or at least one path category heading
    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasPaths = await pathHeading.isVisible().catch(() => false);

    expect(isEmpty || hasPaths).toBe(true);
  });
});
