import { test, expect } from '@playwright/test';

test.describe('احراز هویت', () => {
  test('ورود با اطلاعات صحیح', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder('مثال: 0100001').fill('0000001');
    await page.locator('input[type="password"]').fill('Admin@1234');
    await page.getByRole('button', { name: 'ورود به حساب' }).click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('ورود با رمز اشتباه — نمایش خطا', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder('مثال: 0100001').fill('0000001');
    await page.locator('input[type="password"]').fill('WrongPassword');
    await page.getByRole('button', { name: 'ورود به حساب' }).click();
    await expect(page.getByText(/رمز عبور|اشتباه|نادرست/)).toBeVisible();
  });
});