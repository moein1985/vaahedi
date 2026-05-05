# گزارش مشکلات و نقشه راه پایدارسازی پروژه وهدی

> تاریخ بررسی: ۵ مه ۲۰۲۶  
> وضعیت: سند مبنا برای شروع اصلاحات مرحله ای  
> اصل اجرایی: قبل از هر deploy یا reset دیتابیس، build و مسیرهای حیاتی باید قابل تکرار و قابل تست شوند.

---

## خلاصه مدیریتی

پروژه در چند نوبت تغییر کرده و الان مشکلات به یک باگ منفرد محدود نیست. چند دسته مشکل با هم تداخل دارند:

1. build فرانت به دلیل route جدید و route tree تولید نشده fail می شود.
2. وضعیت ادمین در login درست به frontend منتقل نمی شود.
3. نقش های ادمین تعریف شده اند، اما سطح دسترسی واقعی برای هر نقش هنوز enforce نشده است.
4. flow ثبت نام، تایید مدارک و فعال سازی کاربر کامل و یکپارچه نیست.
5. AI chat برای کاربران تازه ثبت نام کرده کار نمی کند چون کاربر `PENDING` است و chat فقط `ACTIVE` را قبول می کند.
6. seed دیتابیس، تست های E2E و credentialهای مورد انتظار با هم هماهنگ نیستند.
7. workspace شامل فایل های artifact، فایل های بزرگ و تغییرات جانبی است که review و deploy را پرخطر می کند.
8. deploy production به workaroundهای Prisma و Docker وابسته شده و باید مستند و کنترل شود.

هدف این نقشه راه این است که ابتدا پروژه را به وضعیت buildable و قابل تست برگردانیم، بعد flowهای اصلی را اصلاح کنیم، و در پایان با backup و rollback plan دیتابیس production را reset/seed کنیم.

---

## وضعیت فعلی و فایل های حساس

### فایل های تغییریافته/حساس

- `apps/server/src/interface/trpc/routers/admin.router.ts`
  - APIهای جدید مدیریت ادمین اضافه شده اند.
  - فقط `listAdmins`, `createAdmin`, `updateAdminRole`, `removeAdmin` فعلا `SUPER_ADMIN` را enforce می کنند.
  - سایر APIهای admin هنوز فقط `isAdmin` را چک می کنند.

- `packages/db/prisma/seed.ts`
  - seed فعلی فقط کاربر `admin` با رمز `admin@12321#` را می سازد.
  - اگر userCode `admin` قبلا وجود داشته باشد، `update: {}` چیزی را اصلاح نمی کند.
  - seed قبلی sample userهایی مثل `0000001 / Admin@1234` می ساخت؛ تست ها هنوز تا حدی به آن وابسته اند.

- `apps/web/src/routes/_authenticated/admin/admins.tsx`
  - صفحه جدید مدیریت ادمین ها اضافه شده است.
  - route آن هنوز در `routeTree.gen.ts` ثبت نشده و build را می شکند.

- `apps/web/src/routes/_authenticated.tsx`
  - لینک `/admin/admins` به sidebar اضافه شده است.
  - نمایش sidebar admin به `user.isAdmin` وابسته است.

- `apps/web/src/routeTree.gen.ts`
  - generated است و نباید دستی ویرایش شود.
  - مسیر `/admin/admins` را هنوز نمی شناسد.

- `packages/db/prisma-client/*`
  - Prisma client generated/vendor شده برای حل مشکل production Docker اضافه شده است.
  - به دلیل حجم و generated بودن باید درباره نگهداری یا حذف از git تصمیم قطعی گرفته شود.

- `postgres15-alpine.tar`
  - artifact بزرگ Docker است و نباید داخل repository باقی بماند.

- `reset_pw.sql`
  - فایل دستی reset password است و ممکن است credential/hash حساس یا موقت داشته باشد.
  - برای source control مناسب نیست.

---

## مشکلات شناسایی شده

### P0-1: build فرانت به دلیل route tree شکسته است

**نشانه:**

`npm run -w apps/web build` خطای TypeScript می دهد، چون `createFileRoute('/_authenticated/admin/admins')` در route tree شناخته نشده است.

**علت ریشه ای:**

در `apps/web/package.json` اسکریپت build این است:

```bash
tsc -b && vite build
```

اما TanStack Router Vite plugin هنگام Vite build route tree را تولید می کند. چون `tsc -b` قبل از Vite اجرا می شود، TypeScript قبل از تولید route tree fail می کند.

**ریسک:**

تا حل این مورد، هیچ deploy سالمی از frontend ممکن نیست.

**راه حل پیشنهادی:**

1. دستور صحیح تولید route tree را مشخص و به script اضافه کنیم.
2. قبل از `tsc -b` route tree را regenerate کنیم.
3. از دستور اشتباه `npx tsr generate` استفاده نکنیم.
4. بعد از اصلاح، `npm run -w apps/web build` باید pass شود.

**معیار پذیرش:**

- `apps/web/src/routeTree.gen.ts` شامل `/admin/admins` باشد.
- `npm run -w apps/web build` بدون خطا تمام شود.

---

### P0-2: وضعیت admin در frontend بعد از login اشتباه است

**نشانه:**

کاربر admin بعد از login ممکن است پنل مدیریت را در sidebar نبیند.

**علت ریشه ای:**

Backend در login فقط این user را برمی گرداند:

```ts
id, userCode, role, status, mobile, email
```

و frontend در login به صورت دستی `isAdmin: false` ست می کند.

**ریسک:**

حتی super admin پیش فرض ممکن است بعد از login مستقیم به UI مدیریت دسترسی واضح نداشته باشد.

**راه حل پیشنهادی:**

1. در `auth.login`, `auth.loginWithEmail`, `auth.loginWithOtp`, `auth.refreshToken`, و `auth.me` مقدارهای زیر برگردد:
   - `isAdmin`
   - `adminRole`
2. در `AuthUser` frontend فیلد `adminRole?: string` اضافه شود.
3. frontend دیگر `isAdmin: false` hardcode نکند.
4. redirect بعد از login برای admin می تواند به `/admin` باشد یا حداقل sidebar باید بلافاصله نمایش داده شود.

**معیار پذیرش:**

- login با `admin / admin@12321#` بلافاصله sidebar مدیریت را نشان دهد.
- refresh صفحه باعث از بین رفتن وضعیت admin نشود.

---

### P0-3: flow تایید کاربر و فعال سازی ناقص است

**نشانه:**

ثبت نام و login کار می کند، FAB باز می شود، اما AI chat کار نمی کند.

**علت ریشه ای:**

کاربر جدید با `status = PENDING` ساخته می شود. `chat.router.ts` از `activeProcedure` استفاده می کند و `activeProcedure` فقط کاربر `ACTIVE` را قبول می کند.

همزمان `verifyDocument` وقتی مدرک را approve می کند، فقط document را تغییر می دهد و user را active نمی کند، اما پیام notification می گوید کاربر می تواند از همه امکانات استفاده کند.

**ریسک:**

کاربر فکر می کند تایید شده، اما هنوز امکانات اصلی مثل AI chat، product، trade و support ممکن است blocked باشند.

**راه حل پیشنهادی:**

تصمیم محصولی لازم است. پیشنهاد عملی:

1. ثبت نام: کاربر `PENDING` بماند.
2. کاربر `PENDING` فقط به profile, documents, notifications و پیام وضعیت دسترسی داشته باشد.
3. تایید مدارک توسط نقش `EXPERT` انجام شود.
4. بعد از تایید شرایط لازم، user status به `ACTIVE` تغییر کند.
5. notification متن دقیق بگوید چه چیزی تایید شده و وضعیت حساب چیست.
6. UI dashboard برای کاربر `PENDING` پیام روشن نشان دهد: «حساب شما در انتظار تایید است».

**معیار پذیرش:**

- کاربر تازه ثبت نام کرده وضعیت pending را واضح می بیند.
- بعد از تایید admin، user به `ACTIVE` تغییر می کند.
- AI chat برای کاربر active کار می کند.

---

### P0-4: seed، reset دیتابیس و تست ها ناسازگارند

**نشانه:**

seed فعلی فقط admin جدید را می سازد، اما تست های E2E به userهای قدیمی وابسته اند.

**علت ریشه ای:**

credentialهای مورد استفاده در testها و seed همزمان تغییر نکرده اند.

**ریسک:**

بعد از reset دیتابیس، تست ها و حتی بعضی flowهای demo fail می شوند.

**راه حل پیشنهادی:**

1. seed را به دو بخش جدا کنیم:
   - seed production: فقط super admin و داده های ضروری.
   - seed dev/e2e: super admin + userهای تستی + داده های نمونه.
2. credentialهای E2E را از env بخوانیم، نه hardcode.
3. seed باید idempotent باشد و در `upsert.update` نیز `passwordHash`, `status`, `adminProfile` را اصلاح کند.

**معیار پذیرش:**

- reset dev/e2e تست ها را نمی شکند.
- production seed فقط داده ضروری می سازد.
- اجرای دوباره seed، admin ناقص یا password قدیمی باقی نمی گذارد.

---

### P1-1: نقش های ادمین policy کامل ندارند

**وضع فعلی:**

نقش ها در schema وجود دارند:

- `SUPER_ADMIN`
- `EXPERT`
- `MEDIA_SUPERVISOR`
- `ANALYST`

اما فقط مدیریت خود ادمین ها restricted شده است.

**پیشنهاد policy:**

| نقش | دسترسی پیشنهادی |
| --- | --- |
| `SUPER_ADMIN` | همه چیز، ساخت/ویرایش/حذف ادمین ها، تغییر وضعیت کاربران |
| `EXPERT` | بررسی مدارک و فعال سازی/رد کاربر طبق workflow مشخص |
| `MEDIA_SUPERVISOR` | مدیریت تبلیغات، اخبار، بخشنامه ها، فایل های دانلودی |
| `ANALYST` | مشاهده dashboard، trade requests، analysis requests، گزارش ها؛ بدون حذف/تغییر حساس |

**راه حل فنی:**

1. middleware جدید مثل `adminRoleProcedure([...roles])` بسازیم.
2. هر endpoint admin را با نقش مناسب محافظت کنیم.
3. frontend sidebar را هم بر اساس `adminRole` فیلتر کند.
4. backend منبع نهایی دسترسی باشد؛ frontend فقط UX را بهتر کند.

**معیار پذیرش:**

- `EXPERT` نتواند ادمین بسازد یا تبلیغات را مدیریت کند.
- `MEDIA_SUPERVISOR` نتواند وضعیت user را active/rejected کند.
- `ANALYST` به endpointهای mutation حساس دسترسی نداشته باشد.

---

### P1-2: AI chat برای pending user UX مناسب ندارد

**وضع فعلی:**

FAB باز می شود، اما backend با `FORBIDDEN` پاسخ می دهد.

**راه حل پیشنهادی:**

1. اگر chat فقط برای `ACTIVE` است، frontend برای user pending متن دقیق نشان دهد و send را disable کند.
2. اگر قرار است AI راهنمای onboarding باشد، endpoint جدا با `protectedProcedure` بسازیم که فقط راهنمایی عمومی بدهد.
3. خطای backend در FAB به متن قابل فهم تبدیل شود.

**معیار پذیرش:**

- کاربر pending پیام واضح می بیند.
- کاربر active بتواند conversation بسازد و پیام بفرستد.

---

### P1-3: deploy production به artifactهای Prisma وابسته است

**وضع فعلی:**

برای حل مشکل `@prisma/client did not initialize yet`، client تولید شده در `packages/db/prisma-client` vendor شده و Dockerfile آن را به `node_modules/.prisma/client` کپی می کند.

**ریسک:**

generated artifactهای حجیم وارد source می شوند و با هر تغییر schema باید دوباره sync شوند.

**راه حل پیشنهادی:**

دو مسیر ممکن:

1. مسیر سریع و کم ریسک فعلی: vendor را نگه داریم، اما دقیق مستند کنیم و `.gitignore`/release checklist مشخص داشته باشیم.
2. مسیر تمیزتر: Docker build داخل image با lockfile و `prisma generate` قابل اتکا شود و نیاز به vendor حذف شود.

**معیار پذیرش:**

- build production بدون dependency به node_modules ویندوز کار کند.
- هر schema change با دستور مشخص Prisma client production را آماده کند.

---

### P1-4: workspace شامل artifactهای نامناسب است

**موارد شناسایی شده:**

- `postgres15-alpine.tar`
- `reset_pw.sql`
- `docs/مشکلات.docx`
- `docs/مشکلات.pdf`
- `playwright-report/index.html`
- پوشه های test-results/report
- generated Prisma client حجیم

**راه حل پیشنهادی:**

1. قبل از هر commit/deploy، فایل ها دسته بندی شوند:
   - لازم برای production workaround
   - مستندات قابل نگهداری
   - artifactهای موقت و قابل حذف
2. `.gitignore` تکمیل شود.
3. فایل های حساس مثل reset password SQL خارج از repo نگهداری شوند.

**معیار پذیرش:**

- `git status` فقط تغییرات مورد انتظار را نشان دهد.
- artifactهای حجیم یا حساس در source control نباشند.

---

### P2-1: diagnostics و accessibility issueهای موجود

**موارد فعلی:**

- selectهای بدون accessible name در `apps/web/src/routes/_authenticated/admin/users.tsx`.
- inline style diagnostic در `apps/web/src/routes/_authenticated/admin/index.tsx`.
- diagnostics روی `playwright-report/index.html` که generated است و باید از بررسی IDE/lint خارج شود.

**راه حل پیشنهادی:**

1. selectها `aria-label` یا label واقعی بگیرند.
2. inline styleها یا حذف شوند یا به class منتقل شوند.
3. generated reports از lint/diagnostics جدی پروژه جدا شوند.

---

### P2-2: query دستی production از نام جدول اشتباه استفاده کرده است

**نشانه:**

آخرین command سعی کرده `public."User"` را query کند، در حالی که Prisma با `@@map("users")` جدول را `users` ساخته است.

**راه حل پیشنهادی:**

برای query دستی از نام جدول های mapped استفاده شود:

```sql
select id, mobile, email, role, status
from users
order by "createdAt" desc
limit 20;
```

---

## نقشه راه اجرایی پیشنهادی

### فاز 0: توقف تغییرات پراکنده و تثبیت workspace

**هدف:** بدانیم دقیقا چه چیزی باید نگه داشته شود و چه چیزی artifact است.

چک لیست:

- [ ] خروجی کامل `git status --short` گرفته و دسته بندی شود.
- [ ] فایل های artifact مثل tar، report و SQL موقت مشخص شوند.
- [ ] درباره `packages/db/prisma-client` تصمیم گرفته شود: نگهداری موقت یا حذف بعد از اصلاح Docker build.
- [ ] هیچ reset/deploy تا قبل از build سبز انجام نشود.

خروجی فاز:

- workspace قابل review.
- لیست فایل های مجاز برای commit/deploy.

---

### فاز 1: سبز کردن build frontend و backend

**هدف:** پروژه دوباره قابل build شود.

چک لیست:

- [ ] route generation صحیح TanStack Router مشخص شود.
- [ ] script مناسب به web build اضافه شود یا build order اصلاح شود.
- [ ] `routeTree.gen.ts` مسیر `/admin/admins` را بشناسد.
- [ ] `npm run -w apps/web build` pass شود.
- [ ] `npm run -w apps/server build` pass شود.
- [ ] diagnostics مهم accessibility برای فایل های admin رفع شود.

خروجی فاز:

- frontend و backend buildable.

---

### فاز 2: اصلاح auth/admin identity

**هدف:** frontend و backend درباره admin بودن کاربر یک حقیقت مشترک داشته باشند.

چک لیست:

- [ ] backend loginها `isAdmin` و `adminRole` برگردانند.
- [ ] `refreshToken` و `me` هم `adminRole` برگردانند.
- [ ] frontend `AuthUser` با `adminRole` هماهنگ شود.
- [ ] hardcodeهای `isAdmin: false` حذف شوند.
- [ ] login super admin تست شود.

خروجی فاز:

- super admin بعد از login مستقیم به پنل مدیریت دسترسی واضح دارد.

---

### فاز 3: تکمیل role-based access control

**هدف:** سه نقش مدیریتی واقعا از هم جدا شوند.

چک لیست:

- [ ] middleware role-based برای admin ساخته شود.
- [ ] endpointهای admin به role مناسب محدود شوند.
- [ ] sidebar و صفحات frontend بر اساس `adminRole` فیلتر شوند.
- [ ] تست backend برای forbidden/allowed هر نقش اضافه شود.

خروجی فاز:

- `SUPER_ADMIN`, `EXPERT`, `MEDIA_SUPERVISOR`, `ANALYST` رفتار قابل تست و قابل توضیح دارند.

---

### فاز 4: اصلاح registration، approval و activation flow

**هدف:** کاربر از ثبت نام تا فعال شدن مسیر واضح و بدون تناقض داشته باشد.

چک لیست:

- [ ] policy تایید نهایی مشخص شود: با تایید مدارک فعال شود یا با دکمه جدا؟
- [ ] `verifyDocument` و `updateUserStatus` با policy هماهنگ شوند.
- [ ] notificationها متن دقیق داشته باشند.
- [ ] dashboard/profile برای pending user وضعیت را واضح نشان دهد.
- [ ] AI FAB برای pending user رفتار مناسب داشته باشد.

خروجی فاز:

- کاربر pending سردرگم نمی شود.
- فعال سازی کاربر reproducible و قابل تست است.

---

### فاز 5: اصلاح seed، reset و تست های E2E

**هدف:** reset دیتابیس و تست ها قابل اعتماد شوند.

چک لیست:

- [ ] seed production فقط super admin و داده ضروری بسازد.
- [ ] seed dev/e2e کاربران و داده تستی بسازد.
- [ ] credentialهای E2E از env خوانده شوند.
- [ ] seed idempotent شود و password/adminProfile را در update هم اصلاح کند.
- [ ] E2E smoke برای login admin، approval flow و AI chat اضافه/اصلاح شود.

خروجی فاز:

- reset dev و production برنامه مشخص دارد.
- تست ها به credentialهای قدیمی وابسته نیستند.

---

### فاز 6: آماده سازی deploy و reset production

**هدف:** اجرای production بدون از دست رفتن داده ناخواسته.

چک لیست قبل از عملیات:

- [ ] backup کامل PostgreSQL گرفته شود.
- [ ] backup MinIO در صورت نیاز گرفته شود.
- [ ] rollback plan آماده باشد.
- [ ] build local سبز باشد.
- [ ] migrationها بررسی و deploy شوند.
- [ ] فقط بعد از تایید کارفرما DB reset شود.

ترتیب عملیات پیشنهادی:

1. backup دیتابیس production.
2. deploy build جدید backend/frontend.
3. اجرای migration deploy.
4. reset/truncate طبق تصمیم تایید شده.
5. اجرای production seed.
6. تست login با `admin / admin@12321#`.
7. تست ساخت adminهای `EXPERT`, `MEDIA_SUPERVISOR`, `ANALYST`.
8. تست ثبت نام کاربر عادی، تایید، فعال سازی و AI chat.

---

## تست های ضروری قبل از پایان کار

### تست های build/type

```bash
npm run -w apps/server build
npm run -w apps/web build
```

### تست های flow دستی

- [ ] login super admin.
- [ ] ساخت admin با نقش `EXPERT`.
- [ ] ساخت admin با نقش `MEDIA_SUPERVISOR`.
- [ ] ساخت admin با نقش `ANALYST`.
- [ ] login هر نقش و بررسی محدودیت دسترسی.
- [ ] ثبت نام کاربر عادی.
- [ ] pending user فقط بخش های مجاز را ببیند.
- [ ] تایید مدارک/فعال سازی.
- [ ] AI chat برای active user کار کند.
- [ ] AI chat برای pending user پیام مناسب بدهد.

### تست های production بعد از deploy

- [ ] `/health` API ok باشد.
- [ ] nginx 502 ندهد.
- [ ] frontend routeهای protected باز شوند.
- [ ] refresh صفحه، access token را از refresh token بازیابی کند.
- [ ] Prisma runtime error در container وجود نداشته باشد.

---

## تصمیم های باز که باید قبل از پیاده سازی قطعی شوند

1. آیا تایید همه مدارک به صورت خودکار user را `ACTIVE` کند یا super admin باید جداگانه فعال کند؟
2. آیا AI chat برای کاربر `PENDING` فقط راهنمای onboarding باشد یا کاملا بسته بماند؟
3. آیا `packages/db/prisma-client` باید موقت در repo بماند یا Docker build تمیز جایگزین شود؟
4. آیا production reset کامل دیتابیس می خواهد یا فقط حذف users/user-related data؟
5. آیا فایل های docs فارسی بزرگ باید در repo بمانند یا به storage خارجی منتقل شوند؟

---

## ترتیب پیشنهادی شروع پیاده سازی

برای کمترین ریسک، از این ترتیب شروع کنیم:

1. فاز 1: build فرانت و route tree.
2. فاز 2: اصلاح login/admin identity.
3. فاز 3: role-based admin access.
4. فاز 4: approval/activation flow.
5. فاز 5: seed و E2E.
6. فاز 6: deploy/reset production با backup.

این ترتیب باعث می شود قبل از دست زدن به دیتابیس production، کد قابل build و قابل تست باشد.