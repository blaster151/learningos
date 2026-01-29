import { test, expect } from '@playwright/test';

test.describe('Session Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/chat');
  });

  test('should create new session automatically on first message', async ({ page }) => {
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Start new conversation');
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Session should be created (check URL or session indicator)
    await page.waitForURL(/\/dashboard\/chat\?session=.*/, { timeout: 5000 });
  });

  test('should display session list', async ({ page }) => {
    // Navigate to sessions page (or open sidebar if applicable)
    await page.goto('/dashboard/sessions');
    
    // Should show sessions heading
    await expect(page.getByRole('heading', { name: /sessions/i })).toBeVisible();
  });

  test('should show session summary', async ({ page }) => {
    // Create a session with messages first
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Test message for summary');
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Wait for response
    await expect(page.getByRole('status', { name: /ai is typing/i })).not.toBeVisible({ timeout: 10000 });
    
    // Navigate to session summary (adjust selector as needed)
    await page.getByRole('button', { name: /session summary/i }).click();
    
    // Should show session stats
    await expect(page.getByText(/message/i)).toBeVisible();
  });

  test.skip('should generate AI session summary', async ({ page }) => {
    // Note: This test is skipped because it depends on having an existing session with messages
    // Enable when you have test fixtures or a way to create sessions programmatically
    
    await page.goto('/dashboard/sessions');
    
    // Click on first session
    await page.locator('[data-testid="session-item"]').first().click();
    
    // Generate summary button
    await page.getByRole('button', { name: /generate summary/i }).click();
    
    // Wait for AI summary
    await expect(page.getByText(/key insights/i)).toBeVisible({ timeout: 15000 });
  });

  test('should load session messages when reopening', async ({ page }) => {
    // Send a message to create session
    const textarea = page.getByLabel('Message input');
    await textarea.fill('First message');
    await page.getByRole('button', { name: /send message/i }).click();
    
    // Get current session URL
    await page.waitForURL(/\/dashboard\/chat\?session=.*/);
    const sessionUrl = page.url();
    
    // Navigate away
    await page.goto('/dashboard');
    
    // Return to session
    await page.goto(sessionUrl);
    
    // Original message should be visible
    await expect(page.getByText('First message')).toBeVisible();
  });
});

test.describe('Session Summary Component', () => {
  test.skip('should display session metadata', async ({ page }) => {
    // Create session with messages
    await page.goto('/dashboard/chat');
    
    const textarea = page.getByLabel('Message input');
    await textarea.fill('Test message');
    await page.getByRole('button', { name: /send message/i }).click();
    
    await page.waitForTimeout(5000);
    
    // Open summary
    await page.getByRole('button', { name: /session summary/i }).click();
    
    // Should show date, message count, concept count
    await expect(page.getByText(/messages:/i)).toBeVisible();
    await expect(page.getByText(/concepts:/i)).toBeVisible();
  });

  test.skip('should display progress level', async ({ page }) => {
    // Navigate to session with generated summary
    await page.goto('/dashboard/sessions');
    await page.locator('[data-testid="session-item"]').first().click();
    
    // Should show progress badge (Beginner/Intermediate/Advanced)
    await expect(page.locator('[data-testid="progress-badge"]')).toBeVisible();
  });
});
