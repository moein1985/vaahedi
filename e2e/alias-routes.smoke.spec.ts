import { test, expect, type Page } from '@playwright/test';

type LoginCandidate = {
  userCode: string;
  password: string;
};

const LOGIN_CANDIDATES: LoginCandidate[] = [
  { userCode: process.env['E2E_USER_CODE'] ?? '', password: process.env['E2E_PASSWORD'] ?? '' },
  { userCode: '01000001', password: 'Farmer@1234' },
  { userCode: '0000001', password: 'Admin@1234' },
].filter((candidate) => candidate.userCode.length > 0 && candidate.password.length > 0);

let preferredLoginCandidate: LoginCandidate | null = null;

async function selectSellerRole(page: Page) {
  const sellerButton = page.getByRole('button', { name: /فروشنده/ }).first();
  if (await sellerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sellerButton.click();
  }

  const userCodeTab = page.getByRole('button', { name: /ورود با کد کاربری/ }).first();
  if (await userCodeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await userCodeTab.click();
  }
}

async function openUserCodeLoginForm(page: Page) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  await selectSellerRole(page);

  const userCodeInput = page
    .locator('input[name="userCode"], input[placeholder*="0100001"], input[autocomplete="username"]')
    .first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

  await expect(userCodeInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible({ timeout: 10000 });

  return { userCodeInput, passwordInput };
}

async function loginAsSeedUser(page: Page) {
  const orderedCandidates = preferredLoginCandidate
    ? [
        preferredLoginCandidate,
        ...LOGIN_CANDIDATES.filter((candidate) => {
          return candidate.userCode !== preferredLoginCandidate!.userCode
            || candidate.password !== preferredLoginCandidate!.password;
        }),
      ]
    : LOGIN_CANDIDATES;

  let lastPath = '/auth/login';
  for (const candidate of orderedCandidates) {
    const { userCodeInput, passwordInput } = await openUserCodeLoginForm(page);

    await userCodeInput.fill(candidate.userCode);
    await passwordInput.fill(candidate.password);
    await page.getByRole('button', { name: 'ورود', exact: true }).first().click();

    const loggedIn = await page
      .waitForFunction(() => {
        const path = new URL(window.location.href).pathname;
        if (path.startsWith('/auth/') || path.startsWith('/admin')) {
          return false;
        }

        const authRaw = window.localStorage.getItem('trade-association-auth');
        if (!authRaw) {
          return false;
        }

        try {
          const parsed = JSON.parse(authRaw) as any;
          return Boolean(
            parsed?.state?.isAuthenticated === true
              || parsed?.state?.user
              || parsed?.state?.accessToken
              || parsed?.accessToken,
          );
        } catch {
          return authRaw.length > 20;
        }
      }, { timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    lastPath = new URL(page.url()).pathname;
    if (loggedIn) {
      preferredLoginCandidate = candidate;
      return;
    }
  }

  throw new Error(
    `Seed login failed for non-admin candidates: ${orderedCandidates.map((c) => c.userCode).join(', ')} | lastPath=${lastPath}`,
  );
}

async function navigateSpa(page: Page, targetPath: string, expected: string | RegExp = targetPath) {
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);

  if (expected instanceof RegExp) {
    await page.waitForURL(expected, { timeout: 10000 });
    return;
  }

  await page.waitForURL((url) => {
    return url.pathname === expected || url.pathname === `${expected}/`;
  }, { timeout: 10000 });
}

test.describe('Alias Routes Smoke', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSeedUser(page);
  });

  test('Request alias redirects to trade', async ({ page }) => {
    await navigateSpa(page, '/rfq', /\/trade/);
    await expect(page.getByRole('button', { name: 'درخواست جدید' })).toBeVisible();
  });

  test('alias بازار به catalog هدایت می شود', async ({ page }) => {
    await navigateSpa(page, '/marketplace', /\/catalog/);
    await expect(page.getByText('بازار هوشمند محصولات کشاورزی')).toBeVisible();
  });

  test('Documents alias redirects to downloads', async ({ page }) => {
    await navigateSpa(page, '/documents', /\/downloads/);
    await expect(page.getByRole('heading', { name: /دانلودها|مرکز اسناد/ })).toBeVisible();
  });

  test('Messages alias redirects to chat in messages mode', async ({ page }) => {
    await navigateSpa(page, '/messages', /\/chat/);
    await expect(page.getByRole('heading', { name: 'مرکز ارتباطات' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'پیام ها' })).toBeVisible();
  });

  test('AI advisor alias redirects to chat in advisor mode', async ({ page }) => {
    await navigateSpa(page, '/ai-advisor', /\/chat/);
    await expect(page.getByRole('heading', { name: 'مشاور هوشمند کشاورزی' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'دریافت پیشنهاد' })).toBeVisible();
  });
});
