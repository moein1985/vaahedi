import { expect, type Page } from '@playwright/test';

export type LoginCandidate = {
  userCode: string;
  password: string;
};

type LoginOptions = {
  allowAdmin?: boolean;
  requireAdmin?: boolean;
  timeoutMs?: number;
  cacheKey?: string;
};

const preferredCandidates = new Map<string, LoginCandidate>();

function uniqueCandidates(candidates: LoginCandidate[]): LoginCandidate[] {
  const seen = new Set<string>();
  const unique: LoginCandidate[] = [];

  for (const candidate of candidates) {
    const userCode = candidate.userCode.trim();
    const password = candidate.password.trim();
    if (!userCode || !password) {
      continue;
    }

    const key = `${userCode}::${password}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push({ userCode, password });
  }

  return unique;
}

export function getSeedLoginCandidates(): LoginCandidate[] {
  return uniqueCandidates([
    { userCode: process.env['E2E_USER_CODE'] ?? '', password: process.env['E2E_PASSWORD'] ?? '' },
    { userCode: '01000001', password: 'Farmer@1234' },
    { userCode: '01000001', password: 'Admin@1234' },
    { userCode: '0000001', password: 'Admin@1234' },
  ]);
}

export function getAdminLoginCandidates(): LoginCandidate[] {
  return uniqueCandidates([
    { userCode: process.env['E2E_ADMIN_USER_CODE'] ?? '', password: process.env['E2E_ADMIN_PASSWORD'] ?? '' },
    { userCode: process.env['E2E_USER_CODE'] ?? '', password: process.env['E2E_PASSWORD'] ?? '' },
    { userCode: 'admin', password: 'admin@12321#' },
    { userCode: '0000001', password: 'Admin@1234' },
    { userCode: '01000001', password: 'Admin@1234' },
  ]);
}

function orderByPreferred(cacheKey: string, candidates: LoginCandidate[]): LoginCandidate[] {
  const preferred = preferredCandidates.get(cacheKey);
  if (!preferred) {
    return candidates;
  }

  return [
    preferred,
    ...candidates.filter((candidate) => {
      return candidate.userCode !== preferred.userCode || candidate.password !== preferred.password;
    }),
  ];
}

export async function selectSellerRole(page: Page): Promise<void> {
  const sellerButton = page.getByRole('button', { name: /فروشنده/ }).first();
  if (await sellerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sellerButton.click();
  }

  const userCodeTab = page.getByRole('button', { name: /ورود با کد کاربری/ }).first();
  if (await userCodeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await userCodeTab.click();
  }
}

export async function openUserCodeLoginForm(page: Page): Promise<{
  userCodeInput: ReturnType<Page['locator']>;
  passwordInput: ReturnType<Page['locator']>;
}> {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  await selectSellerRole(page);

  const userCodeInput = page
    .locator('input[name="userCode"], input[placeholder*="0100001"], input[autocomplete="username"]')
    .first();
  const passwordInput = page
    .locator('input[type="password"], input[name="password"], input[autocomplete="current-password"]')
    .first();

  await expect(userCodeInput).toBeVisible({ timeout: 15000 });
  await expect(passwordInput).toBeVisible({ timeout: 10000 });

  return { userCodeInput, passwordInput };
}

async function waitUntilLoggedIn(page: Page, options: Required<Pick<LoginOptions, 'allowAdmin' | 'requireAdmin' | 'timeoutMs'>>): Promise<boolean> {
  return page
    .waitForFunction(
      ({ allowAdmin, requireAdmin }) => {
        const path = new URL(window.location.href).pathname;
        if (path.startsWith('/auth/')) {
          return false;
        }

        const authRaw = window.localStorage.getItem('trade-association-auth');
        if (!authRaw) {
          return false;
        }

        try {
          const parsed = JSON.parse(authRaw) as any;
          const state = parsed?.state ?? parsed;
          const user = state?.user ?? parsed?.user;
          const isAuthenticated = state?.isAuthenticated ?? parsed?.isAuthenticated;

          const hasSession = Boolean(isAuthenticated === true || user || state?.accessToken || parsed?.accessToken);
          if (!hasSession) {
            return false;
          }

          if (requireAdmin) {
            return Boolean(user?.isAdmin === true);
          }

          if (!allowAdmin && path.startsWith('/admin')) {
            return false;
          }

          return true;
        } catch {
          return authRaw.length > 20;
        }
      },
      {
        allowAdmin: options.allowAdmin,
        requireAdmin: options.requireAdmin,
      },
      { timeout: options.timeoutMs },
    )
    .then(() => true)
    .catch(() => false);
}

export async function loginWithCandidates(
  page: Page,
  candidates: LoginCandidate[],
  options: LoginOptions = {},
): Promise<LoginCandidate> {
  const allowAdmin = options.allowAdmin ?? false;
  const requireAdmin = options.requireAdmin ?? false;
  const timeoutMs = options.timeoutMs ?? 6000;
  const cacheKey = options.cacheKey ?? 'seed';

  const preparedCandidates = orderByPreferred(cacheKey, uniqueCandidates(candidates));
  if (preparedCandidates.length === 0) {
    throw new Error('No login candidates provided');
  }

  let lastPath = '/auth/login';

  for (const candidate of preparedCandidates) {
    const { userCodeInput, passwordInput } = await openUserCodeLoginForm(page);

    await userCodeInput.fill(candidate.userCode);
    await passwordInput.fill(candidate.password);
    await page.getByRole('button', { name: 'ورود', exact: true }).first().click();

    const loggedIn = await waitUntilLoggedIn(page, { allowAdmin, requireAdmin, timeoutMs });
    lastPath = new URL(page.url()).pathname;

    if (loggedIn) {
      preferredCandidates.set(cacheKey, candidate);
      return candidate;
    }
  }

  throw new Error(
    `Login failed for candidates: ${preparedCandidates.map((c) => c.userCode).join(', ')} | lastPath=${lastPath}`,
  );
}

export async function loginAsSeedUser(page: Page): Promise<LoginCandidate> {
  return loginWithCandidates(page, getSeedLoginCandidates(), {
    allowAdmin: false,
    requireAdmin: false,
    timeoutMs: 6000,
    cacheKey: 'seed',
  });
}

export async function loginAsAdmin(page: Page): Promise<LoginCandidate> {
  return loginWithCandidates(page, getAdminLoginCandidates(), {
    allowAdmin: true,
    requireAdmin: true,
    timeoutMs: 7000,
    cacheKey: 'admin',
  });
}

export async function navigateSpa(
  page: Page,
  targetPath: string,
  expected: string | RegExp = targetPath,
  timeoutMs = 10000,
): Promise<void> {
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);

  if (expected instanceof RegExp) {
    await page.waitForURL(expected, { timeout: timeoutMs });
    return;
  }

  await page.waitForURL((url) => {
    return url.pathname === expected || url.pathname === `${expected}/`;
  }, { timeout: timeoutMs });
}
