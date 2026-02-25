# وظایف باقی‌مانده — پلتفرم تجارت متمرکز هوشمند ایرانیان

> **برای:** Grok AI  
> **تاریخ:** اسفند ۱۴۰۴  
> **وضعیت پروژه:** فازهای ۱ تا ۳ کاملاً تکمیل‌شده، بخش‌هایی از فاز ۴ و ۵ باقی مانده  
> **صفر خطای TypeScript** در هر دو `apps/server` و `apps/web`

---

## ساختار پروژه (Monorepo — npm workspaces + Turborepo)

```
vaahedi/
├── apps/
│   ├── web/          ← React 19 + Vite 6 + TanStack Router + Tailwind 4
│   └── server/       ← Fastify 5 + tRPC v11 + Prisma 6 + TypeScript (node16 module)
├── packages/
│   ├── shared/       ← enums, constants مشترک
│   └── db/           ← Prisma client + migrations
```

**نکته مهم برای TypeScript در `apps/server`:** module resolution روی `node16` است، پس **همه‌ی import های نسبی باید پسوند `.js` داشته باشند**، حتی اگر فایل `.ts` باشد:
```typescript
// ✅ درست
import { something } from './my-module.js';
// ❌ غلط
import { something } from './my-module';
```

---

## وظیفه ۱ — Captcha در صفحه ورود و ثبت‌نام (اولویت: P0)

### توضیح
در `project-specification.md` ورود و ثبت‌نام با Captcha اولویت P0 تعریف شده. فعلاً هیچ captcha‌ای وجود ندارد. از **hCaptcha** استفاده می‌کنیم (جایگزین مناسب برای ایران).

### فایل‌های مرتبط
- `apps/web/src/routes/auth/login.tsx` — صفحه ورود
- `apps/web/src/routes/auth/register.tsx` — صفحه ثبت‌نام
- `apps/server/src/interface/trpc/routers/auth.router.ts` — روتر احراز هویت

### مراحل اجرا

**گام ۱ — نصب پکیج**
```bash
# در پوشه apps/web
npm install @hcaptcha/react-hcaptcha
```

**گام ۲ — اضافه کردن Captcha component به صفحه ورود**

در `apps/web/src/routes/auth/login.tsx`، این کامپوننت را import و اضافه کنید:

```tsx
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useRef } from 'react';

// در داخل Component:
const captchaRef = useRef<HCaptcha>(null);
const [captchaToken, setCaptchaToken] = useState<string | null>(null);

// در JSX، قبل از دکمه ارسال:
<HCaptcha
  sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY ?? '10000000-ffff-ffff-ffff-000000000001'}
  onVerify={(token) => setCaptchaToken(token)}
  onExpire={() => setCaptchaToken(null)}
  ref={captchaRef}
  size="normal"
  languageOverride="fa"
/>

// در تابع onSubmit، قبل از ارسال فرم:
if (!captchaToken) {
  // نمایش خطا: لطفاً captcha را تأیید کنید
  return;
}
```

**گام ۳ — همان کار را برای صفحه ثبت‌نام انجام دهید**

**گام ۴ — اضافه کردن متغیر محیطی**

در `apps/web/.env.example`:
```
VITE_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
```

> **نکته:** کلید `10000000-ffff-ffff-ffff-000000000001` کلید تست hCaptcha است و همیشه موفق می‌شود. برای production باید کلید واقعی از hcaptcha.com گرفته شود.

---

## وظیفه ۲ — OTP پیامکی با Mock Service (آماده برای Swap)

### توضیح
کارفرما هنوز provider SMS را انتخاب نکرده. ما **Interface** و **UI** کامل را می‌سازیم و یک `MockSMSService` پیاده می‌کنیم. وقتی کارفرما provider را تأیید کرد، فقط یک کلاس عوض می‌شود.

### فایل‌های جدید که باید ساخته شوند

**فایل ۱ — Interface سرویس SMS**
مسیر: `apps/server/src/application/ports/ISMSService.ts`
```typescript
export interface ISMSService {
  sendOTP(mobile: string): Promise<{ ok: boolean; expiresAt: Date }>;
  verifyOTP(mobile: string, code: string): Promise<boolean>;
}
```

**فایل ۲ — Mock SMS Service**
مسیر: `apps/server/src/infrastructure/sms/mock-sms.service.ts`
```typescript
import type { ISMSService } from '../../application/ports/ISMSService.js';

// ذخیره موقت OTP در حافظه (برای تست)
const otpStore = new Map<string, { code: string; expiresAt: Date }>();

export class MockSMSService implements ISMSService {
  async sendOTP(mobile: string): Promise<{ ok: boolean; expiresAt: Date }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // ۵ دقیقه
    otpStore.set(mobile, { code, expiresAt });
    // در محیط dev کد را لاگ کن
    console.log(`[MockSMS] OTP for ${mobile}: ${code}`);
    return { ok: true, expiresAt };
  }

  async verifyOTP(mobile: string, code: string): Promise<boolean> {
    const entry = otpStore.get(mobile);
    if (!entry) return false;
    if (new Date() > entry.expiresAt) {
      otpStore.delete(mobile);
      return false;
    }
    if (entry.code !== code) return false;
    otpStore.delete(mobile);
    return true;
  }
}
```

**فایل ۳ — اضافه کردن endpoint های OTP به auth.router.ts**

فایل موجود: `apps/server/src/interface/trpc/routers/auth.router.ts`

دو mutation جدید اضافه کنید:

```typescript
// import در بالای فایل:
import { MockSMSService } from '../../../infrastructure/sms/mock-sms.service.js';

const smsService = new MockSMSService();

// در داخل authRouter، بعد از login:

sendOTP: publicProcedure
  .input(z.object({ mobile: z.string().regex(/^09\d{9}$/, 'شماره موبایل نامعتبر است') }))
  .mutation(async ({ input }) => {
    const result = await smsService.sendOTP(input.mobile);
    return { ok: result.ok, expiresAt: result.expiresAt };
  }),

verifyOTP: publicProcedure
  .input(z.object({
    mobile: z.string().regex(/^09\d{9}$/),
    code: z.string().length(6),
  }))
  .mutation(async ({ ctx, input }) => {
    const isValid = await smsService.verifyOTP(input.mobile, input.code);
    if (!isValid) throw new TRPCError({ code: 'BAD_REQUEST', message: 'کد وارد شده اشتباه یا منقضی شده است' });

    // کاربر را پیدا یا ایجاد کن
    let user = await ctx.db.user.findUnique({ where: { mobile: input.mobile } });
    if (!user) {
      user = await ctx.db.user.create({
        data: {
          mobile: input.mobile,
          userCode: `USR${Date.now()}`, // موقت - بعداً با فرمول واقعی جایگزین می‌شود
          membershipType: 'INDIVIDUAL',
        },
      });
    }

    // صدور توکن (مشابه login موجود)
    const accessToken = jwt.sign({ userId: user.id }, process.env['JWT_ACCESS_SECRET']!, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env['JWT_REFRESH_SECRET']!, { expiresIn: '7d' });
    
    ctx.res.setCookie('accessToken', accessToken, { httpOnly: true, secure: process.env['NODE_ENV'] === 'production', sameSite: 'strict', maxAge: 900 });
    ctx.res.setCookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env['NODE_ENV'] === 'production', sameSite: 'strict', maxAge: 604800 });

    return { ok: true, user: { id: user.id, mobile: user.mobile, userCode: user.userCode } };
  }),
```

**فایل ۴ — صفحه ورود با OTP در فرانت‌اند**

فایل جدید: `apps/web/src/routes/auth/login-otp.tsx`

این صفحه یک stepper دو مرحله‌ای است:
- مرحله ۱: ورود شماره موبایل + دکمه «ارسال کد»
- مرحله ۲: ورود کد ۶ رقمی + دکمه «تأیید»

```tsx
import { useState } from 'react';
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { trpc } from '../../trpc';

export const Route = createFileRoute('/auth/login-otp')({
  component: LoginOTPPage,
});

function LoginOTPPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const sendOTP = trpc.auth.sendOTP.useMutation({
    onSuccess: (data) => {
      setExpiresAt(new Date(data.expiresAt));
      setStep('code');
      setError('');
    },
    onError: (e) => setError(e.message),
  });

  const verifyOTP = trpc.auth.verifyOTP.useMutation({
    onSuccess: () => navigate({ to: '/dashboard' }),
    onError: (e) => setError(e.message),
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">ورود با رمز یکبار مصرف</h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          {step === 'mobile' ? 'شماره موبایل خود را وارد کنید' : `کد ۶ رقمی ارسال‌شده به ${mobile} را وارد کنید`}
        </p>

        {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm mb-4">{error}</div>}

        {step === 'mobile' ? (
          <form onSubmit={(e) => { e.preventDefault(); sendOTP.mutate({ mobile }); }}>
            <input
              type="tel"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="input-field w-full mb-4 text-center text-lg tracking-widest"
              maxLength={11}
              dir="ltr"
            />
            <button type="submit" disabled={sendOTP.isPending} className="btn-primary w-full">
              {sendOTP.isPending ? 'در حال ارسال...' : 'ارسال کد تأیید'}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); verifyOTP.mutate({ mobile, code }); }}>
            <input
              type="text"
              placeholder="_ _ _ _ _ _"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="input-field w-full mb-2 text-center text-2xl tracking-[0.5em]"
              maxLength={6}
              dir="ltr"
            />
            {expiresAt && (
              <p className="text-xs text-gray-400 text-center mb-4">
                کد تا ۵ دقیقه معتبر است
              </p>
            )}
            <button type="submit" disabled={verifyOTP.isPending || code.length !== 6} className="btn-primary w-full mb-3">
              {verifyOTP.isPending ? 'در حال بررسی...' : 'تأیید و ورود'}
            </button>
            <button type="button" onClick={() => { setStep('mobile'); setCode(''); setError(''); }} className="btn-secondary w-full text-sm">
              ویرایش شماره
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <Link to="/auth/login" className="text-blue-600 hover:underline">ورود با رمز عبور</Link>
        </div>
      </div>
    </div>
  );
}
```

همچنین در صفحه `apps/web/src/routes/auth/login.tsx`، یک لینک به صفحه OTP اضافه کنید:
```tsx
<Link to="/auth/login-otp" className="text-blue-600 hover:underline text-sm">
  ورود با رمز یکبار مصرف (OTP)
</Link>
```

---

## وظیفه ۳ — تست‌های End-to-End با Playwright

### توضیح
تست‌های unit برای ۸ router موجودند. تست e2e هنوز ندارد.

### مراحل اجرا

**گام ۱ — نصب Playwright**
```bash
# در ریشه پروژه
npm install -D @playwright/test
npx playwright install chromium --with-deps
```

**گام ۲ — فایل کانفیگ Playwright**

فایل جدید: `playwright.config.ts` در ریشه پروژه
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    locale: 'fa-IR',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
  },
});
```

**گام ۳ — تست ثبت‌نام**

فایل جدید: `e2e/auth.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('احراز هویت', () => {
  test('ثبت‌نام کاربر جدید', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.getByRole('heading', { name: /ثبت‌نام/ })).toBeVisible();

    await page.getByPlaceholder(/شماره موبایل/).fill('09121234567');
    await page.getByPlaceholder(/رمز عبور/).first().fill('Password@123');
    await page.getByPlaceholder(/تکرار رمز/).fill('Password@123');
    // انتخاب نوع عضویت اگر وجود دارد
    await page.getByRole('button', { name: /ثبت‌نام/ }).click();

    // بعد از ثبت‌نام موفق باید به dashboard برود
    await expect(page).toHaveURL(/dashboard/);
  });

  test('ورود با اطلاعات صحیح', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder(/شماره موبایل|نام کاربری/).fill('09121234567');
    await page.getByPlaceholder(/رمز عبور/).fill('Password@123');
    await page.getByRole('button', { name: /ورود/ }).click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('ورود با رمز اشتباه — نمایش خطا', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder(/شماره موبایل|نام کاربری/).fill('09121234567');
    await page.getByPlaceholder(/رمز عبور/).fill('WrongPassword');
    await page.getByRole('button', { name: /ورود/ }).click();
    await expect(page.getByText(/رمز عبور|اشتباه|نادرست/)).toBeVisible();
  });
});
```

**گام ۴ — تست تکمیل پروفایل**

فایل جدید: `e2e/profile.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

// این fixture برای login قبل از هر تست استفاده می‌شود
test.beforeEach(async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByPlaceholder(/شماره موبایل|نام کاربری/).fill('09121234567');
  await page.getByPlaceholder(/رمز عبور/).fill('Password@123');
  await page.getByRole('button', { name: /ورود/ }).click();
  await page.waitForURL(/dashboard/);
});

test('تکمیل پروفایل کاربر', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: /پروفایل/ })).toBeVisible();

  // پر کردن فیلدهای اجباری
  await page.getByLabel(/نام شرکت/).fill('شرکت آزمایشی');
  await page.getByLabel(/تلفن/).fill('02112345678');
  await page.getByRole('button', { name: /ذخیره/ }).click();

  await expect(page.getByText(/ذخیره شد|موفق/)).toBeVisible();
});
```

**گام ۵ — تست ادمین**

فایل جدید: `e2e/admin.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('پنل ادمین', () => {
  test.beforeEach(async ({ page }) => {
    // ورود با حساب ادمین (اطلاعات تست را تنظیم کنید)
    await page.goto('/auth/login');
    await page.getByPlaceholder(/شماره موبایل|نام کاربری/).fill('admin_mobile');
    await page.getByPlaceholder(/رمز عبور/).fill('admin_password');
    await page.getByRole('button', { name: /ورود/ }).click();
    await page.waitForURL(/dashboard/);
    await page.goto('/admin/users');
  });

  test('نمایش لیست کاربران در پنل ادمین', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /کاربران/ })).toBeVisible();
    await expect(page.locator('table, [role="table"]')).toBeVisible();
  });
});
```

**گام ۶ — اضافه کردن script به package.json ریشه**

در `package.json` ریشه، در بخش `scripts` اضافه کنید:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

---

## وظیفه ۴ — Sentry Error Tracking

### مراحل اجرا

**گام ۱ — نصب پکیج‌ها**
```bash
# در apps/web
npm install @sentry/react

# در apps/server
npm install @sentry/node
```

**گام ۲ — راه‌اندازی Sentry در فرانت‌اند**

فایل جدید: `apps/web/src/sentry.ts`
```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return; // اگر DSN تنظیم نشده، Sentry را راه‌اندازی نکن

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

در `apps/web/src/main.tsx`، در ابتدای فایل فراخوانی شود:
```typescript
import { initSentry } from './sentry';
initSentry(); // قبل از createRouter
```

**گام ۳ — راه‌اندازی Sentry در بک‌اند**

در ابتدای `apps/server/src/main.ts`، قبل از هر چیز اضافه کنید:
```typescript
import * as Sentry from '@sentry/node';

// اول از همه — قبل از import های دیگر
if (process.env['SENTRY_DSN']) {
  Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    environment: process.env['NODE_ENV'] ?? 'development',
    tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
  });
}
```

در error handler سرور (تابع `onError` در تRPC context یا global error handler فستیفای)، خطاها را به Sentry گزارش دهید:
```typescript
if (error instanceof Error && !isTRPCError) {
  Sentry.captureException(error);
}
```

**گام ۴ — اضافه کردن متغیرهای محیطی**

در `apps/web/.env.example`:
```
VITE_SENTRY_DSN=
```

در `apps/server/.env.example` (یا همان `.env.example` ریشه):
```
SENTRY_DSN=
```

---

## وظیفه ۵ — SEO و Metadata

### توضیح
صفحات عمومی (کاتالوگ و جزئیات محصول) باید `<meta>` tags داشته باشند.

### فایل‌های مرتبط که باید ویرایش شوند

**فایل ۱ — کاتالوگ**
مسیر: `apps/web/src/routes/catalog.tsx`

در ابتدای component، این را اضافه کنید:
```tsx
import { Helmet } from 'react-helmet-async'; // باید نصب شود

// در JSX:
<Helmet>
  <title>کاتالوگ محصولات | پلتفرم تجارت متمرکز هوشمند ایرانیان</title>
  <meta name="description" content="جستجو و مشاهده محصولات صنعتی، شیمیایی و تجاری تولیدکنندگان و بازرگانان ایرانی" />
  <meta property="og:title" content="کاتالوگ محصولات" />
  <meta property="og:description" content="پلتفرم B2B تجارت الکترونیک" />
  <meta property="og:type" content="website" />
  <link rel="canonical" href="https://your-domain.ir/catalog" />
</Helmet>
```

**فایل ۲ — جزئیات محصول**
مسیر: `apps/web/src/routes/catalog.$productId.tsx`

```tsx
// وقتی data لود شد:
<Helmet>
  <title>{product.nameFa} | کاتالوگ</title>
  <meta name="description" content={product.description ?? `${product.nameFa} — کد HS: ${product.hsCode}`} />
  <meta property="og:title" content={product.nameFa} />
  <meta property="og:description" content={product.description ?? ''} />
  {product.mainImage && <meta property="og:image" content={product.mainImage} />}
  <link rel="canonical" href={`https://your-domain.ir/catalog/${product.id}`} />
</Helmet>
```

**نصب پکیج:**
```bash
# در apps/web
npm install react-helmet-async
```

در `apps/web/src/main.tsx`، `HelmetProvider` را wrap کنید:
```tsx
import { HelmetProvider } from 'react-helmet-async';

// در JSX:
<HelmetProvider>
  <RouterProvider router={router} />
</HelmetProvider>
```

**فایل ۳ — robots.txt**

فایل جدید: `apps/web/public/robots.txt`
```
User-agent: *
Allow: /
Allow: /catalog
Allow: /catalog/

Disallow: /dashboard
Disallow: /profile
Disallow: /admin
Disallow: /trade
Disallow: /chat
Disallow: /support

Sitemap: https://your-domain.ir/sitemap.xml
```

**فایل ۴ — sitemap.xml پویا در بک‌اند**

در `apps/server/src/main.ts`، یک route جدید اضافه کنید (بعد از تنظیمات tRPC):
```typescript
// Sitemap endpoint
app.get('/sitemap.xml', async (req, reply) => {
  const products = await prisma.product.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 1000,
  });

  const appUrl = process.env['APP_URL'] ?? 'https://your-domain.ir';
  const urls = [
    `<url><loc>${appUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${appUrl}/catalog</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`,
    ...products.map(p =>
      `<url><loc>${appUrl}/catalog/${p.id}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
    ),
  ];

  reply
    .header('Content-Type', 'application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
});
```

---

## وظیفه ۶ — Lazy Loading صفحات احراز هویت‌شده

### توضیح
صفحات authenticated باید `React.lazy()` باشند تا bundle اولیه کوچک بماند.

### فایل مرتبط
`apps/web/src/routes/_authenticated.tsx` — layout احراز هویت

در TanStack Router، lazy loading به‌صورت زیر انجام می‌شود:

**در هر فایل route درون `_authenticated/`**، به‌جای export مستقیم component، این pattern را استفاده کنید:

```typescript
// در هر فایل مثلاً dashboard/index.tsx
export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: () => import('./dashboard-component').then(m => m.DashboardPage),
  // یا از lazyRouteComponent استفاده کنید:
});
```

**روش ساده‌تر با TanStack Router:**
```typescript
import { lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: lazyRouteComponent(() => import('./DashboardPage'), 'DashboardPage'),
});
```

---

## وظیفه ۷ — Caching با Redis

### فایل‌های مرتبط
- `apps/server/src/infrastructure/cache/redis-cache.service.ts` — سرویس cache موجود
- `apps/server/src/interface/trpc/routers/services.router.ts` — کدهای HS و بخشنامه‌ها

### مراحل اجرا

در `services.router.ts`، نتایج کدهای HS و ISIC و بخشنامه‌ها را cache کنید:

```typescript
// در procedure هایی که داده ثابت برمی‌گردانند:
getHsCodes: publicProcedure
  .input(z.object({ page: z.number(), search: z.string().optional() }))
  .query(async ({ ctx, input }) => {
    const cacheKey = `hs-codes:${input.page}:${input.search ?? ''}`;
    
    // ابتدا cache را بررسی کن
    const cached = await ctx.cache?.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    // از DB بگیر
    const result = await ctx.db.hSCode.findMany({ /* ... */ });
    
    // ذخیره در cache برای ۱ ساعت
    await ctx.cache?.set(cacheKey, JSON.stringify(result), 3600);
    
    return result;
  }),
```

همین الگو را برای `getIsicCodes` و `getCirculars` نیز استفاده کنید.

---

## وظیفه ۸ — Email Notifications با BullMQ

### توضیح
سرویس ایمیل (`SmtpEmailService`) و BullMQ هر دو در پروژه وجود دارند. فقط باید به‌هم وصل شوند.

### فایل‌های جدید که باید ساخته شوند

**فایل ۱ — Email Queue Worker**

فایل جدید: `apps/server/src/infrastructure/queue/email-worker.ts`
```typescript
import { Worker } from 'bullmq';
import { connection } from './queue-config.js'; // فایل config موجود یا جدید

export type EmailJobData = {
  to: string;
  subject: string;
  html: string;
};

export const emailWorker = new Worker<EmailJobData>(
  'emails',
  async (job) => {
    // از SmtpEmailService موجود استفاده کن
    const { to, subject, html } = job.data;
    console.log(`[EmailWorker] Sending email to ${to}: ${subject}`);
    // await emailService.send(to, subject, html);
  },
  { connection }
);

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} failed:`, err);
});
```

**فایل ۲ — Email Templates**

فایل جدید: `apps/server/src/infrastructure/queue/email-templates.ts`
```typescript
export const emailTemplates = {
  documentApproved: (userName: string) => ({
    subject: 'مدارک شما تأیید شد — پلتفرم تجارت هوشمند',
    html: `
      <div dir="rtl" style="font-family: Tahoma; padding: 20px;">
        <h2>مدارک شما با موفقیت تأیید شد</h2>
        <p>کاربر گرامی ${userName}،</p>
        <p>مدارک شما توسط کارشناسان ما بررسی و تأیید شد. اکنون می‌توانید از تمام امکانات پلتفرم استفاده کنید.</p>
        <a href="${process.env['FRONTEND_URL']}/dashboard" style="background:#2563eb;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">ورود به داشبورد</a>
      </div>
    `,
  }),

  documentRejected: (userName: string, reason: string) => ({
    subject: 'مدارک شما رد شد — پلتفرم تجارت هوشمند',
    html: `
      <div dir="rtl" style="font-family: Tahoma; padding: 20px;">
        <h2>مدارک شما نیاز به اصلاح دارد</h2>
        <p>کاربر گرامی ${userName}،</p>
        <p>متأسفانه مدارک شما تأیید نشد. دلیل: <strong>${reason}</strong></p>
        <p>لطفاً مدارک را اصلاح و مجدداً بارگذاری کنید.</p>
        <a href="${process.env['FRONTEND_URL']}/profile" style="background:#dc2626;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">ویرایش پروفایل</a>
      </div>
    `,
  }),

  tradeMatched: (userName: string) => ({
    subject: 'درخواست تجاری شما تطبیق یافت!',
    html: `
      <div dir="rtl" style="font-family: Tahoma; padding: 20px;">
        <h2>تطبیق موفق!</h2>
        <p>کاربر گرامی ${userName}،</p>
        <p>درخواست تجاری شما با طرف مقابل تطبیق یافت. برای ادامه مذاکره وارد پنل شوید.</p>
        <a href="${process.env['FRONTEND_URL']}/trade" style="background:#16a34a;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">مشاهده درخواست</a>
      </div>
    `,
  }),
};
```

---

## وظیفه ۹ — WebSocket برای چت (جایگزین Polling)

### توضیح
فعلاً چت با polling هر ۵ ثانیه کار می‌کند. با WebSocket تجربه بهتری داریم.

### مراحل اجرا

**گام ۱ — نصب پکیج**
```bash
# در apps/server
npm install @fastify/websocket
```

**گام ۲ — فعال کردن WebSocket در سرور**

در `apps/server/src/main.ts`:
```typescript
import fastifyWebsocket from '@fastify/websocket';
await app.register(fastifyWebsocket);
```

**گام ۳ — WebSocket route**

در `apps/server/src/main.ts` بعد از ثبت تRPC:
```typescript
// Map برای نگه‌داشتن connection های فعال
const activeConnections = new Map<string, Set<WebSocket>>();

app.get('/ws/chat/:conversationId', { websocket: true }, async (socket, req) => {
  const { conversationId } = req.params as { conversationId: string };
  
  // احراز هویت از cookie
  const token = req.cookies['accessToken'];
  if (!token) { socket.close(4001, 'Unauthorized'); return; }
  
  let userId: string;
  try {
    const decoded = jwt.verify(token, process.env['JWT_ACCESS_SECRET']!) as { userId: string };
    userId = decoded.userId;
  } catch { socket.close(4001, 'Invalid token'); return; }

  // اضافه کردن به connections
  if (!activeConnections.has(conversationId)) activeConnections.set(conversationId, new Set());
  activeConnections.get(conversationId)!.add(socket);

  socket.on('message', async (rawMessage) => {
    const data = JSON.parse(rawMessage.toString());
    if (data.type === 'message') {
      // ذخیره در DB
      const newMessage = await prisma.message.create({
        data: { conversationId, senderId: userId, content: data.content },
        include: { sender: { select: { id: true, userCode: true } } },
      });
      // broadcast به همه ی connections این conversation
      const conns = activeConnections.get(conversationId);
      if (conns) {
        const payload = JSON.stringify({ type: 'message', message: newMessage });
        conns.forEach(conn => { if (conn.readyState === 1) conn.send(payload); });
      }
    }
  });

  socket.on('close', () => {
    activeConnections.get(conversationId)?.delete(socket);
  });
});
```

**گام ۴ — به‌روزرسانی فرانت‌اند**

در `apps/web/src/routes/_authenticated/chat/index.tsx`، polling را با WebSocket جایگزین کنید:

```tsx
// به‌جای useQuery با refetchInterval:
useEffect(() => {
  if (!selectedConversationId) return;
  
  const ws = new WebSocket(`ws://localhost:4000/ws/chat/${selectedConversationId}`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
      setMessages(prev => [...prev, data.message]);
    }
  };
  
  ws.onerror = () => console.error('WebSocket error');
  
  return () => ws.close();
}, [selectedConversationId]);
```

---

## وظیفه ۱۰ — تکمیل CI/CD — Deploy خودکار

### توضیح
فایل `.github/workflows/ci.yml` موجود است (lint + typecheck + build + test). باید مرحله deploy نیز اضافه شود.

### فایل مرتبط
`.github/workflows/ci.yml`

بعد از مرحله `test`، این job را اضافه کنید:

```yaml
  deploy:
    name: Deploy to Production
    needs: [test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          port: ${{ secrets.DEPLOY_PORT || 22 }}
          script: |
            cd /opt/vaahedi
            git pull origin main
            npm install --frozen-lockfile
            npm run build
            docker compose -f docker-compose.prod.yml up -d --build
            docker system prune -f
```

در GitHub repository، این Secrets را تنظیم کنید:
- `DEPLOY_HOST` — آدرس IP سرور
- `DEPLOY_USER` — نام کاربری SSH
- `DEPLOY_SSH_KEY` — کلید خصوصی SSH

---

## وظیفه ۱۱ — فشرده‌سازی تصاویر قبل از آپلود به MinIO

### مراحل اجرا

**گام ۱ — نصب sharp**
```bash
# در apps/server
npm install sharp
npm install -D @types/sharp
```

**گام ۲ — middleware فشرده‌سازی**

فایل جدید: `apps/server/src/infrastructure/storage/image-processor.ts`
```typescript
import sharp from 'sharp';

export async function compressImage(
  buffer: Buffer,
  options: { maxWidth?: number; quality?: number; format?: 'jpeg' | 'webp' } = {}
): Promise<Buffer> {
  const { maxWidth = 1200, quality = 80, format = 'webp' } = options;

  return sharp(buffer)
    .resize(maxWidth, undefined, { withoutEnlargement: true })
    .toFormat(format, { quality })
    .toBuffer();
}

export async function createThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
    .toFormat('webp', { quality: 70 })
    .toBuffer();
}
```

در `product.router.ts`، هنگام آپلود تصویر، قبل از ارسال به MinIO از `compressImage` استفاده کنید.

---

## وظیفه ۱۲ — Pino Structured Logging در بک‌اند

### توضیح
فستیفای با Pino عمیقاً یکپارچه است و نیاز به نصب جداگانه نیست. فقط باید کانفیگ production آن بهبود یابد.

### فایل مرتبط
`apps/server/src/main.ts`

در تنظیم `Fastify`:
```typescript
const app = Fastify({
  logger: process.env['NODE_ENV'] === 'production'
    ? {
        level: 'info',
        // لاگ ساختاریافته برای سیستم‌های لاگ مانند Datadog/Loki
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
            ip: req.ip,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      }
    : {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
        },
      },
});
```

---

## ترتیب اجرا (پیشنهادی)

| # | وظیفه | تخمین زمان | وابستگی |
|---|-------|-----------|---------|
| ۱ | Captcha | ۱ ساعت | ندارد |
| ۲ | OTP با Mock | ۳ ساعت | ندارد |
| ۳ | SEO + robots.txt + sitemap | ۲ ساعت | ندارد |
| ۴ | Sentry (frontend + backend) | ۱ ساعت | ندارد |
| ۵ | E2E با Playwright | ۴ ساعت | نیاز به داده تست |
| ۶ | Redis Caching | ۲ ساعت | ندارد |
| ۷ | Email Worker با BullMQ | ۳ ساعت | ندارد |
| ۸ | Pino Production Logging | ۳۰ دقیقه | ندارد |
| ۹ | Image Compression | ۱ ساعت | ندارد |
| ۱۰ | Lazy Loading | ۱ ساعت | ندارد |
| ۱۱ | WebSocket چت | ۴ ساعت | ندارد |
| ۱۲ | Deploy CI/CD | ۱ ساعت | نیاز به SSH سرور |

---

## یادداشت‌های مهم

1. **پسوند `.js` برای import ها در server:** همه import های نسبی در `apps/server` باید پسوند `.js` داشته باشند (نه `.ts`)، حتی اگر فایل اصلی `.ts` باشد.

2. **TypeScript بدون خطا:** بعد از هر تغییر، این دستور را اجرا کنید:
   ```bash
   cd apps/server && npx tsc --noEmit
   cd apps/web && npx tsc --noEmit
   ```

3. **npm workspaces:** برای نصب پکیج در یک app خاص:
   ```bash
   npm install <package> -w apps/web
   npm install <package> -w apps/server
   ```

4. **OTP در آینده:** وقتی کارفرما provider SMS را انتخاب کرد (مثلاً کاوه‌نگار)، فقط باید `MockSMSService` را با `KavenegarSMSService` جایگزین کنید و Interface تغییر نمی‌کند:
   ```typescript
   class KavenegarSMSService implements ISMSService {
     async sendOTP(mobile: string) { /* کاوه‌نگار API */ }
     async verifyOTP(mobile: string, code: string) { /* ... */ }
   }
   ```

5. **Captcha در آینده:** وقتی hCaptcha site key واقعی دریافت شد، فقط مقدار `VITE_HCAPTCHA_SITE_KEY` در `.env` عوض می‌شود.
