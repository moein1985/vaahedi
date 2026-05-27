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
2. مانیتورینگ زیرساختی (GlitchTip + logging) از نظر کدنویسی انجام شد و فقط تایید عملیاتی روی staging باقی مانده است.
3. مهاجرت محتوایی واژگان دامنه قدیمی هنوز به‌صورت کامل و کنترل‌شده بسته نشده است.

### P1 (بعد از بستن P0)
1. پوشش تست E2E سناریوهای CRUD ادمین taxonomy/harvest/market باید کامل‌تر شود.
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
- اجرای سناریوهای E2E ادمین برای CRUD کامل taxonomy/harvest/market روی staging و نهایی‌سازی چک‌لیست Pilot.
