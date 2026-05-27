# برنامه شروع اجرایی اولویت‌محور (Kickoff)

## تاریخ
- 2026-05-26

## وضعیت شاخه و ایمنی تغییرات
- [x] بررسی شد که روی main نیستیم.
- شاخه فعال: feature/jahad-agri-roadmap

## اقدامات شروع که انجام شد
- [x] ممیزی سریع As-Is روی web/server/shared/db انجام شد.
- [x] baseline build گرفته شد:
  - server build: PASS
  - web build: PASS (پس از رفع 2 خطای TypeScript)
- [x] دو blocker فنی اولیه رفع شد:
  - duplicate className در sidebar
  - نبود import تابع cn در Dashboard
- [x] AuditLog حداقلی برای عملیات حساس ادمین پیاده‌سازی شد:
  - مدل DB + migration
  - ثبت رخداد در taxonomy/harvest/market و document-review
  - افزودن assertion در تست‌های agri/admin
  - وضعیت اجرای runtime تست: به دلیل در دسترس نبودن Docker daemon و DB روی localhost:5434، اجرای کامل تست‌های integration در این سیستم بلاک شد.
- [x] مدل چندشغلی پروفایل (OccupationMapping) پیاده‌سازی شد:
  - مدل DB + migration + backfill از فیلد legacy
  - همگام‌سازی mappingها در profile upsert/update
  - پشتیبانی UI برای انتخاب چندگانه دسته‌بندی شغلی
- [x] hardening مانیتورینگ staging انجام شد:
  - endpointهای `/live`، `/health` و `/ready` به API اضافه شدند.
  - readiness با چک DB + Redis + MinIO و timeout قابل تنظیم پیاده‌سازی شد.
  - healthcheck سرویس `api` در `docker-compose.prod.yml` و `docker-compose.agri.yml` روی `/ready` تنظیم شد.
  - پراکسی nginx برای `/ready` و `/live` هم‌راستا شد.
  - متغیرهای Sentry (environment/release/sample-rate) و logging/readiness در env templates اضافه شدند.
  - اعتبارسنجی عملیاتی staging روی CT 204 در تاریخ 2026-05-27 انجام شد:
    - بررسی مستقیم API داخل کانتینر `vaahedi-lxc_api_1` نشان داد `/live`، `/health` و `/ready` همگی `200` و JSON صحیح برمی‌گردانند.
    - mismatch پراکسی وب شناسایی و hotfix شد (روی پورت `8082` هر سه endpoint اکنون `200` JSON هستند).
    - فایل سورس دیپلوی وب برای پایداری اصلاح شد: `apps/web/nginx.spa.conf`.
  - دیپلوی non-production روی CT 204 با روش hot-deploy artifactها انجام شد (بدون rebuild image روی سرور):
    - انتقال `apps/web/dist`، `apps/server/dist`، `packages/shared/dist`، `packages/db/dist` و `packages/db/prisma-client` به CT و inject مستقیم داخل کانتینرهای `web/api/worker`.
    - restart سرویس‌های `vaahedi-lxc_web_1`، `vaahedi-lxc_api_1`، `vaahedi-lxc_worker_1` با حفظ tagهای فعلی compose.
    - تایید post-deploy: health کانتینرهای web/api `healthy` و endpointهای `/live`، `/ready`، `/health` روی `http://127.0.0.1:8082` همگی `200`.
- [x] hardening تست ادمین CRUD انجام شد:
  - suite جدید سناریوهای taxonomy/harvest/market در `e2e/admin-agri-crud.spec.ts` اضافه شد.
  - جریان login/navigation برای جلوگیری از از دست رفتن token به ناوبری SPA-safe تغییر کرد.
  - blocker staging برای taxonomy.create ریشه‌یابی و رفع شد:
    - علت: stale بودن artifact مسیر `packages/db/prisma-client` و نبود delegate `occupationCategory` در runtime.
    - اقدام: regenerate Prisma client و hot-deploy مجدد artifact به کانتینرهای `api/worker`.
  - یک flaky selector در سناریوی market insight نیز رفع شد (placeholder فیلد محصول فارسی به حالت `exact` تغییر یافت).
  - اجرای نهایی تست روی staging:
    - `PLAYWRIGHT_BASE_URL=http://192.168.85.20:8082 npx playwright test e2e/admin-agri-crud.spec.ts --project=chromium`
    - نتیجه: `3 passed`.

## شواهد وضعیت فعلی (As-Is Snapshot)
- agri router در backend حاضر است:
  - apps/server/src/interface/trpc/routers/agri.router.ts:18
  - apps/server/src/interface/trpc/routers/agri.router.ts:89
  - apps/server/src/interface/trpc/routers/agri.router.ts:141
  - apps/server/src/interface/trpc/routers/agri.router.ts:266
- مدل‌های کلیدی کشاورزی در DB حاضرند:
  - packages/db/prisma/schema.prisma:252 (UserProfile)
  - packages/db/prisma/schema.prisma:900 (OccupationCategory)
  - packages/db/prisma/schema.prisma:923 (HarvestCalendar)
  - packages/db/prisma/schema.prisma:945 (MarketInsight)
- اسکیماهای shared برای agri حاضرند:
  - packages/shared/src/schemas/agri.schema.ts:5
  - packages/shared/src/schemas/agri.schema.ts:28
  - packages/shared/src/schemas/agri.schema.ts:51
- UI عمومی حاضر است:
  - apps/web/src/routes/harvest-calendar.tsx:6
  - apps/web/src/routes/market-insights.tsx:6
- UI ادمین حاضر است:
  - apps/web/src/routes/_authenticated/admin/taxonomy.tsx:10
  - apps/web/src/routes/_authenticated/admin/harvest.tsx:10
  - apps/web/src/routes/_authenticated/admin/market.tsx:10
- تست‌های agri backend و e2e پایه حاضرند:
  - apps/server/src/interface/trpc/routers/__tests__/agri.test.ts:22
  - apps/server/src/interface/trpc/routers/__tests__/agri.test.ts:76
  - apps/server/src/interface/trpc/routers/__tests__/agri.test.ts:130
  - e2e/agri.spec.ts:71
  - e2e/agri.spec.ts:133

## گپ‌های واقعی نسبت به Roadmap (Remaining)

### P0 (باید اول انجام شود)
1. تاییدات کسب‌وکاری Pilot هنوز باز است (taxonomy نهایی، معیار تایید مجوز، مرز MVP، داده دمو).
2. مانیتورینگ زیرساختی (GlitchTip + logging): تایید عملیاتی staging در CT 204 انجام شد و این مورد بسته شد.
3. مهاجرت محتوایی واژگان دامنه قدیمی هنوز به‌صورت کامل و کنترل‌شده بسته نشده است.

### P1 (بعد از بستن P0)
1. پوشش تست E2E سناریوهای CRUD ادمین taxonomy/harvest/market:
  - تکمیل شد: suite اضافه شده، flow پایدار شده، و green نهایی روی staging ثبت شد (`3 passed`).
2. بهینه‌سازی chunk size در web build (هشدار chunk > 500kB).
3. تکمیل گزارش‌های پایه مدیریتی و چک‌لیست regression قبل از release.

### P2 (اختیاری/مرحله بعد)
1. AI کمکی با guardrail سخت‌گیرانه.
2. یکپارچه‌سازی‌های رسمی بیرونی.

## اولویت اجرای پیشنهادی من (از همین الان)
1. بستن P0-فنی داخلی: AuditLog + تصمیم تک‌/چند شغل + تست regression مرتبط.
2. بستن P0-غیرفنی: تاییدهای Product/کارفرما و Freeze taxonomy.
3. شروع hardening انتشار: مانیتورینگ staging + smoke کامل + rollout checklist.

## کار بعدی که پیشنهاد می‌دهم بلافاصله اجرا شود
- اجرای smoke/critical-path کامل روی staging (فراتر از admin CRUD) و سپس جمع‌بندی regression checklist قبل از release.
