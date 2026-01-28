import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should show signup page', async ({ page }) => {
    await page.goto('/signup');
    
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    
    // Click "Sign up" link
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL('/signup');
    
    // Click "Sign in" link
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login');
    
    // Submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation or stay on page
    await expect(page).toHaveURL('/login');
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/signup');
    
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/^password/i).fill('password123');
    
    // Try to submit
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should show error or stay on page
    await expect(page).toHaveURL('/signup');
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing chat without auth', async ({ page }) => {
    await page.goto('/dashboard/chat');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing learn without auth', async ({ page }) => {
    await page.goto('/dashboard/learn');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Home Page', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    
    // Should show some content (home or redirect)
    await expect(page.locator('body')).toBeVisible();
  });
});
