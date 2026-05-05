import { test, expect } from '@playwright/test';

test('simple page load', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/تجارت/);
  await expect(page.getByRole('link', { name: /ورود|login/i })).toBeVisible();
  const registerCta = page.locator('a[aria-label="register-cta"]');
  await expect(registerCta).toBeVisible();
  await registerCta.click();
  await expect(page).toHaveURL(/\/auth\/register/);
});

test('home language switch toggles direction', async ({ page }) => {
  await page.goto('/');

  const rootContainer = page.locator('div[dir]').first();
  await expect(rootContainer).toHaveAttribute('dir', 'rtl');

  await page.getByRole('button', { name: 'English' }).click();
  await expect(rootContainer).toHaveAttribute('dir', 'ltr');

  await page.getByRole('button', { name: 'فارسی' }).click();
  await expect(rootContainer).toHaveAttribute('dir', 'rtl');
});