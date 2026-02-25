import { test, expect } from '@playwright/test';

test.describe('پروفایل', () => {
  test.beforeEach(async ({ page }) => {
    // ورود با حساب تست
    await page.goto('/auth/login');
    await page.getByPlaceholder(/شماره موبایل|نام کاربری/).fill('09121234567');
    await page.getByPlaceholder(/رمز عبور/).fill('Password@123');
    await page.getByRole('button', { name: /ورود/ }).click();
    await page.waitForURL(/dashboard/);
  });

  test('تکمیل پروفایل کاربر', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /پروفایل/ })).toBeVisible();

    // پر کردن فیلدهای اجباری
    await page.getByLabel(/نام شرکت/).fill('شرکت آزمایشی');
    await page.getByLabel(/تلفن/).fill('02112345678');
    await page.getByRole('button', { name: /ذخیره/ }).click();

    await expect(page.getByText(/ذخیره شد|موفق/)).toBeVisible();
  });
});