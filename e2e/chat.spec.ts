import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Note: These tests assume you're logged in
    // You may need to add auth setup here
    await page.goto('/dashboard/chat');
  });

  test('should display empty state with example prompts', async ({ page }) => {
    // Check for welcome message
    await expect(page.getByRole('heading', { name: /start a conversation/i })).toBeVisible();
    
    // Check for example prompts
    await expect(page.getByRole('button', { name: /explain recursion/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /closure in javascript/i })).toBeVisible();
  });

  test('should allow clicking example prompts to populate input', async ({ page }) => {
    // Click an example prompt
    await page.getByRole('button', { name: /explain recursion/i }).click();
    
    // Check that input is populated
    const textarea = page.getByLabel('Message input');
    await expect(textarea).toHaveValue(/recursion/i);
  });

  test('should send a message and receive response', async ({ page }) => {
    // Type a message
    const textarea = page.getByLabel('Message input');
    await textarea.fill('What is a variable in programming?');
    
    // Send message
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Check user message appears
    await expect(page.getByText('What is a variable in programming?')).toBeVisible();
    
    // Check for typing indicator
    await expect(page.getByRole('status', { name: /ai is typing/i })).toBeVisible();
    
    // Wait for response (with longer timeout for API)
    await expect(page.getByRole('article', { name: /ai message/i })).toBeVisible({ timeout: 10000 });
    
    // Typing indicator should disappear
    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible();
  });

  test('should handle Enter key to send message', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Test message');
    
    // Press Enter
    await textarea.press('Enter');
    
    // Message should be sent
    await expect(page.getByText('Test message')).toBeVisible();
  });

  test('should handle Shift+Enter for new line', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Line 1');
    
    // Press Shift+Enter
    await textarea.press('Shift+Enter');
    await textarea.press('ArrowDown'); // Move cursor
    await textarea.type('Line 2');
    
    // Should have multiline content (not sent yet)
    const value = await textarea.inputValue();
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
  });

  test('should disable input while loading', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    const sendButton = page.getByRole('button', { name: /send message/i });
    
    await textarea.fill('Test message');
    await sendButton.click();
    
    // Input and button should be disabled while loading
    await expect(textarea).toBeDisabled();
    await expect(sendButton).toBeDisabled();
    
    // Wait for response
    await expect(page.getByRole('status', { name: /ai is typing/i })).toBeVisible();
    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 10000 });
    
    // Should be enabled again
    await expect(textarea).toBeEnabled();
    await expect(sendButton).toBeEnabled();
  });

  test('should display quick actions after AI response', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Explain variables');
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Wait for AI response
    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 10000 });
    
    // Quick actions should appear
    await expect(page.getByRole('group', { name: /quick actions/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /explain more/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /give me an example/i })).toBeVisible();
  });

  test('should handle quick action click', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    await textarea.fill('What is a loop?');
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Wait for response
    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 10000 });
    
    // Click quick action
    await page.getByRole('button', { name: /give me an example/i }).click();
    
    // Input should be populated with quick action text
    await expect(textarea).toHaveValue(/example/i);
  });

  test('should show character count near limit', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    
    // Type a very long message (near 2000 char limit)
    const longText = 'a'.repeat(1850);
    await textarea.fill(longText);
    
    // Character counter should appear
    await expect(page.getByText(/150/)).toBeVisible(); // Shows remaining chars
  });

  test('should enforce max length', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    
    // Try to type more than 2000 characters
    const tooLongText = 'a'.repeat(2100);
    await textarea.fill(tooLongText);
    
    // Should be truncated to 2000
    const value = await textarea.inputValue();
    expect(value.length).toBeLessThanOrEqual(2000);
  });

  test('should auto-scroll to new messages', async ({ page }) => {
    // Send multiple messages to create scroll
    for (let i = 0; i < 3; i++) {
      const textarea = page.getByLabel('Message input');
      await textarea.fill(`Message ${i + 1}`);
      await page.getByRole('button', { name: /send message/i }).click();
      
      // Wait a bit between messages
      await page.waitForTimeout(2000);
    }
    
    // Last message should be visible (scrolled into view)
    await expect(page.getByText('Message 3')).toBeInViewport();
  });
});

test.describe('Concept Tags', () => {
  test.skip('should display concept tags after AI response', async ({ page }) => {
    // Note: This test is skipped because it depends on AI extracting concepts
    // Enable when you have deterministic concept extraction in tests
    
    await page.goto('/dashboard/chat');
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Explain closures in JavaScript');
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Wait for response and concept extraction
    await page.waitForTimeout(5000);
    
    // Concept tags should appear
    await expect(page.locator('.concept-tag')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.goto('/dashboard/chat');
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Test message');
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Should show error message
    await expect(page.getByText(/error/i)).toBeVisible({ timeout: 5000 });
    
    // Re-enable network
    await page.context().setOffline(false);
  });
});
