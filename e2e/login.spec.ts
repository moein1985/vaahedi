import { test, expect } from '@playwright/test';
import { getSeedLoginCandidates, loginAsSeedUser, openUserCodeLoginForm } from './helpers/auth';

test.describe('احراز هویت', () => {
  test('ورود با اطلاعات صحیح', async ({ page }) => {
    await loginAsSeedUser(page);
    await expect(page).toHaveURL(/\/(dashboard|profile|trade|products|chat|finance)/);
  });

  test('ورود با رمز اشتباه — نمایش خطا', async ({ page }) => {
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