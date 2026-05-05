import { test, expect, type Page } from '@playwright/test';

const SEED_USER = {
  userCode: '0000001',
  password: 'Admin@1234',
};

async function selectSellerRole(page: Page) {
  const sellerButton = page.getByRole('button', { name: /فروشنده/ }).first();
  await expect(sellerButton).toBeVisible({ timeout: 10000 });
  await sellerButton.click();
}

async function loginAsSeedUser(page: Page) {
  await page.goto('/auth/login');
  await selectSellerRole(page);
  await expect(page.getByPlaceholder('مثال: 0100001')).toBeVisible({ timeout: 10000 });
  await page.getByPlaceholder('مثال: 0100001').fill(SEED_USER.userCode);
  await page.locator('input[type="password"]').first().fill(SEED_USER.password);
  await page.getByRole('button', { name: 'ورود', exact: true }).click();
  await page.waitForURL(/\/dashboard|\/profile/, { timeout: 15000 });
}

test.describe('Alias Routes Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeedUser(page);
  });

  test('RFQ alias redirects to trade', async ({ page }) => {
    await page.goto('/rfq');
    await page.waitForURL(/\/trade/, { timeout: 10000 });
    await expect(page.getByRole('button', { name: /RFQ جدید|درخواست جدید/ })).toBeVisible();
  });

  test('Marketplace alias redirects to catalog', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForURL(/\/catalog/, { timeout: 10000 });
    await expect(page.getByText('Marketplace هوشمند برای کالاهای صادراتی و وارداتی')).toBeVisible();
  });

  test('Documents alias redirects to downloads', async ({ page }) => {
    await page.goto('/documents');
    await page.waitForURL(/\/downloads/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /دانلودها|مرکز اسناد/ })).toBeVisible();
  });

  test('Messages alias redirects to chat in messages mode', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForURL(/\/chat/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'مرکز ارتباطات' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'پیام ها' })).toBeVisible();
  });

  test('AI advisor alias redirects to chat in advisor mode', async ({ page }) => {
    await page.goto('/ai-advisor');
    await page.waitForURL(/\/chat/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'AI مشاور بازرگانی' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'دریافت پیشنهاد' })).toBeVisible();
  });
});
