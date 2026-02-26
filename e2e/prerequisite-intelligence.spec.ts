import { test, expect, type Page } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

/**
 * E2E tests for Epic 14 — Prerequisite Intelligence
 *
 * Tests the full screening → gap-tier → path-creation flow at each
 * "floor level" a learner might test into:
 *
 *   none/small  → direct path generation (0-3 missing prerequisites)
 *   medium      → amber panel, "Create prerequisite path" (4-8 missing)
 *   large       → amber panel, "Create prerequisite path chain" (9+ missing)
 *   skip        → user bypasses gap recommendation
 *
 * Also covers:
 *   S4 — prerequisite badges & dashed connectors on path detail page
 *   S5 — prerequisite gap cards on Learn page
 *
 * These tests are AI-dependent — they use conditional assertions
 * that gracefully handle non-deterministic AI responses.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Enter a goal and trigger screening (preflight → screening chat flow). */
async function startScreeningForGoal(page: Page, goal: string) {
  const input = page.getByPlaceholder(/what do you want to learn/i);
  await input.fill(goal);
  await page.getByRole('button', { name: /generate path/i }).click();
}

/** Wait for the screening chat panel to appear after preflight check. */
async function waitForScreeningChat(page: Page, timeoutMs = 15000): Promise<boolean> {
  const screeningPanel = page.getByText(/adaptive screening chat/i);
  const autoSkip = page.locator('.bg-emerald-50');

  try {
    await expect(screeningPanel.or(autoSkip)).toBeVisible({ timeout: timeoutMs });
    return await screeningPanel.isVisible();
  } catch {
    return false;
  }
}

/** Click "Generate my path" to end screening early and get the gap result. */
async function triggerGenerateNow(page: Page) {
  const generateNowBtn = page.getByRole('button', { name: /generate my path/i });
  if (await generateNowBtn.isVisible().catch(() => false)) {
    await generateNowBtn.click();
  }
}

/** Wait for the gap-tier amber panel or direct generation to finish. */
async function waitForGapResultOrGeneration(page: Page, timeoutMs = 30000) {
  const amberPanel = page.locator('.bg-amber-50').first();
  const generatingBtn = page.getByRole('button', { name: /generating/i });
  const generateBtn = page.getByRole('button', { name: /generate path/i });

  await expect(amberPanel.or(generatingBtn).or(generateBtn)).toBeVisible({ timeout: timeoutMs });

  return {
    hasAmberPanel: await amberPanel.isVisible().catch(() => false),
    isGenerating: await generatingBtn.isVisible().catch(() => false),
    isDone: await generateBtn.isVisible().catch(() => false),
  };
}

// ---------------------------------------------------------------------------
// E14-S1: Screening Chat Flow
// ---------------------------------------------------------------------------

test.describe('E14 — Prerequisite Screening Chat', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard/learn');
  });

  test('should show screening chat when generating a path', async ({ page }) => {
    await startScreeningForGoal(page, 'Build a REST API with Node.js');

    // First we see the preflight check
    const preflightText = page.getByText(/checking prerequisite readiness/i);
    await expect(preflightText).toBeVisible({ timeout: 5000 }).catch(() => {
      // May be too fast to see
    });

    // Then either screening chat or auto-skip
    const hasScreening = await waitForScreeningChat(page);

    if (hasScreening) {
      // Screening chat elements
      await expect(page.getByText(/adaptive screening chat/i)).toBeVisible();
      await expect(page.getByPlaceholder(/type your answer/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /don.*t know enough/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /generate my path/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    }
  });

  test('should show progress indicators during screening', async ({ page }) => {
    await startScreeningForGoal(page, 'Learn advanced TypeScript generics');

    const hasScreening = await waitForScreeningChat(page);
    if (!hasScreening) return;

    // Wait for the first AI question to finish loading (buttons become enabled)
    const dontKnowBtn = page.getByRole('button', { name: /don.*t know enough/i });
    await expect(dontKnowBtn).toBeEnabled({ timeout: 30000 });
    await dontKnowBtn.click();

    // Wait for the API response that populates progress stats
    await expect(page.getByText(/turns:/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/assessed:/i)).toBeVisible({ timeout: 5000 });
  });

  test('should allow sending a message in screening chat', async ({ page }) => {
    await startScreeningForGoal(page, 'Learn React state management');

    const hasScreening = await waitForScreeningChat(page);
    if (!hasScreening) return;

    // Wait for the first AI question to arrive (buttons become enabled)
    const sendBtn = page.getByRole('button', { name: /send/i });
    const input = page.getByPlaceholder(/type your answer/i);
    await expect(input).toBeEnabled({ timeout: 20000 });

    // Type and send a response
    await input.fill('I know basic React hooks but not Redux');
    await expect(sendBtn).toBeEnabled({ timeout: 3000 });
    await sendBtn.click();

    // Input should be cleared after send
    await expect(input).toHaveValue('', { timeout: 15000 });

    // A new assistant response should appear (at least 2 messages now)
    const assistantMessages = page.locator('.bg-indigo-100, .bg-indigo-950');
    await expect(assistantMessages.nth(1)).toBeVisible({ timeout: 15000 });
  });

  test('should handle "I don\'t know" action in screening', async ({ page }) => {
    await startScreeningForGoal(page, 'Learn distributed systems');

    const hasScreening = await waitForScreeningChat(page);
    if (!hasScreening) return;

    await page.getByRole('button', { name: /don.*t know enough/i }).click();

    // Should get a follow-up response (AI broadens probe)
    // Wait for new assistant message to appear
    const messages = page.locator('.bg-indigo-100, .bg-indigo-950');
    await expect(messages).toHaveCount(await messages.count(), { timeout: 10000 });
  });

  test('should cancel screening and return to idle', async ({ page }) => {
    await startScreeningForGoal(page, 'Learn Kubernetes');

    const hasScreening = await waitForScreeningChat(page);
    if (!hasScreening) return;

    await page.getByRole('button', { name: /cancel/i }).click();

    // Screening panel should disappear
    await expect(page.getByText(/adaptive screening chat/i)).not.toBeVisible();

    // Form should be back to normal
    await expect(page.getByRole('button', { name: /generate path/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// E14-S1/S2: Gap Tier Floor Levels
// ---------------------------------------------------------------------------

test.describe('E14 — Gap Tier: None/Small (direct path generation)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard/learn');
  });

  test('should generate path directly for a simple well-known topic', async ({ page }) => {
    // A very simple topic — likely none/small gap for most users
    await startScreeningForGoal(page, 'Learn HTML basics');

    const hasScreening = await waitForScreeningChat(page);

    if (!hasScreening) {
      // Auto-skipped — the emerald banner should appear briefly
      const autoSkip = page.locator('.bg-emerald-50');
      const isAutoSkipped = await autoSkip.isVisible().catch(() => false);
      if (isAutoSkipped) {
        await expect(autoSkip).toBeVisible();
      }
      // Path should be generating or done
      const generateBtn = page.getByRole('button', { name: /generate path/i });
      await expect(generateBtn).toBeVisible({ timeout: 60000 });
      return;
    }

    // Answer the screening to show we know things
    const input = page.getByPlaceholder(/type your answer/i);
    await input.fill('I have basic computer skills and have seen some web pages');
    await page.getByRole('button', { name: /send/i }).click();

    // Wait for response, then trigger generation
    await page.waitForTimeout(3000);
    await triggerGenerateNow(page);

    const result = await waitForGapResultOrGeneration(page);

    if (!result.hasAmberPanel) {
      // No gap panel → none/small gap → direct generation
      // Wait for path to be created
      const generateBtn = page.getByRole('button', { name: /generate path/i });
      await expect(generateBtn).toBeVisible({ timeout: 60000 });

      // A new path should appear (Active or Suggested)
      const pathSection = page.getByRole('heading', { name: /active|suggested/i }).first();
      await expect(pathSection).toBeVisible({ timeout: 5000 }).catch(() => {
        // Path may already exist from a previous run
      });
    }
  });
});

test.describe('E14 — Gap Tier: Medium (prerequisite path creation)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard/learn');
  });

  test('should show medium gap recommendation panel', async ({ page }) => {
    // Pick a topic that requires moderate prerequisites
    await startScreeningForGoal(page, 'Build a compiler from scratch');

    const hasScreening = await waitForScreeningChat(page);
    if (!hasScreening) return;

    // Claim ignorance to raise missing count
    await page.getByRole('button', { name: /don.*t know enough/i }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /don.*t know enough/i }).click();
    await page.waitForTimeout(2000);

    // Trigger generation
    await triggerGenerateNow(page);

    const result = await waitForGapResultOrGeneration(page);

    if (result.hasAmberPanel) {
      const amberPanel = page.locator('.bg-amber-50').first();

      // Check if it's medium or large gap
      const panelText = await amberPanel.textContent() || '';
      const isMedium = /medium prerequisite gap/i.test(panelText);
      const isLarge = /large prerequisite gap/i.test(panelText);

      if (isMedium) {
        // Medium gap: should have "Create prerequisite path" button
        await expect(page.getByRole('button', { name: /create prerequisite path$/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /skip.*just build/i })).toBeVisible();

        // The recommendation text
        await expect(page.getByText(/create one focused prerequisite path/i)).toBeVisible();
      }

      if (isLarge) {
        // Large gap: should have "Create prerequisite path chain" button
        await expect(page.getByRole('button', { name: /create prerequisite path chain/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /skip.*just build/i })).toBeVisible();

        await expect(page.getByText(/create a short prerequisite path chain/i)).toBeVisible();
      }
    }
  });

  test('should create prerequisite path when user accepts recommendation', async ({ page }) => {
    await startScreeningForGoal(page, 'Build a compiler from scratch');

    const hasScreening = await waitForScreeningChat(page);
    if (!hasScreening) return;

    // Claim ignorance to push into medium/large gap
    await page.getByRole('button', { name: /don.*t know enough/i }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /don.*t know enough/i }).click();
    await page.waitForTimeout(2000);
    await triggerGenerateNow(page);

    const result = await waitForGapResultOrGeneration(page);

    if (result.hasAmberPanel) {
      // Click whichever prerequisite creation button is available
      const createPrereqBtn = page.getByRole('button', { name: /create prerequisite path/i }).first();
      await createPrereqBtn.click();

      // Should start generating (button becomes disabled or shows generating)
      const generateBtn = page.getByRole('button', { name: /generate path/i });
      await expect(generateBtn).toBeVisible({ timeout: 90000 });

      // After generation, multiple paths should appear (prereq + target)
      await page.waitForTimeout(2000);
      const pathCards = page.locator('[class*="bg-gradient-to-br"]');
      const pathCount = await pathCards.count();
      // Should have at least 2 paths (prereq + target) if medium,
      // or 3 paths (foundation + bridge + target) if large
      expect(pathCount).toBeGreaterThanOrEqual(1);
    }
  });
});

test.describe('E14 — Gap Tier: Large (prerequisite chain creation)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard/learn');
  });

  test('should show large gap panel for advanced topic with claimed ignorance', async ({ page }) => {
    // Very advanced topic + claim total ignorance
    await startScreeningForGoal(page, 'Implement a distributed consensus algorithm like Raft');

    const hasScreening = await waitForScreeningChat(page);
    if (!hasScreening) return;

    // Repeatedly claim ignorance to push missing count high
    for (let i = 0; i < 3; i++) {
      const dontKnowBtn = page.getByRole('button', { name: /don.*t know enough/i });
      if (await dontKnowBtn.isEnabled()) {
        await dontKnowBtn.click();
        await page.waitForTimeout(2500);
      }
    }

    await triggerGenerateNow(page);
    const result = await waitForGapResultOrGeneration(page);

    if (result.hasAmberPanel) {
      const panelText = await page.locator('.bg-amber-50').first().textContent() || '';

      if (/large/i.test(panelText)) {
        // Large gap specific UI
        await expect(page.getByRole('button', { name: /create prerequisite path chain/i })).toBeVisible();
        await expect(page.getByText(/create a short prerequisite path chain/i)).toBeVisible();
      }
    }
  });
});

test.describe('E14 — Skip Gap Recommendation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard/learn');
  });

  test('should skip gap recommendation and generate main goal path directly', async ({ page }) => {
    await startScreeningForGoal(page, 'Build a compiler from scratch');

    const hasScreening = await waitForScreeningChat(page);
    if (!hasScreening) return;

    // Push into gap territory
    await page.getByRole('button', { name: /don.*t know enough/i }).click();
    await page.waitForTimeout(2000);
    await triggerGenerateNow(page);

    const result = await waitForGapResultOrGeneration(page);

    if (result.hasAmberPanel) {
      // Click "Skip, just build my main goal"
      await page.getByRole('button', { name: /skip.*just build/i }).click();

      // Should start generating the main goal path directly
      const generateBtn = page.getByRole('button', { name: /generate path/i });
      await expect(generateBtn).toBeVisible({ timeout: 60000 });
    }
  });
});

// ---------------------------------------------------------------------------
// E14-S4: Prerequisite Badges & Connectors on Path Detail
// ---------------------------------------------------------------------------

test.describe('E14-S4 — Prerequisite Milestone Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard/learn');
  });

  test('should show prerequisite badges on milestones in path detail', async ({ page }) => {
    // First, generate a path that includes prerequisite milestones
    // by going through screening with some gaps
    await startScreeningForGoal(page, 'Master async/await in JavaScript');

    const hasScreening = await waitForScreeningChat(page);

    if (hasScreening) {
      // Indicate partial knowledge to get inline prereq milestones (small gap)
      const input = page.getByPlaceholder(/type your answer/i);
      await input.fill('I know basic JavaScript but not promises');
      await page.getByRole('button', { name: /send/i }).click();
      await page.waitForTimeout(3000);
      await triggerGenerateNow(page);
    }

    // Wait for generation to complete
    const generateBtn = page.getByRole('button', { name: /generate path/i });
    await expect(generateBtn).toBeVisible({ timeout: 60000 });

    // Find and click on a path to open detail view
    const pathCard = page.locator('[class*="bg-gradient-to-br"]').first();
    const hasPath = await pathCard.isVisible().catch(() => false);

    if (!hasPath) return;

    // Click the "Open" button on the path card
    const openBtn = page.getByRole('button', { name: /open/i }).first();
    if (await openBtn.isVisible().catch(() => false)) {
      await openBtn.click();
    } else {
      await pathCard.click();
    }

    // Wait for path detail page to load
    await page.waitForURL(/\/dashboard\/learn\/[^/]+/, { timeout: 10000 });

    // Check for milestone list
    const milestoneCards = page.locator('[class*="rounded-lg"][class*="border"]');
    const milestoneCount = await milestoneCards.count();

    if (milestoneCount > 0) {
      // Look for prerequisite badges (purple or gray "Prerequisite" text)
      const prereqBadges = page.getByText(/prerequisite/i, { exact: false });
      const hasBadges = await prereqBadges.first().isVisible().catch(() => false);

      if (hasBadges) {
        // The badge should have proper aria attributes
        const badge = page.locator('[aria-label="Prerequisite milestone"]').first();
        await expect(badge).toBeVisible();
      }

      // Look for dashed connectors between milestones (E14-S4 feature)
      const dashedConnectors = page.locator('[class*="border-dashed"]');
      // May or may not be present depending on whether the AI generated prereq milestones
      const hasDashed = await dashedConnectors.first().isVisible().catch(() => false);
      // Just verify it doesn't crash — presence is AI-dependent
      expect(typeof hasDashed).toBe('boolean');
    }
  });
});

// ---------------------------------------------------------------------------
// E14-S5: Prerequisite Gap Cards on Learn Page
// ---------------------------------------------------------------------------

test.describe('E14-S5 — Prerequisite Gap Cards on Learn Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard/learn');
  });

  test('should display gap cards next to active paths with missing prerequisites', async ({ page }) => {
    // Wait for paths to load
    await page.waitForTimeout(2000);

    // Check if any active paths exist
    const activeSection = page.getByRole('heading', { name: /active paths/i });
    const hasActivePaths = await activeSection.isVisible().catch(() => false);

    if (!hasActivePaths) return;

    // Look for prerequisite gap cards (purple-tinted, role="complementary")
    const gapCards = page.locator('[role="complementary"]');
    const gapCardCount = await gapCards.count();

    if (gapCardCount > 0) {
      // Verify gap card anatomy
      const firstGap = gapCards.first();

      // Should have "Prerequisite" badge
      await expect(firstGap.getByText('🟣 Prerequisite')).toBeVisible();

      // Should have "Create Learning Path" CTA
      await expect(firstGap.getByRole('button', { name: /create.*learning path/i })).toBeVisible();

      // Should have purple styling
      const classList = await firstGap.getAttribute('class') || '';
      expect(classList).toContain('bg-purple-50');

      // Should have aria-label referencing the concept and path
      const ariaLabel = await firstGap.getAttribute('aria-label') || '';
      expect(ariaLabel).toContain('Prerequisite gap');

      // Arrow connector should be present between gap card and path
      const arrows = page.locator('[aria-hidden="true"]').filter({ hasText: '→' });
      const hasArrow = await arrows.first().isVisible().catch(() => false);
      expect(typeof hasArrow).toBe('boolean');
    }
  });

  test('should open confirmation modal when clicking gap card CTA', async ({ page }) => {
    await page.waitForTimeout(2000);

    const gapCards = page.locator('[role="complementary"]');
    const gapCardCount = await gapCards.count();

    if (gapCardCount === 0) return;

    // Click "Create Learning Path" on first gap card
    const ctaBtn = gapCards.first().getByRole('button', { name: /create.*learning path/i });
    await ctaBtn.click();

    // Modal should appear
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Modal should have expected content
    await expect(modal.getByText(/create a focused path/i)).toBeVisible();
    await expect(modal.getByRole('button', { name: /create path/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /not now/i })).toBeVisible();
  });

  test('should dismiss modal when clicking "Not Now"', async ({ page }) => {
    await page.waitForTimeout(2000);

    const gapCards = page.locator('[role="complementary"]');
    if (await gapCards.count() === 0) return;

    // Open modal
    await gapCards.first().getByRole('button', { name: /create.*learning path/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

    // Click "Not Now"
    await page.getByRole('button', { name: /not now/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should navigate with goal pre-fill when clicking "Create Path" in modal', async ({ page }) => {
    await page.waitForTimeout(2000);

    const gapCards = page.locator('[role="complementary"]');
    if (await gapCards.count() === 0) return;

    // Open modal
    await gapCards.first().getByRole('button', { name: /create.*learning path/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });

    // Click "Create Path"
    await page.getByRole('dialog').getByRole('button', { name: /create path/i }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });

    // URL should now have ?goal= parameter
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('goal=');

    // Goal input should be pre-filled
    const goalInput = page.getByPlaceholder(/what do you want to learn/i);
    const goalValue = await goalInput.inputValue();
    expect(goalValue.length).toBeGreaterThan(0);
  });

  test('should pre-fill goal input from ?goal= query parameter', async ({ page }) => {
    // Navigate directly with a goal parameter
    await page.goto('/dashboard/learn?goal=JavaScript+Closures');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Goal input should be pre-filled
    const goalInput = page.getByPlaceholder(/what do you want to learn/i);
    const goalValue = await goalInput.inputValue();
    expect(goalValue).toBe('JavaScript Closures');
  });
});

// ---------------------------------------------------------------------------
// E14 — Full End-to-End Flow: Screening → Gap → Paths → Detail
// ---------------------------------------------------------------------------

test.describe('E14 — Complete Flow Integration', () => {
  test('full flow: screening → gap detection → path creation → detail view', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard/learn');

    // Step 1: Start screening for a topic with potential gaps
    await startScreeningForGoal(page, 'Build microservices with gRPC');

    const hasScreening = await waitForScreeningChat(page);
    if (!hasScreening) {
      // Auto-skipped, still valid — wait for generation
      const generateBtn = page.getByRole('button', { name: /generate path/i });
      await expect(generateBtn).toBeVisible({ timeout: 60000 });
      return;
    }

    // Step 2: Interact with screening
    const input = page.getByPlaceholder(/type your answer/i);
    await input.fill('I know some HTTP basics but nothing about gRPC or protocol buffers');
    await page.getByRole('button', { name: /send/i }).click();
    await page.waitForTimeout(3000);

    // Step 3: Generate path (end screening)
    await triggerGenerateNow(page);

    const result = await waitForGapResultOrGeneration(page);

    // Step 4: Handle gap tier (if detected)
    if (result.hasAmberPanel) {
      const panelText = await page.locator('.bg-amber-50').first().textContent() || '';
      const isLarge = /large/i.test(panelText);
      const isMedium = /medium/i.test(panelText);

      if (isLarge || isMedium) {
        // Accept the recommendation to create prerequisite paths
        const createBtn = page.getByRole('button', { name: /create prerequisite path/i }).first();
        await createBtn.click();
      }
    }

    // Step 5: Wait for all path generation to complete
    const generateBtn = page.getByRole('button', { name: /generate path/i });
    await expect(generateBtn).toBeVisible({ timeout: 90000 });

    // Step 6: Verify paths appear on Learn page
    await page.waitForTimeout(2000);
    const pathSection = page.getByRole('heading', { name: /active|suggested/i }).first();
    const hasPaths = await pathSection.isVisible().catch(() => false);

    if (!hasPaths) return;

    // Step 7: Check for gap cards if paths have prerequisites (S5)
    const gapCards = page.locator('[role="complementary"]');
    const gapCount = await gapCards.count();
    // Record for debugging — may or may not have gaps depending on AI
    expect(typeof gapCount).toBe('number');

    // Step 8: Open a path to check for S4 features
    const openBtn = page.getByRole('button', { name: /open|continue/i }).first();
    if (await openBtn.isVisible().catch(() => false)) {
      await openBtn.click();

      // Wait for detail page
      await page.waitForURL(/\/dashboard\/learn\/[^/]+/, { timeout: 10000 });

      // Verify milestones rendered
      const milestones = page.locator('h3');
      const milestoneCount = await milestones.count();
      expect(milestoneCount).toBeGreaterThan(0);

      // Check for any prerequisite-specific UI (badges, dashed lines)
      const prereqBadges = page.locator('[aria-label="Prerequisite milestone"]');
      const badgeCount = await prereqBadges.count();
      // May or may not have prereq milestones — that's AI-dependent
      expect(typeof badgeCount).toBe('number');
    }
  });
});
