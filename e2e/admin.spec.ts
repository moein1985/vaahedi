import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateSpa } from './helpers/auth';

test.describe('پنل ادمین', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateSpa(page, '/admin/users');
  });

  test('نمایش لیست کاربران در پنل ادمین', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /مدیریت کاربران|کاربران/ })).toBeVisible();
    await expect(page.locator('table, [role="table"]')).toBeVisible();
  });
});