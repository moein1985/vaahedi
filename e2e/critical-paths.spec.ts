import { test, expect, type Page, type Request } from '@playwright/test';

const SEED_USER = {
  userCode: '0000001',
  password: 'Admin@1234',
};

const PRODUCT_BASE = {
  nameEn: 'CriticalPathProduct',
  hsCode: '3906100000',
  technicalSpecs: 'مشخصات فنی تستی برای مسیر بحرانی ثبت محصول',
  minOrderQuantity: '100',
  preparationTimeDays: '7',
  deliveryLocation: 'تهران',
};

async function selectSellerRole(page: Page) {
  const sellerButton = page.getByRole('button', { name: /فروشنده/ }).first();
  await expect(sellerButton).toBeVisible({ timeout: 10000 });
  await sellerButton.click();
}

async function loginAsSeedUser(page: Page) {
  await page.goto('/auth/login');
  await selectSellerRole(page);
  await expect(page.getByPlaceholder('مثال: 0100001')).toBeVisible({ timeout: 10000 });
  await page.getByPlaceholder('مثال: 0100001').fill(SEED_USER.userCode);
  await page.locator('input[type="password"]').first().fill(SEED_USER.password);
  await page.getByRole('button', { name: 'ورود', exact: true }).click();

  await page.waitForURL(/\/dashboard|\/profile/, { timeout: 15000 });
}

async function fillProductFormUntilStep3(page: Page, nameSuffix: string) {
  await page.goto('/products/new');
  await expect(page.getByRole('heading', { name: 'ثبت محصول جدید' })).toBeVisible();

  // Step 1
  await page.locator('input[name="nameFa"]').fill(`محصول بحرانی ${nameSuffix}`);
  await page.locator('input[name="nameEn"]').fill(`${PRODUCT_BASE.nameEn}-${nameSuffix}`);
  await page.locator('select[name="commodityGroup"]').selectOption('INDUSTRIAL');
  await page.locator('select[name="origin"]').selectOption('DOMESTIC_FACTORY');
  await page.locator('input[name="hsCode"]').fill(PRODUCT_BASE.hsCode);
  await page.locator('textarea[name="technicalSpecs"]').fill(PRODUCT_BASE.technicalSpecs);

  await page.getByRole('button', { name: 'مرحله بعد' }).click();

  // Step 2
  await page.locator('input[name="minOrderQuantity"]').fill(PRODUCT_BASE.minOrderQuantity);
  await page.locator('input[name="preparationTimeDays"]').fill(PRODUCT_BASE.preparationTimeDays);
  await page.locator('select[name="deliveryTerms"]').selectOption('FOB');
  await page.locator('input[name="deliveryLocation"]').fill(PRODUCT_BASE.deliveryLocation);
  await page.locator('select[name="paymentMethod"]').selectOption('TT');
  await page.locator('input[name="saleConditions.advancePercent"]').fill('30');
  await page.locator('input[name="saleConditions.onDeliveryPercent"]').fill('70');

  await page.getByRole('button', { name: 'مرحله بعد' }).click();
  await expect(page.getByRole('heading', { name: 'مشخصات فیزیکی و جزئیات' })).toBeVisible({ timeout: 10000 });
}

async function fillDateTimeInput(page: Page, fieldName: 'productionDate' | 'expiryDate', value: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const input = page.locator(`input[name="${fieldName}"]`);
    await expect(input).toBeVisible({ timeout: 10000 });

    try {
      await input.fill(value, { timeout: 5000 });
      return;
    } catch (error) {
      const isLastAttempt = attempt === 2;
      if (isLastAttempt) {
        throw error;
      }
    }
  }
}

function isProductCreateRequest(request: Request): boolean {
  if (request.method() !== 'POST') {
    return false;
  }

  const url = request.url();
  if (!url.includes('/trpc')) {
    return false;
  }

  if (url.includes('/trpc/product.create')) {
    return true;
  }

  const postData = request.postData() ?? '';
  return postData.includes('product.create');
}

async function createProductAndGoToUploadStep(page: Page, nameSuffix: string) {
  await fillProductFormUntilStep3(page, nameSuffix);

  const createResponsePromise = page.waitForResponse((response) => {
    return isProductCreateRequest(response.request());
  }, { timeout: 15000 });

  await page.getByRole('button', { name: 'ثبت محصول' }).click();
  const createResponse = await createResponsePromise;
  const createResponseBody = await createResponse.text();

  const uploadButton = page.getByRole('button', { name: /انتخاب تصاویر/ });
  try {
    await expect(uploadButton).toBeVisible({ timeout: 15000 });
  } catch {
    const visibleErrorText = await page
      .locator('.field-error, .text-red-600, .text-red-700')
      .first()
      .textContent()
      .catch(() => null);

    throw new Error(
      [
        'Upload step did not appear after product.create.',
        `Current page URL: ${page.url()}`,
        `HTTP ${createResponse.status()} ${createResponse.url()}`,
        `Response body: ${createResponseBody}`,
        `Visible UI error: ${visibleErrorText ?? 'none'}`,
      ].join('\n'),
    );
  }
}

test.describe('Critical User Journeys', () => {
  test('Auth: Seed user can login with userCode', async ({ page }) => {
    await loginAsSeedUser(page);
    await expect(page.getByRole('heading', { name: /داشبورد|پروفایل/ })).toBeVisible();
  });

  test('Auth: Shows error on wrong password', async ({ page }) => {
    await page.goto('/auth/login');
    await selectSellerRole(page);

    await expect(page.getByPlaceholder('مثال: 0100001')).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder('مثال: 0100001').fill(SEED_USER.userCode);
    await page.locator('input[type="password"]').first().fill('WrongPassword123!');
    await page.getByRole('button', { name: 'ورود', exact: true }).click();

    await expect(page.getByText(/برای ادامه باید وارد حساب شوید|کد کاربری یا رمز عبور اشتباه است/)).toBeVisible({ timeout: 10000 });
  });

  test('Profile: Blocks save when selected required document is not uploaded', async ({ page }) => {
    await loginAsSeedUser(page);
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'پروفایل کاربری' })).toBeVisible();

    await page.locator('input[name="companyName"]').fill('شرکت تست مسیر بحرانی');
    await page.locator('input[name="phone"]').fill('02112345678');
    await page.locator('input[name="address.province"]').fill('تهران');
    await page.locator('input[name="address.city"]').fill('تهران');
    await page.locator('textarea[name="address.addressLine"]').fill('خیابان تست، کوچه تست، پلاک ۱۲');
    await page.locator('input[name="address.postalCode"]').fill('1234567890');

    await page.getByRole('checkbox', { name: 'آگهی تأسیس' }).check();
    await page.getByRole('button', { name: 'ذخیره تغییرات' }).click();

    await expect(page.getByText(/ابتدا فایل مربوط به/).first()).toBeVisible({ timeout: 10000 });
  });

  test('Profile: Blocks save when identity/passport document is selected but not uploaded', async ({ page }) => {
    await loginAsSeedUser(page);
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'پروفایل کاربری' })).toBeVisible();

    await page.locator('input[name="companyName"]').fill('شرکت تست پاسپورت');
    await page.locator('input[name="phone"]').fill('02112345678');
    await page.locator('input[name="address.province"]').fill('تهران');
    await page.locator('input[name="address.city"]').fill('تهران');
    await page.locator('textarea[name="address.addressLine"]').fill('خیابان تست پاسپورت، کوچه نمونه، پلاک ۱۰');
    await page.locator('input[name="address.postalCode"]').fill('1234567890');

    await page.getByRole('checkbox', { name: /مدرک هویتی|مدرک شناسایی|پاسپورت/ }).check();
    await page.getByRole('button', { name: 'ذخیره تغییرات' }).click();

    await expect(page.getByText(/ابتدا فایل مربوط به/).first()).toBeVisible({ timeout: 10000 });
  });

  test('Product: Reject invalid date range (expiry before production)', async ({ page }) => {
    await loginAsSeedUser(page);
    await fillProductFormUntilStep3(page, `${Date.now()}`);

    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const fmt = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}T10:00`;
    };

    await fillDateTimeInput(page, 'productionDate', fmt(tomorrow));
    await fillDateTimeInput(page, 'expiryDate', fmt(today));

    let productCreateCalls = 0;
    const requestListener = (request: Request) => {
      if (isProductCreateRequest(request)) {
        productCreateCalls += 1;
      }
    };
    page.on('request', requestListener);

    await page.getByRole('button', { name: 'ثبت محصول' }).click();
    await expect(page.getByText('تاریخ انقضا باید بعد از تاریخ تولید باشد')).toBeVisible({ timeout: 10000 });
    page.off('request', requestListener);

    expect(productCreateCalls).toBe(0);
  });

  test('RFQ: Create request with clarity fields', async ({ page }) => {
    await loginAsSeedUser(page);
    await page.goto('/trade');

    const tradeName = `فولاد تست بحرانی ${Date.now()}`;

    await page.getByRole('button', { name: /RFQ جدید|درخواست جدید/ }).click();
    await expect(page.getByText(/ثبت RFQ جدید|درخواست تجاری جدید/)).toBeVisible();

    await page.locator('input[name="productNameFa"]').fill(tradeName);
    await page.locator('input[name="serviceCode"]').fill('SRV-CRIT-01');
    await page.locator('select[name="supplySourceType"]').selectOption('COMPANY');
    await page.locator('input[name="supplySourceName"]').fill('شرکت تستی بحرانی');
    await page.locator('input[name="quantity"]').fill('100');
    await page.locator('select[name="quantityUnit"]').selectOption('TON');

    await page.getByRole('button', { name: /ثبت درخواست/ }).click();

    await expect(page.getByText(/ثبت RFQ جدید|درخواست تجاری جدید/)).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(tradeName)).toBeVisible({ timeout: 10000 });
  });

  test('Chat: AI advisor alias opens advisor mode', async ({ page }) => {
    await loginAsSeedUser(page);
    await page.goto('/ai-advisor');

    await page.waitForURL(/\/chat/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'AI مشاور بازرگانی' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'دریافت پیشنهاد' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder(/برای افزایش نرخ پاسخ به RFQ های من چه کاری انجام دهم/)).toBeVisible({ timeout: 10000 });
  });

  test('Chat: Messages alias opens messages mode', async ({ page }) => {
    await loginAsSeedUser(page);
    await page.goto('/messages');

    await page.waitForURL(/\/chat/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'مرکز ارتباطات' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'پیام ها' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('یک مکالمه انتخاب کنید')).toBeVisible({ timeout: 10000 });
  });

  test('Upload: Reject files with invalid MIME types', async ({ page }) => {
    await loginAsSeedUser(page);
    await createProductAndGoToUploadStep(page, `mime-${Date.now()}`);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'malware.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('MZ'),
    });

    await expect(page.getByText(/فرمت فایل .* مجاز نیست|فقط تصویر، ویدیو یا PDF/)).toBeVisible({ timeout: 10000 });
  });

  test('Upload: Accept valid PDF files', async ({ page }) => {
    await loginAsSeedUser(page);
    await createProductAndGoToUploadStep(page, `pdf-${Date.now()}`);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'catalog.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'),
    });

    await expect(page.getByText('catalog.pdf')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('✅')).toBeVisible({ timeout: 10000 });
  });

  test('Upload: Reject oversized files', async ({ page }) => {
    await loginAsSeedUser(page);
    await createProductAndGoToUploadStep(page, `size-${Date.now()}`);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'oversize.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(26 * 1024 * 1024, 0),
    });

    await expect(page.getByText(/حجم فایل .* بیشتر از ۲۵ مگابایت است|حجم فایل بیشتر از حد مجاز|حداکثر ۲۵ مگابایت/)).toBeVisible({ timeout: 10000 });
  });
});
