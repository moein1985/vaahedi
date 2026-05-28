import { test, expect } from '@playwright/test';
import { getSeedLoginCandidates, loginAsSeedUser, openUserCodeLoginForm } from './helpers/auth';

test.describe('Authentication Complete Flow', () => {
  test('Seed user can login and reach protected area', async ({ page }) => {
    await loginAsSeedUser(page);
    await expect(page).toHaveURL(/\/(dashboard|profile|trade|products|chat|finance)/);
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Registration submit stays disabled until terms are accepted', async ({ page }) => {
    await page.goto('/auth/register');

    const submitButton = page.getByRole('button', { name: /ثبت نام|ثبت‌نام|register/i }).first();
    await expect(submitButton).toBeDisabled();

    const termsCheckbox = page.getByRole('checkbox', { name: /قوانین را می پذیرم|قوانین را می‌پذیرم/ }).first();
    await termsCheckbox.check();
    await expect(submitButton).toBeEnabled();
  });

  test('Shows error on wrong credentials', async ({ page }) => {
    const { userCodeInput, passwordInput } = await openUserCodeLoginForm(page);
    const candidate = getSeedLoginCandidates()[0];

    await userCodeInput.fill(candidate?.userCode ?? '01000001');
    await passwordInput.fill('WrongPassword123!');
    await page.getByRole('button', { name: 'ورود', exact: true }).click();

    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
    const hasSession = await page.evaluate(() => {
      const authRaw = window.localStorage.getItem('trade-association-auth');
      if (!authRaw) return false;
      try {
        const parsed = JSON.parse(authRaw) as any;
        const state = parsed?.state ?? parsed;
        return Boolean(state?.isAuthenticated === true || state?.user);
      } catch {
        return authRaw.length > 20;
      }
    });
    expect(hasSession).toBe(false);
  });
});