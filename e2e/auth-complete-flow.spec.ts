import { test, expect } from '@playwright/test';

test.describe('Authentication Complete Flow', () => {
  test('User can register, login and reach dashboard', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="firstName"]', 'Flow');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="nationalCode"]', '1234567890');
    await page.fill('input[name="mobile"]', '09123456784');
    await page.fill('input[name="email"]', 'flowuser@example.com');
    await page.fill('input[name="password"]', 'FlowPass123!');
    await page.fill('input[name="confirmPassword"]', 'FlowPass123!');
    // assume there is a button with text ثبت‌نام or similar
    await page.click('button:has-text("ثبت")');
    // after registration should redirect to login or dashboard
    await expect(page).toHaveURL(/auth\/login|dashboard/);

    if (page.url().includes('/auth/login')) {
      await page.fill('input[name="userCode"], input[name="email"]', 'flowuser@example.com');
      await page.fill('input[name="password"]', 'FlowPass123!');
      await page.click('button:has-text("ورود")');
    }
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('h1')).toContainText(/داشبورد/);
  });

  test('Shows error on invalid registration', async ({ page }) => {
    await page.goto('/auth/register');
    // leave fields empty and submit
    await page.click('button:has-text("ثبت")');
    await expect(page.locator('.text-destructive')).toBeVisible();
  });

  test('Shows error on wrong credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'nope');
    await page.click('button:has-text("ورود")');
    await expect(page.locator('.text-destructive')).toBeVisible();
  });
});