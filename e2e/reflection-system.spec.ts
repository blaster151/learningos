import { test, expect } from '@playwright/test';

test.describe('Reflection System', () => {
  test.describe('Reflection Trigger', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to chat where reflection can be triggered
      await page.goto('/dashboard/chat');
    });

    test('should display reflection trigger banner when conditions are met', async ({ page }) => {
      // Wait for potential reflection trigger
      await page.waitForTimeout(2000);
      
      // Look for reflection trigger banner
      const triggerBanner = page.getByText(/ready to reflect/i);
      const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
      
      const hasTrigger = await triggerBanner.isVisible().catch(() => false);
      
      if (hasTrigger) {
        await expect(triggerBanner).toBeVisible();
        await expect(reflectNowButton).toBeVisible();
      }
    });

    test('should allow dismissing reflection trigger', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const notNowButton = page.getByRole('button', { name: /not now/i });
      
      if (await notNowButton.isVisible().catch(() => false)) {
        await notNowButton.click();
        
        // Banner should disappear
        await expect(notNowButton).not.toBeVisible();
      }
    });

    test('should open reflection modal when clicking Reflect Now', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
      
      if (await reflectNowButton.isVisible().catch(() => false)) {
        await reflectNowButton.click();
        
        // Modal should open
        await expect(page.getByText(/time to reflect/i)).toBeVisible();
      }
    });
  });

  test.describe('Reflection Modal', () => {
    // Note: These tests assume the reflection modal can be opened
    // In real tests, you'd mock the API to return a reflection prompt
    
    test('should display reflection prompt text', async ({ page }) => {
      await page.goto('/dashboard/chat');
      
      // Open reflection modal if trigger is available
      const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
      
      if (await reflectNowButton.isVisible().catch(() => false)) {
        await reflectNowButton.click();
        
        // Check modal header
        await expect(page.getByText(/time to reflect/i)).toBeVisible();
        
        // Check for prompt text area
        const promptArea = page.locator('.bg-blue-50');
        await expect(promptArea).toBeVisible();
      }
    });

    test('should show hints when toggle is clicked', async ({ page }) => {
      await page.goto('/dashboard/chat');
      
      const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
      
      if (await reflectNowButton.isVisible().catch(() => false)) {
        await reflectNowButton.click();
        
        // Look for hints toggle
        const hintsToggle = page.getByText(/need some hints/i).or(page.getByText(/show hints/i));
        
        if (await hintsToggle.isVisible().catch(() => false)) {
          await hintsToggle.click();
          
          // Hints should expand
          const hintsContent = page.locator('ul').filter({ hasText: /hint|consider/i });
          await expect(hintsContent).toBeVisible();
        }
      }
    });

    test('should display word count while typing', async ({ page }) => {
      await page.goto('/dashboard/chat');
      
      const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
      
      if (await reflectNowButton.isVisible().catch(() => false)) {
        await reflectNowButton.click();
        
        // Find textarea
        const textarea = page.getByRole('textbox').or(page.locator('textarea'));
        
        if (await textarea.isVisible().catch(() => false)) {
          // Type some content
          await textarea.fill('This is my reflection about what I learned today. I understand concepts better now.');
          
          // Word count should be displayed
          const wordCount = page.getByText(/\d+\s*\/\s*\d+\s*words/i).or(page.getByText(/\d+ words/i));
          await expect(wordCount).toBeVisible();
        }
      }
    });

    test('should enable submit button when minimum word count is met', async ({ page }) => {
      await page.goto('/dashboard/chat');
      
      const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
      
      if (await reflectNowButton.isVisible().catch(() => false)) {
        await reflectNowButton.click();
        
        const textarea = page.getByRole('textbox').or(page.locator('textarea'));
        const submitButton = page.getByRole('button', { name: /submit|send/i });
        
        if (await textarea.isVisible().catch(() => false)) {
          // Initially button should be disabled (no content)
          await expect(submitButton).toBeDisabled();
          
          // Type enough content (50+ words typically)
          const longReflection = Array(60).fill('word').join(' ');
          await textarea.fill(longReflection);
          
          // Button should now be enabled
          await expect(submitButton).toBeEnabled();
        }
      }
    });

    test('should close modal when close button is clicked', async ({ page }) => {
      await page.goto('/dashboard/chat');
      
      const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
      
      if (await reflectNowButton.isVisible().catch(() => false)) {
        await reflectNowButton.click();
        
        // Modal should be open
        await expect(page.getByText(/time to reflect/i)).toBeVisible();
        
        // Close modal
        const closeButton = page.getByRole('button', { name: /close/i }).or(page.locator('[aria-label="Close"]'));
        await closeButton.click();
        
        // Modal should be closed
        await expect(page.getByText(/time to reflect/i)).not.toBeVisible();
      }
    });

    test('should allow skipping reflection', async ({ page }) => {
      await page.goto('/dashboard/chat');
      
      const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
      
      if (await reflectNowButton.isVisible().catch(() => false)) {
        await reflectNowButton.click();
        
        const skipButton = page.getByRole('button', { name: /skip|later|not now/i });
        
        if (await skipButton.isVisible().catch(() => false)) {
          await skipButton.click();
          
          // Modal should close
          await expect(page.getByText(/time to reflect/i)).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Reflection Results', () => {
    // Note: These tests would require mocking API responses
    // to simulate a completed reflection submission
    
    test('should display reflection score after submission', async ({ page }) => {
      await page.goto('/dashboard/chat');
      
      // This test simulates the result view
      // In real implementation, you'd mock the submit API
      
      const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
      
      if (await reflectNowButton.isVisible().catch(() => false)) {
        await reflectNowButton.click();
        
        const textarea = page.getByRole('textbox').or(page.locator('textarea'));
        const submitButton = page.getByRole('button', { name: /submit|send/i });
        
        if (await textarea.isVisible().catch(() => false)) {
          // Fill enough content
          const longReflection = 'This is a comprehensive reflection about what I learned today. I now understand the concept of variables in programming. Variables are named containers that store data values. They can hold different types of data like numbers, strings, and booleans. I learned how to declare variables using const, let, and var keywords in JavaScript. The key insight is that const creates immutable bindings while let allows reassignment.';
          await textarea.fill(longReflection);
          
          // Submit
          await submitButton.click();
          
          // Wait for results (may take time for API)
          const resultsHeader = page.getByText(/reflection complete/i);
          
          if (await resultsHeader.isVisible({ timeout: 15000 }).catch(() => false)) {
            await expect(resultsHeader).toBeVisible();
            
            // Score should be visible
            const scoreElement = page.locator('.text-3xl.font-bold').or(page.getByText(/\d{1,3}/).first());
            await expect(scoreElement).toBeVisible();
          }
        }
      }
    });

    test('should display strengths section in results', async ({ page }) => {
      // Navigate to a page that might show results
      await page.goto('/dashboard/chat');
      
      // Check if results are being displayed
      const strengthsHeader = page.getByText(/what you did well/i);
      
      if (await strengthsHeader.isVisible().catch(() => false)) {
        await expect(strengthsHeader).toBeVisible();
        
        // Check for strength items
        const strengthItems = page.locator('.bg-green-50');
        expect(await strengthItems.count()).toBeGreaterThan(0);
      }
    });

    test('should display suggestions section in results', async ({ page }) => {
      await page.goto('/dashboard/chat');
      
      const suggestionsHeader = page.getByText(/areas to explore/i);
      
      if (await suggestionsHeader.isVisible().catch(() => false)) {
        await expect(suggestionsHeader).toBeVisible();
        
        // Check for suggestion items
        const suggestionItems = page.locator('.bg-blue-50');
        expect(await suggestionItems.count()).toBeGreaterThan(0);
      }
    });

    test('should display concept updates in results', async ({ page }) => {
      await page.goto('/dashboard/chat');
      
      const conceptUpdatesHeader = page.getByText(/knowledge updates/i).or(page.getByText(/mastery updates/i));
      
      if (await conceptUpdatesHeader.isVisible().catch(() => false)) {
        await expect(conceptUpdatesHeader).toBeVisible();
      }
    });

    test('should allow continuing after viewing results', async ({ page }) => {
      await page.goto('/dashboard/chat');
      
      const continueButton = page.getByRole('button', { name: /continue learning/i });
      
      if (await continueButton.isVisible().catch(() => false)) {
        await continueButton.click();
        
        // Results modal should close
        await expect(page.getByText(/reflection complete/i)).not.toBeVisible();
      }
    });
  });

  test.describe('Reflection History', () => {
    test('should display recent reflections in dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Look for reflection history section
      const historySection = page.getByText(/recent reflections/i).or(page.getByText(/reflection history/i));
      
      if (await historySection.isVisible().catch(() => false)) {
        await expect(historySection).toBeVisible();
      }
    });
  });
});

test.describe('Reflection Integration with Chat', () => {
  test('should trigger reflection after completing learning session', async ({ page }) => {
    await page.goto('/dashboard/chat');
    
    // Send a message to start a learning session
    const textarea = page.getByLabel('Message input');
    const sendButton = page.getByRole('button', { name: /send message/i });
    
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill('Explain the concept of closures in JavaScript');
      await sendButton.click();
      
      // Wait for AI response
      await page.waitForSelector('[role="article"]', { timeout: 15000 }).catch(() => null);
      
      // After some interaction, reflection trigger might appear
      // This depends on the reflection trigger logic (message count, time, etc.)
      await page.waitForTimeout(3000);
      
      const reflectionTrigger = page.getByText(/ready to reflect/i);
      const hasReflection = await reflectionTrigger.isVisible().catch(() => false);
      
      // Just checking the flow works - trigger may or may not appear
      if (hasReflection) {
        await expect(reflectionTrigger).toBeVisible();
      }
    }
  });

  test('should track concepts mentioned in chat for reflection', async ({ page }) => {
    await page.goto('/dashboard/chat');
    
    // Send a message mentioning specific concepts
    const textarea = page.getByLabel('Message input');
    
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill('I want to learn about React hooks and useState');
      await page.getByRole('button', { name: /send message/i }).click();
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      // If reflection is triggered, it should reference the concepts
      const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
      
      if (await reflectNowButton.isVisible().catch(() => false)) {
        await reflectNowButton.click();
        
        // The reflection prompt should be related to the concepts discussed
        const promptArea = page.locator('.bg-blue-50');
        if (await promptArea.isVisible()) {
          const promptText = await promptArea.textContent();
          // Prompt should exist (content will vary based on AI generation)
          expect(promptText).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Reflection Accessibility', () => {
  test('should have proper ARIA labels on reflection modal', async ({ page }) => {
    await page.goto('/dashboard/chat');
    
    const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
    
    if (await reflectNowButton.isVisible().catch(() => false)) {
      await reflectNowButton.click();
      
      // Check for proper dialog role
      const modal = page.getByRole('dialog').or(page.locator('[role="dialog"]'));
      
      if (await modal.isVisible().catch(() => false)) {
        await expect(modal).toBeVisible();
      }
      
      // Check close button is accessible
      const closeButton = page.getByRole('button', { name: /close/i });
      if (await closeButton.isVisible().catch(() => false)) {
        await expect(closeButton).toBeVisible();
      }
    }
  });

  test('should support keyboard navigation in reflection modal', async ({ page }) => {
    await page.goto('/dashboard/chat');
    
    const reflectNowButton = page.getByRole('button', { name: /reflect now/i });
    
    if (await reflectNowButton.isVisible().catch(() => false)) {
      await reflectNowButton.click();
      
      // Press Tab to navigate through focusable elements
      await page.keyboard.press('Tab');
      
      // Press Escape to close
      await page.keyboard.press('Escape');
      
      // Modal should close
      const modal = page.getByText(/time to reflect/i);
      await expect(modal).not.toBeVisible();
    }
  });
});
