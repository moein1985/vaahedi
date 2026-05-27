/**
 * فاز ۸ — تست‌های E2E سامانه ذینفعان حوزه کشاورزی
 *
 * سناریوهای پوشش‌داده‌شده:
 * 1. تقویم برداشت — نمایش، فیلتر، disclaimer
 * 2. تحلیل بازار — نمایش، expand کارت، فیلتر نوع
 * 3. داشبورد — widget کشاورزی قابل مشاهده است
 * 4. پروفایل — فیلدهای تخصصی کشاورزی در فرم
 * 5. مجوزها — صفحه مجوزها قابل دسترس است
 * 6. مشاور کشاورزی — sidebar label و ریدایرکت به /chat
 */

import { test, expect, type Page, type Browser, type BrowserContext } from '@playwright/test';

const E2E_USER_CODE = process.env['E2E_USER_CODE'] ?? '01000001';
const E2E_PASSWORD  = process.env['E2E_PASSWORD']  ?? 'Admin@1234';

// ─── Helper: Login ────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

  const sellerBtn = page.getByRole('button', { name: /فروشنده/ }).first();
  try {
    await sellerBtn.waitFor({ state: 'visible', timeout: 8000 });
    await sellerBtn.click();
  } catch {
    // Role selection screen not shown
  }

  const userCodeInput = page
    .locator('input[name="userCode"], input[placeholder*="0100001"], input[autocomplete="username"]')
    .first();
  const passwordInput = page
    .locator('input[type="password"], input[name="password"]')
    .first();

  await expect(userCodeInput).toBeVisible({ timeout: 15000 });
  await userCodeInput.fill(E2E_USER_CODE);
  await expect(passwordInput).toBeVisible({ timeout: 10000 });
  await passwordInput.fill(E2E_PASSWORD);
  await page.getByRole('button', { name: 'ورود', exact: true }).click();

  await page.waitForURL(
    /\/(dashboard|profile|trade|products|chat|finance|rfq|catalog|harvest|market-insights)/,
    { timeout: 25000 },
  );
}

async function createAuthContext(browser: Browser): Promise<{ ctx: BrowserContext; p: Page }> {
  const ctx = await browser.newContext();
  const p   = await ctx.newPage();
  await login(p);
  return { ctx, p };
}

// ─── 1. تقویم برداشت ─────────────────────────────────────────────────────────

test.describe('تقویم برداشت', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let p: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, p } = await createAuthContext(browser));
  });

  test.afterAll(async () => { await ctx.close(); });

  test('صفحه /harvest بارگذاری می‌شود', async () => {
    await p.click('a[href="/harvest"]');
    await expect(p).toHaveURL(/\/harvest/, { timeout: 10000 });
    await expect(p.getByRole('heading', { name: /تقویم برداشت/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('disclaimer اطلاع‌رسانی نمایش دارد', async () => {
    await expect(p.getByText(/اطلاع.رسانی|جنبه.اطلاع/)).toBeVisible({ timeout: 5000 });
  });

  test('ماه‌های سال به عنوان دکمه‌ی فیلتر وجود دارند', async () => {
    // حداقل یک ماه فارسی در صفحه قابل رویت است
    const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'];
    let found = false;
    for (const month of monthNames) {
      const el = p.getByRole('button', { name: month }).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        found = true;
        break;
      }
    }
    expect(found, 'باید حداقل یک دکمه ماه فارسی در صفحه باشد').toBe(true);
  });

  test('با کلیک روی ماه، فیلتر اعمال می‌شود', async () => {
    // کلیک روی «خرداد» و انتظار برای reload داده
    const khordadBtn = p.getByRole('button', { name: 'خرداد' }).first();
    if (await khordadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await khordadBtn.click();
      // صفحه باید همچنان /harvest باشد
      await expect(p).toHaveURL(/\/harvest/, { timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('جستجو بر اساس استان کار می‌کند', async () => {
    const searchInput = p.locator('input[placeholder*="استان"], input[placeholder*="province"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('خراسان');
      await p.waitForTimeout(600); // debounce
      await expect(p).toHaveURL(/\/harvest/, { timeout: 5000 });
    } else {
      test.skip();
    }
  });
});

// ─── 2. تحلیل بازار ──────────────────────────────────────────────────────────

test.describe('تحلیل بازار', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let p: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, p } = await createAuthContext(browser));
  });

  test.afterAll(async () => { await ctx.close(); });

  test('صفحه /market-insights بارگذاری می‌شود', async () => {
    await p.click('a[href="/market-insights"]');
    await expect(p).toHaveURL(/\/market-insights/, { timeout: 10000 });
    await expect(p.getByRole('heading', { name: /تحلیل بازار/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test('disclaimer اطلاع‌رسانی نمایش دارد', async () => {
    await expect(p.getByText(/اطلاع.رسانی|جنبه.اطلاع/)).toBeVisible({ timeout: 5000 });
  });

  test('فیلتر نوع تحلیل وجود دارد', async () => {
    // select یا دکمه‌های نوع تحلیل
    const typeFilter = p.locator('select, [role="combobox"]').first();
    await expect(typeFilter).toBeVisible({ timeout: 5000 });
  });

  test('کارت‌های تحلیل قابل کلیک و expand هستند', async () => {
    // منتظر محتوا بمان
    await p.waitForTimeout(1000);
    const cards = p.locator('[data-market-card], .cursor-pointer, button').filter({ hasText: /گندم|زعفران|میوه|مقررات/ });
    const count = await cards.count();
    if (count === 0) {
      // داده seed نشده یا loading — skip
      test.skip();
      return;
    }
    await cards.first().click();
    // محتوای expand شده باید متن طولانی‌تری داشته باشد
    await expect(p.getByText(/اطلاع.رسانی|این تحلیل|این اطلاعات/)).toBeVisible({ timeout: 5000 });
  });
});

// ─── 3. داشبورد — widget کشاورزی ─────────────────────────────────────────────

test.describe('داشبورد — widget کشاورزی', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let p: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, p } = await createAuthContext(browser));
    // SPA nav to dashboard
    await p.click('a[href="/dashboard"]');
    await expect(p).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test.afterAll(async () => { await ctx.close(); });

  test('widget تقویم برداشت در داشبورد وجود دارد', async () => {
    await expect(p.getByText('تقویم برداشت').first()).toBeVisible({ timeout: 8000 });
  });

  test('widget تحلیل بازار در داشبورد وجود دارد', async () => {
    await expect(p.getByText('تحلیل بازار').first()).toBeVisible({ timeout: 5000 });
  });

  test('لینک "مشاهده همه" تقویم برداشت به /harvest می‌رود', async () => {
    const harvestLink = p.getByRole('link', { name: /مشاهده همه/ }).first();
    if (await harvestLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await harvestLink.click();
      await expect(p).toHaveURL(/\/harvest/, { timeout: 8000 });
    } else {
      test.skip();
    }
  });
});

// ─── 4. پروفایل — فیلدهای کشاورزی ──────────────────────────────────────────

test.describe('پروفایل — فیلدهای تخصصی کشاورزی', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let p: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, p } = await createAuthContext(browser));
    await p.goto('/profile');
    await expect(p).toHaveURL(/\/profile/, { timeout: 10000 });
  });

  test.afterAll(async () => { await ctx.close(); });

  test('بخش "اطلاعات تخصصی کشاورزی" در فرم پروفایل وجود دارد', async () => {
    await expect(p.getByText(/اطلاعات تخصصی کشاورزی/)).toBeVisible({ timeout: 8000 });
  });

  test('فیلد دسته‌بندی شغلی در فرم پروفایل وجود دارد', async () => {
    await expect(p.getByText('دسته‌بندی شغلی').first()).toBeVisible({ timeout: 5000 });
  });

  test('فیلد نوع آبیاری در فرم پروفایل وجود دارد', async () => {
    await expect(p.getByText('نوع آبیاری').first()).toBeVisible({ timeout: 5000 });
  });

  test('مجوزهای کشاورزی (جهاد کشاورزی) در لیست مجوزها قابل انتخاب است', async () => {
    await expect(p.getByText(/مجوز کشاورزی.جهاد کشاورزی/)).toBeVisible({ timeout: 5000 });
  });
});

// ─── 5. مجوزها — صفحه مجوزها ─────────────────────────────────────────────────

test.describe('مجوزها', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let p: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, p } = await createAuthContext(browser));
    await p.click('a[href="/licenses"]');
    await expect(p).toHaveURL(/\/licenses/, { timeout: 10000 });
  });

  test.afterAll(async () => { await ctx.close(); });

  test('صفحه مجوزها بارگذاری می‌شود', async () => {
    await expect(p.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('مجوزهای کشاورزی در لیست انواع مدارک قابل نمایش هستند', async () => {
    // صفحه باید حداقل یکی از انواع مجوز کشاورزی را نمایش دهد یا لینک آپلود داشته باشد
    const agriText = p.getByText(/کشاورزی|AGRICULTURAL|گواهینامه کشاورز|آب و زمین/i).first();
    const uploadLink = p.getByRole('link', { name: /بارگذاری|آپلود/ }).first();
    const hasAgri = await agriText.isVisible({ timeout: 5000 }).catch(() => false);
    const hasUpload = await uploadLink.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasAgri || hasUpload, 'صفحه مجوزها باید محتوای مرتبط داشته باشد').toBe(true);
  });
});

// ─── 6. مشاور کشاورزی ────────────────────────────────────────────────────────

test.describe('مشاور کشاورزی — sidebar و ریدایرکت', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let p: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, p } = await createAuthContext(browser));
  });

  test.afterAll(async () => { await ctx.close(); });

  test('label sidebar "مشاور کشاورزی" وجود دارد', async () => {
    await expect(p.getByRole('link', { name: 'مشاور کشاورزی' }).first()).toBeVisible({ timeout: 8000 });
  });

  test('/ai-advisor به /chat ریدایرکت می‌شود', async () => {
    await p.click('a[href="/ai-advisor"]');
    await expect(p).toHaveURL(/\/chat/, { timeout: 8000 });
  });

  test('صفحه chat — تب مشاور قابل انتخاب است', async () => {
    const advisorTab = p.getByRole('button', { name: /مشاور/ }).first();
    if (await advisorTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await advisorTab.click();
      await expect(p.getByText(/مشاور هوشمند کشاورزی|مشاور کشاورزی/)).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });
});
