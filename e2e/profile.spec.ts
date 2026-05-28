import { test, expect } from '@playwright/test';
import { loginAsSeedUser, navigateSpa } from './helpers/auth';

test.describe('پروفایل', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeedUser(page);
    await navigateSpa(page, '/profile');
  });

  test('اعتبارسنجی مدارک هنگام ذخیره پروفایل فعال است', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /پروفایل کاربری|پروفایل/ })).toBeVisible({ timeout: 10000 });

    await page.locator('input[name="companyName"]').fill('شرکت آزمایشی');
    await page.locator('input[name="phone"]').fill('02112345678');
    await page.locator('input[name="address.province"]').fill('تهران');
    await page.locator('input[name="address.city"]').fill('تهران');
    await page.locator('textarea[name="address.addressLine"]').fill('خیابان تست پروفایل، کوچه تست، پلاک ۱۰');
    await page.locator('input[name="address.postalCode"]').fill('1234567890');
    await page.getByRole('checkbox', { name: 'آگهی تأسیس' }).check();
    await page.getByRole('button', { name: /ذخیره تغییرات|ذخیره/ }).click();

    await expect(page.getByText(/ابتدا فایل مربوط به|هنوز مدرکی آپلود نشده است/).first()).toBeVisible({ timeout: 10000 });
  });
});