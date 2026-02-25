import { test, expect } from '@playwright/test';

test('simple page load', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/تجارت/);
});