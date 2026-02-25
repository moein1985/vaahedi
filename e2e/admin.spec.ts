import { test, expect } from '@playwright/test';

test.describe('پنل ادمین', () => {
  test.beforeEach(async ({ page }) => {
    // ورود با حساب ادمین (اطلاعات تست را تنظیم کنید)
    await page.goto('/auth/login');
    await page.getByPlaceholder('مثال: 0100001').fill('0000001');
    await page.getByLabel('رمز عبور').fill('Admin@1234');
    await page.getByRole('button', { name: /ورود/ }).click();
    await page.waitForURL(/dashboard/);
    await page.goto('/admin/users');
  });

  test('نمایش لیست کاربران در پنل ادمین', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /کاربران/ })).toBeVisible();
    await expect(page.locator('table, [role="table"]')).toBeVisible();
  });
});