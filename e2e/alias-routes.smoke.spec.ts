import { test, expect } from '@playwright/test';
import { loginAsSeedUser, navigateSpa } from './helpers/auth';

test.describe('Alias Routes Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeedUser(page);
  });

  test('Request alias redirects to trade', async ({ page }) => {
    await navigateSpa(page, '/rfq', /\/trade/);
    await expect(page.getByRole('button', { name: 'درخواست جدید' })).toBeVisible();
  });

  test('alias بازار به catalog هدایت می شود', async ({ page }) => {
    await navigateSpa(page, '/marketplace', /\/(catalog|marketplace)/);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 10000 });
  });

  test('Documents alias redirects to downloads', async ({ page }) => {
    await navigateSpa(page, '/documents', /\/downloads/);
    await expect(page.getByRole('heading', { name: /دانلودها|مرکز اسناد/ })).toBeVisible();
  });

  test('Messages alias redirects to chat in messages mode', async ({ page }) => {
    await navigateSpa(page, '/messages', /\/chat/);
    await expect(page.getByRole('heading', { name: 'مرکز ارتباطات' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'پیام ها' })).toBeVisible();
  });

  test('AI advisor alias redirects to chat in advisor mode', async ({ page }) => {
    await navigateSpa(page, '/ai-advisor', /\/chat/);
    await expect(page.getByRole('heading', { name: 'مشاور هوشمند کشاورزی' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'دریافت پیشنهاد' })).toBeVisible();
  });
});
