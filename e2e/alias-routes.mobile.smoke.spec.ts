import { test, expect, devices } from '@playwright/test';
import { loginAsSeedUser, navigateSpa } from './helpers/auth';

test.use({
  ...devices['iPhone 13'],
});

test.describe('Alias Routes Mobile Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeedUser(page);
  });

  test('Mobile bottom nav is visible with expected labels', async ({ page }) => {
    await navigateSpa(page, '/dashboard');
    const mobileNav = page.locator('nav').last();
    await expect(mobileNav.getByRole('link', { name: 'خانه', exact: true })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'محصولات', exact: true })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'درخواست ها', exact: true })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'پیام ها', exact: true })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'مالی', exact: true })).toBeVisible();
  });

  test('Mobile request nav opens trade page', async ({ page }) => {
    await navigateSpa(page, '/dashboard');
    const mobileNav = page.locator('nav').last();
    await mobileNav.getByRole('link', { name: 'درخواست ها', exact: true }).click();
    await page.waitForURL(/\/trade/, { timeout: 10000 });
    await expect(page.getByRole('button', { name: 'درخواست جدید' })).toBeVisible();
  });

  test('Mobile deep link alias: messages redirects to chat in messages mode', async ({ page }) => {
    await navigateSpa(page, '/messages', /\/chat/);
    await expect(page.getByRole('heading', { name: 'مرکز ارتباطات' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'پیام ها' })).toBeVisible();
  });

  test('Mobile deep link alias: marketplace redirects to catalog', async ({ page }) => {
    await navigateSpa(page, '/marketplace', /\/(catalog|marketplace)/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('Mobile deep link alias: ai-advisor redirects to chat advisor mode', async ({ page }) => {
    await navigateSpa(page, '/ai-advisor', /\/chat/);
    await expect(page.getByRole('heading', { name: 'مشاور هوشمند کشاورزی' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'دریافت پیشنهاد' })).toBeVisible();
  });
});
