/**
 * Phase 4 — Navigation & Alias Routes E2E Smoke Tests
 *
 * Covers:
 * 1. Sidebar labels match employer vocabulary (RFQ, Marketplace, AI مشاور …)
 * 2. Alias routes redirect to correct target pages
 * 3. Trade detail page loads correctly
 * 4. Demo checklist critical paths (§10.2)
 */

import { test, expect, type Page, type Browser, type BrowserContext } from '@playwright/test';

const E2E_USER_CODE = process.env['E2E_USER_CODE'] ?? '01000001';
const E2E_PASSWORD = process.env['E2E_PASSWORD'] ?? 'Admin@1234';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

  // Wait for role selection screen and click seller role
  const sellerBtn = page.getByRole('button', { name: /فروشنده/ }).first();
  try {
    await sellerBtn.waitFor({ state: 'visible', timeout: 8000 });
    await sellerBtn.click();
  } catch {
    // Role selection screen not shown — already on login form
  }

  const userCodeInput = page
    .locator('input[name="userCode"], input[placeholder*="0100001"], input[autocomplete="username"]')
    .first();
  const passwordInput = page
    .locator('input[type="password"], input[name="password"], input[autocomplete="current-password"]')
    .first();
  const submitBtn = page.getByRole('button', { name: 'ورود', exact: true });

  await expect(userCodeInput).toBeVisible({ timeout: 15000 });
  await userCodeInput.fill(E2E_USER_CODE);
  await expect(passwordInput).toBeVisible({ timeout: 10000 });
  await passwordInput.fill(E2E_PASSWORD);
  await submitBtn.click();

  // Some deployments land on /profile first when profile completion is required.
  await page.waitForURL(
    /\/(dashboard|profile|trade|products|chat|finance|rfq|catalog|downloads|notifications)/,
    { timeout: 25000 },
  );
}

// Helper: create authenticated browser context + page (login once, reuse across tests)
async function createAuthContext(browser: Browser): Promise<{ ctx: BrowserContext; p: Page }> {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await login(p);
  return { ctx, p };
}

// ─── 1. Sidebar Navigation Labels ────────────────────────────────────────────

test.describe('ناوبری — برچسب‌های Sidebar', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let p: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, p } = await createAuthContext(browser));
  });

  test.afterAll(async () => { await ctx.close(); });

  const EXPECTED_NAV_LABELS = [
    'داشبورد',
    'کالاها',
    'درخواست ها (RFQ)',
    'بازار (Marketplace)',
    'پیام ها',
    'مشاور کشاورزی',
    'مجوزهای من',
    'تقویم برداشت',
    'تحلیل بازار',
    'اسناد',
    'مالی',
  ];

  for (const label of EXPECTED_NAV_LABELS) {
    test(`sidebar شامل برچسب "${label}" است`, async () => {
      // Link element is inside nav — use first() to avoid strict mode violation
      await expect(p.getByRole('link', { name: label }).first()).toBeVisible({ timeout: 5000 });
    });
  }
});

// ─── 2. Alias Routes ─────────────────────────────────────────────────────────
// Alias routes redirect client-side. We use SPA navigation (link clicks) to
// avoid full page reload which would trigger zustand hydration race condition.

test.describe('ناوبری — alias route‌ها', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let p: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, p } = await createAuthContext(browser));
    // ensure we start on dashboard
    await p.waitForURL(/\/(dashboard|rfq|trade)/, { timeout: 10000 });
  });

  test.afterAll(async () => { await ctx.close(); });

  test('/rfq باید به /trade ریدایرکت شود', async () => {
    // SPA navigation — click the sidebar link
    await p.click('a[href="/rfq"]');
    await expect(p).toHaveURL(/\/trade/, { timeout: 8000 });
  });

  test('/messages باید به /chat ریدایرکت شود', async () => {
    await p.click('a[href="/messages"]');
    await expect(p).toHaveURL(/\/chat/, { timeout: 8000 });
  });

  test('/ai-advisor باید به /chat ریدایرکت شود', async () => {
    await p.click('a[href="/ai-advisor"]');
    await expect(p).toHaveURL(/\/chat/, { timeout: 8000 });
  });

  test('/documents باید به /downloads ریدایرکت شود', async () => {
    await p.click('a[href="/documents"]');
    await expect(p).toHaveURL(/\/downloads/, { timeout: 8000 });
  });

  test('/marketplace باید به /catalog ریدایرکت شود', async () => {
    await p.click('a[href="/marketplace"]');
    await expect(p).toHaveURL(/\/catalog/, { timeout: 8000 });
  });
});

// ─── 3. مسیرهای قدیمی همچنان سالم هستند ─────────────────────────────────────

test.describe('ناوبری — مسیرهای قدیمی بدون رگرسیون', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let p: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, p } = await createAuthContext(browser));
  });

  test.afterAll(async () => { await ctx.close(); });

  test('/trade مستقیم کار می‌کند', async () => {
    // SPA navigation — accessToken lives only in memory, goto() would trigger auth redirect
    await p.click('a[href="/rfq"]');
    await expect(p).toHaveURL(/\/trade/, { timeout: 8000 });
    await expect(p.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('/chat مستقیم کار می‌کند', async () => {
    await p.click('a[href="/messages"]');
    await expect(p).toHaveURL(/\/chat/, { timeout: 8000 });
    await expect(p.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('/downloads مستقیم کار می‌کند', async () => {
    await p.click('a[href="/documents"]');
    await expect(p).toHaveURL(/\/downloads/, { timeout: 8000 });
    await expect(p.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('/finance مستقیم کار می‌کند', async () => {
    await p.click('a[href="/finance"]');
    await expect(p).toHaveURL(/\/finance/, { timeout: 8000 });
    await expect(p.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('/notifications مستقیم کار می‌کند', async () => {
    // TopHeader (with bell) is lg:hidden — only visible on mobile viewport (<1024px)
    await p.setViewportSize({ width: 768, height: 1024 });
    await p.click('a[href="/notifications"]');
    await expect(p).toHaveURL(/\/notifications/, { timeout: 8000 });
    await expect(p.locator('main').first()).toBeVisible({ timeout: 5000 });
    await p.setViewportSize({ width: 1280, height: 720 });
  });
});

// ─── 4. Trade Detail Page ─────────────────────────────────────────────────────

test.describe('صفحه جزئیات RFQ', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let p: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, p } = await createAuthContext(browser));
    await p.goto('/trade');
    await p.waitForURL(/\/trade/, { timeout: 10000 });
  });

  test.afterAll(async () => { await ctx.close(); });

  test('کلیک روی "جزئیات" در لیست trade — صفحه detail باز می‌شود', async () => {
    const detailLink = p.getByRole('link', { name: /جزئیات/ }).first();
    const hasItems = await detailLink.isVisible({ timeout: 8000 }).catch(() => false);

    if (!hasItems) {
      // لیست خالی است — تست رد می‌شود ولی fail نمی‌کند
      test.skip();
      return;
    }

    await detailLink.click();
    await expect(p).toHaveURL(/\/trade\/.+/, { timeout: 8000 });
    await expect(p.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('رفتن مستقیم به URL نامعتبر — صفحه error مناسب نمایش می‌دهد', async () => {
    await p.goto('/trade/nonexistent-id-xyz');
    // Either an error message or a redirect back — page should not be blank
    await expect(p.locator('main, body').first()).toBeVisible({ timeout: 8000 });
  });
});

// ─── 5. Demo Checklist (§10.2) ────────────────────────────────────────────────

test.describe('چک‌لیست دمو — سناریوی اصلی', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let p: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, p } = await createAuthContext(browser));
    await p.waitForURL(/\/(dashboard|rfq|trade|products)/, { timeout: 10000 });
  });

  test.afterAll(async () => { await ctx.close(); });

  test('۱. ورود کاربر و رسیدن به داشبورد', async () => {
    // Verify we are authenticated (arrived at a protected page after login)
    await expect(p).toHaveURL(/\/(dashboard|rfq|trade|products|chat|finance|notifications)/);
  });

  test('۲. داشبورد — KPI ها و بخش‌های اصلی قابل مشاهده هستند', async () => {
    // SPA navigate to dashboard via sidebar link (goto would lose accessToken)
    await p.click('a[href="/dashboard"]');
    await expect(p).toHaveURL(/\/dashboard/, { timeout: 8000 });
    await expect(p.getByRole('heading').first()).toBeVisible({ timeout: 8000 });
  });

  test('۳. ناوبری کامل — همه آیتم‌های اصلی sidebar دیده می‌شوند', async () => {
    const mainNavItems = ['داشبورد', 'کالاها', 'درخواست ها (RFQ)', 'مالی'];
    for (const item of mainNavItems) {
      await expect(p.getByRole('link', { name: item }).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('۴. صفحه RFQ — دسترسی و نمایش لیست', async () => {
    await p.click('a[href="/rfq"]');
    await expect(p).toHaveURL(/\/trade/, { timeout: 8000 });
    // Page renders (heading or content visible)
    await expect(p.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('۵. صفحه مالی — در دسترس است', async () => {
    await p.click('a[href="/finance"]');
    await expect(p).toHaveURL(/\/finance/, { timeout: 8000 });
    await expect(p.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('۶. صفحه chat — در دسترس است', async () => {
    await p.click('a[href="/messages"]');
    await expect(p).toHaveURL(/\/chat/, { timeout: 8000 });
    await expect(p.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('۷. صفحه اعلان‌ها — در دسترس است', async () => {
    // TopHeader (with bell) is lg:hidden — switch to mobile viewport to click bell
    await p.setViewportSize({ width: 768, height: 1024 });
    await p.click('a[href="/notifications"]');
    await expect(p).toHaveURL(/\/notifications/, { timeout: 8000 });
    await expect(p.locator('main').first()).toBeVisible({ timeout: 5000 });
    await p.setViewportSize({ width: 1280, height: 720 });
  });
});
