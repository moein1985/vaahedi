import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

const ADMIN_USER_CODES = Array.from(new Set([
  process.env['E2E_ADMIN_USER_CODE'],
  process.env['E2E_USER_CODE'],
  'admin',
  '01000001',
  '0000001',
].filter((v): v is string => !!v && v.trim().length > 0)));

const ADMIN_PASSWORDS = Array.from(new Set([
  process.env['E2E_ADMIN_PASSWORD'],
  process.env['E2E_PASSWORD'],
  'admin@12321#',
  'Admin@1234',
].filter((v): v is string => !!v && v.trim().length > 0)));

function uniqueToken(prefix: string): string {
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10).toString();
  return `${prefix}_${stamp}${rand}`;
}

async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

  const userCodeTab = page.getByRole('button', { name: /ورود با کد کاربری/ }).first();
  if (await userCodeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await userCodeTab.click();
  }

  const userCodeInput = page
    .locator('input[name="userCode"], input[placeholder*="0100001"], input[autocomplete="username"]')
    .first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

  await expect(userCodeInput).toBeVisible({ timeout: 15000 });
  await expect(passwordInput).toBeVisible({ timeout: 10000 });

  let loggedIn = false;
  for (const code of ADMIN_USER_CODES) {
    for (const password of ADMIN_PASSWORDS) {
      await userCodeInput.fill(code);
      await passwordInput.fill(password);
      await page.getByRole('button', { name: 'ورود', exact: true }).first().click();

      loggedIn = await page
        .waitForFunction(() => {
          const path = new URL(window.location.href).pathname;
          return path === '/admin' || path.startsWith('/admin/') || path === '/dashboard' || path.startsWith('/dashboard/');
        }, { timeout: 12000 })
        .then(() => true)
        .catch(() => false);

      if (loggedIn) break;
      await page.waitForTimeout(300);
    }
    if (loggedIn) break;
  }

  if (!loggedIn) {
    throw new Error(`Admin login failed for userCode candidates: ${ADMIN_USER_CODES.join(', ')}`);
  }
}

async function openAdminRoute(page: Page, href: string, requiredActionText: RegExp) {
  const navLink = page.locator(`a[href="${href}"]`).first();
  const canClickLink = await navLink.isVisible({ timeout: 2500 }).catch(() => false);

  if (canClickLink) {
    await navLink.click();
  } else {
    // Fallback to client-side navigation without full reload to keep in-memory access token.
    await page.evaluate((target) => {
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, href);
  }

  await page.waitForURL((url) => url.pathname === href || url.pathname === `${href}/`, { timeout: 10000 });
  await expect(page.getByRole('button', { name: requiredActionText })).toBeVisible({ timeout: 10000 });
}

async function createAuthContext(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await loginAsAdmin(page);
  return { ctx, page };
}

test.describe('ادمین کشاورزی - CRUD taxonomy/harvest/market', () => {
  test.describe.configure({ mode: 'serial' });

  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ({ ctx, page } = await createAuthContext(browser));
  });

  test.afterAll(async () => {
    if (ctx) {
      await ctx.close();
    }
  });

  test('CRUD taxonomy در پنل ادمین', async () => {
    const code = uniqueToken('E2E_TAX');
    const nameFa = `دسته تست ${code}`;
    const editedNameFa = `${nameFa} ویرایش`;

    await openAdminRoute(page, '/admin/taxonomy', /دسته جدید/);

    await page.getByRole('button', { name: /دسته جدید/ }).click();
    await page.getByPlaceholder('مثال: GRAIN_WHEAT').fill(code);
    await page.getByPlaceholder('مثال: غلات').fill(nameFa);
    await page.getByPlaceholder('Grains').fill(`E2E ${code}`);
    await page.getByRole('button', { name: 'ایجاد', exact: true }).click();

    const createdRow = page.locator('tr', { hasText: code }).first();
    await expect(createdRow).toBeVisible({ timeout: 15000 });

    await createdRow.locator('button[title="ویرایش دسته"], button[title="ویرایش زیر‌دسته"]').first().click();
    await page.getByPlaceholder('مثال: غلات').fill(editedNameFa);
    await page.getByRole('button', { name: /ذخیره تغییرات/ }).click();

    const editedRow = page.locator('tr', { hasText: code }).first();
    await expect(editedRow).toContainText(editedNameFa, { timeout: 15000 });

    await editedRow.locator('button[title="حذف دسته"], button[title="حذف زیر‌دسته"]').first().click();
    await page.getByRole('button', { name: 'حذف', exact: true }).click();

    await expect(page.locator('tr', { hasText: code })).toHaveCount(0, { timeout: 15000 });
  });

  test('CRUD harvest calendar در پنل ادمین', async () => {
    const cropNameFa = `محصول تست ${uniqueToken('HRV')}`;
    const cropNameEn = `Crop ${uniqueToken('EN')}`;
    const editedProvince = `استان ${uniqueToken('PV')}`;

    await openAdminRoute(page, '/admin/harvest', /محصول جدید/);

    await page.getByRole('button', { name: /محصول جدید/ }).click();
    await page.getByPlaceholder('مثال: گندم').fill(cropNameFa);
    await page.getByPlaceholder('Wheat').fill(cropNameEn);
    await page.locator('select[title="ماه شروع برداشت"]').selectOption('2');
    await page.locator('select[title="ماه پایان برداشت"]').selectOption('3');
    await page.getByPlaceholder('خراسان رضوی').fill('گیلان');
    await page.getByPlaceholder('سپاهان، پیشتاز...').fill('واریته تستی');
    await page.locator('textarea[title="توضیحات"]').fill('توضیحات تستی برای سناریوی CRUD ادمین');
    await page.getByRole('button', { name: 'ایجاد', exact: true }).click();

    const createdRow = page.locator('tr', { hasText: cropNameFa }).first();
    await expect(createdRow).toBeVisible({ timeout: 15000 });

    await createdRow.locator('button[title="ویرایش آیتم"]').click();
    await page.getByPlaceholder('خراسان رضوی').fill(editedProvince);
    await page.getByRole('button', { name: /ذخیره تغییرات/ }).click();

    const editedRow = page.locator('tr', { hasText: cropNameFa }).first();
    await expect(editedRow).toContainText(editedProvince, { timeout: 15000 });

    await editedRow.locator('button[title="حذف آیتم"]').click();
    await page.getByRole('button', { name: 'حذف', exact: true }).click();

    await expect(page.locator('tr', { hasText: cropNameFa })).toHaveCount(0, { timeout: 15000 });
  });

  test('CRUD market insight در پنل ادمین', async () => {
    const title = `تحلیل تست ${uniqueToken('MKT')}`;
    const editedTitle = `${title} ویرایش`;

    await openAdminRoute(page, '/admin/market', /تحلیل جدید/);

    await page.getByRole('button', { name: /تحلیل جدید/ }).click();
    await page.getByPlaceholder('تحلیل قیمت گندم در فصل پاییز').fill(title);
    await page.getByPlaceholder('گندم', { exact: true }).fill('گندم تستی');
    await page.getByPlaceholder('Wheat').fill('Test Wheat');
    await page.locator('select[title="نوع تحلیل"]').selectOption('trend');
    await page.locator('textarea[title="محتوا"]').fill('این یک تحلیل تستی بازار برای اعتبارسنجی سناریوی CRUD ادمین است.');
    await page.getByPlaceholder('https://...').fill('https://example.com');
    await page.getByPlaceholder('گندم, قیمت, پاییز').fill('تست, بازار');
    await page.getByRole('button', { name: 'ایجاد', exact: true }).click();

    const createdCard = page.locator('div', { hasText: title }).filter({ has: page.locator('button[title="ویرایش"]') }).first();
    await expect(createdCard).toBeVisible({ timeout: 15000 });

    await createdCard.locator('button[title="ویرایش"]').click();
    await page.getByPlaceholder('تحلیل قیمت گندم در فصل پاییز').fill(editedTitle);
    await page.getByRole('button', { name: /ذخیره تغییرات/ }).click();

    const editedCard = page.locator('div', { hasText: editedTitle }).filter({ has: page.locator('button[title="ویرایش"]') }).first();
    await expect(editedCard).toBeVisible({ timeout: 15000 });

    await editedCard.locator('button[title="حذف"]').click();
    await page.getByRole('button', { name: 'حذف', exact: true }).click();

    await expect(page.getByText(editedTitle)).toHaveCount(0, { timeout: 15000 });
  });
});
