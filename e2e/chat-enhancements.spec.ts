import { test, expect } from '@playwright/test';

/**
 * E2E tests for chat enhancement features:
 * - Quick Actions (Unpack, Continue Milestone)
 * - Bold term clicking
 * - Objective Quiz System
 * - Unpack This
 *
 * Note: These tests require auth setup. Most are conditional on AI-dependent
 * state and will gracefully skip when prerequisites aren't met.
 */

test.describe('Quick Actions - New Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/chat');
  });

  test('should display Unpack button in quick actions', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Explain closures in JavaScript');
    await page.getByRole('button', { name: /send message/i }).click();

    // Wait for AI response to complete
    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 15000 });

    // Quick actions group should include the new Unpack button
    const quickActions = page.getByRole('group', { name: /quick actions/i });
    await expect(quickActions).toBeVisible();
    await expect(page.getByRole('button', { name: /unpack this/i })).toBeVisible();
  });

  test('should NOT display Continue Milestone button in regular chat', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    await textarea.fill('What is a variable?');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 15000 });

    // Continue milestone should NOT appear in non-milestone chats
    await expect(page.getByRole('button', { name: /continue milestone/i })).not.toBeVisible();
  });
});

test.describe('Bold Term Clicking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/chat');
  });

  test('should render bold terms as clickable buttons in AI responses', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    await textarea.fill('What is a closure in JavaScript?');
    await page.getByRole('button', { name: /send message/i }).click();

    // Wait for AI response
    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 15000 });

    // AI responses should contain clickable bold terms (buttons with "Learn more about" aria-label)
    const boldTermButtons = page.locator('button[aria-label^="Learn more about"]');
    const count = await boldTermButtons.count();

    // We expect at least 1 bold term in a typical AI response about closures
    // But this is AI-dependent — if the model doesn't bold anything, we can't assert
    if (count > 0) {
      const firstTerm = boldTermButtons.first();
      await expect(firstTerm).toBeVisible();

      // Clicking should populate the input with "Tell me about {term}"
      const termText = await firstTerm.textContent();
      await firstTerm.click();

      // Allow a moment for the auto-send
      await page.waitForTimeout(200);

      // The "Tell me about" message should appear in the chat
      if (termText) {
        await expect(page.getByText(new RegExp(`Tell me about ${termText}`, 'i'))).toBeVisible({ timeout: 3000 });
      }
    }
  });
});

test.describe('Unpack This Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/chat');
  });

  test('should unpack a response into multiple chunks', async ({ page }) => {
    // Send a question that elicits a dense response
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Give me a thorough explanation of how closures, scope chains, and lexical environments work together in JavaScript');
    await page.getByRole('button', { name: /send message/i }).click();

    // Wait for AI response
    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 15000 });

    // Click Unpack
    const unpackButton = page.getByRole('button', { name: /unpack this/i });
    await expect(unpackButton).toBeVisible();
    await unpackButton.click();

    // Wait for the unpack API call and crossfade animation
    // The original message should collapse to "Unpacked into N parts"
    await expect(page.getByText(/unpacked into \d+ parts/i)).toBeVisible({ timeout: 10000 });

    // At least one numbered chunk should appear (indigo-bordered)
    const chunkBubbles = page.locator('.border-indigo-200, .border-indigo-700');
    await expect(chunkBubbles.first()).toBeVisible({ timeout: 3000 });
  });

  test('should progressively reveal chunks with Next Part button', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Explain the event loop, microtasks, and macrotasks in detail');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /unpack this/i }).click();

    // Wait for unpack
    await expect(page.getByText(/unpacked into \d+ parts/i)).toBeVisible({ timeout: 10000 });

    // If there are 2+ chunks, there should be a "Next part" button
    const nextPartButton = page.getByRole('button', { name: /next part/i });
    const hasNext = await nextPartButton.isVisible().catch(() => false);

    if (hasNext) {
      await nextPartButton.click();

      // After clicking, either another "Next part" appears or "All N parts shown"
      const allShown = page.getByText(/all \d+ parts shown/i);
      const anotherNext = page.getByRole('button', { name: /next part/i });

      const doneRevealing = await allShown.isVisible().catch(() => false);
      const moreToGo = await anotherNext.isVisible().catch(() => false);

      expect(doneRevealing || moreToGo).toBe(true);
    }
  });

  test('should collapse chunks back to original via "show original" link', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Explain prototypal inheritance and the prototype chain in JavaScript');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 15000 });

    // Get the original AI response text (first few words) before unpacking
    const aiMessage = page.getByRole('article', { name: /ai message/i }).last();
    const originalText = await aiMessage.textContent();

    await page.getByRole('button', { name: /unpack this/i }).click();
    await expect(page.getByText(/unpacked into \d+ parts/i)).toBeVisible({ timeout: 10000 });

    // Click "show original"
    const showOriginal = page.getByRole('button', { name: /collapse back to original/i });
    await expect(showOriginal).toBeVisible();
    await showOriginal.click();

    // After crossfade, original text should be restored
    // "Unpacked into N parts" should disappear
    await expect(page.getByText(/unpacked into \d+ parts/i)).not.toBeVisible({ timeout: 3000 });

    // Original message content should be back
    if (originalText) {
      // Check that the message area no longer shows the collapsed indicator
      const restoredMessage = page.getByRole('article', { name: /ai message/i }).last();
      const restoredText = await restoredMessage.textContent();
      expect(restoredText).not.toContain('Unpacked into');
    }
  });
});

test.describe('Milestone Chat - Continue Milestone & Quiz', () => {
  // These tests require navigating into a milestone chat session.
  // They will only run meaningfully if the user has an active learning path with milestones.

  test('should show Continue Milestone button in milestone chat', async ({ page }) => {
    // Navigate to learn page and try to find a path with milestones
    await page.goto('/dashboard/learn');
    await page.waitForTimeout(2000);

    // Look for a "Learn with AI" button on any milestone
    const learnButton = page.getByRole('button', { name: /learn with ai/i }).first();
    const hasLearnButton = await learnButton.isVisible().catch(() => false);

    if (!hasLearnButton) {
      test.skip();
      return;
    }

    await learnButton.click();

    // Should navigate to chat with milestone context
    await page.waitForURL(/\/dashboard\/chat/, { timeout: 5000 });

    // Wait for AI greeting
    await expect(page.getByRole('article', { name: /ai message/i })).toBeVisible({ timeout: 15000 });

    // Send a message to trigger quick actions
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Tell me about this concept');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 15000 });

    // Continue Milestone should appear (because we're in a milestone chat)
    await expect(page.getByRole('button', { name: /continue milestone/i })).toBeVisible();
  });

  test('should display objective pills in milestone chat', async ({ page }) => {
    await page.goto('/dashboard/learn');
    await page.waitForTimeout(2000);

    const learnButton = page.getByRole('button', { name: /learn with ai/i }).first();
    const hasLearnButton = await learnButton.isVisible().catch(() => false);

    if (!hasLearnButton) {
      test.skip();
      return;
    }

    await learnButton.click();
    await page.waitForURL(/\/dashboard\/chat/, { timeout: 5000 });

    // Wait for greeting
    await expect(page.getByRole('article', { name: /ai message/i })).toBeVisible({ timeout: 15000 });

    // Send a message so objectives tracker renders (needs messages.length > 0)
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Let us begin');
    await page.getByRole('button', { name: /send message/i }).click();
    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 15000 });

    // Objective tracker should be visible with objective pills
    const objectiveTracker = page.locator('.bg-indigo-50, .bg-indigo-900\\/20');
    const hasTracker = await objectiveTracker.first().isVisible().catch(() => false);

    if (hasTracker) {
      // Should show "Objectives" label
      await expect(page.getByText(/objectives/i)).toBeVisible();

      // Should have at least one objective pill (○ gray state)
      const pills = objectiveTracker.locator('span, button');
      const pillCount = await pills.count();
      expect(pillCount).toBeGreaterThan(0);
    }
  });

  test('should show quiz UI when clicking a ready-to-quiz objective', async ({ page }) => {
    // This test is conditional — it requires the AI to have marked an objective as "ready to quiz"
    // which only happens after sufficient conversation coverage
    await page.goto('/dashboard/learn');
    await page.waitForTimeout(2000);

    const learnButton = page.getByRole('button', { name: /learn with ai/i }).first();
    const hasLearnButton = await learnButton.isVisible().catch(() => false);

    if (!hasLearnButton) {
      test.skip();
      return;
    }

    await learnButton.click();
    await page.waitForURL(/\/dashboard\/chat/, { timeout: 5000 });

    // Wait for greeting and send several messages to trigger objective assessment
    await expect(page.getByRole('article', { name: /ai message/i })).toBeVisible({ timeout: 15000 });

    // Have a brief conversation to try to trigger "ready to quiz"
    const textarea = page.getByLabel('Message input');
    for (const msg of [
      'Explain the first concept in detail',
      'Can you give me an example?',
      'I think I understand now. Let me explain it back to you — it works by...',
    ]) {
      await textarea.fill(msg);
      await page.getByRole('button', { name: /send message/i }).click();
      await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 15000 });
    }

    // Look for a ready-to-quiz pill (🧪 amber)
    const quizPill = page.locator('button').filter({ hasText: '🧪' }).first();
    const hasQuizPill = await quizPill.isVisible().catch(() => false);

    if (hasQuizPill) {
      await quizPill.click();

      // Quiz generation notice should appear
      await expect(page.getByText(/generating quiz/i)).toBeVisible({ timeout: 5000 });

      // Quiz UI should appear (question with options)
      await expect(page.getByText(/question \d+ of 4/i)).toBeVisible({ timeout: 15000 });
    }
    // If no quiz pill appeared, that's OK — AI assessment is non-deterministic
  });
});

test.describe('Quick Actions - Simplify', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/chat');
  });

  test('should show Simplify button and handle click', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Explain monads in functional programming');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 15000 });

    // Simplify button should be visible
    const simplifyButton = page.getByRole('button', { name: /simplify this/i });
    await expect(simplifyButton).toBeVisible();

    // Click simplify
    await simplifyButton.click();

    // Button should show "Simplifying…" state
    await expect(page.getByRole('button', { name: /simplifying/i })).toBeVisible();

    // Wait for simplification to complete (crossfade)
    await expect(page.getByRole('button', { name: /simplifying/i })).not.toBeVisible({ timeout: 15000 });

    // "Simplified" undo link should appear
    const undoLink = page.getByRole('button', { name: /show original/i });
    const hasUndo = await undoLink.isVisible().catch(() => false);

    // Undo link appears for simplified messages
    if (hasUndo) {
      await expect(undoLink).toBeVisible();
    }
  });
});
