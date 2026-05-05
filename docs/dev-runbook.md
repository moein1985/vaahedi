# Runbook: راه‌اندازی محیط توسعه و اجرای تست

تاریخ: 2026-05-03  
کاربرد: هر بار که نیاز است محیط dev + E2E از صفر بالا بیاید

---

## پیش‌نیازها

- Docker Desktop در حال اجرا
- Node.js >=20 و npm >=10
- پورت‌های آزاد: **4000** (backend)، **3002** (frontend)، **5433** (postgres)، **6379** (redis)، **9000/9001** (minio)

---

## مرحله 1 — سرویس‌های زیرساختی

```powershell
# بالا آوردن postgres/redis/minio
docker compose -f docker-compose.dev.yml up -d

# بررسی سلامت سرویس‌ها (باید healthy باشند)
docker compose -f docker-compose.dev.yml ps
```

### مشکل رایج: تداخل پورت 5433

اگر خطای `Bind for 0.0.0.0:5433 failed` دیدید، یعنی یک کانتینر دیگر روی همین پورت است:

```powershell
# پیدا کردن کانتینر متداخل
docker ps --format "table {{.Names}}\t{{.Ports}}" | Select-String "5433"

# متوقف کردن موقت آن
docker stop <CONTAINER_NAME>

# بالا آوردن مجدد postgres پروژه
docker compose -f docker-compose.dev.yml up -d postgres
```

---

## مرحله 2 — migration و seed دیتابیس

```powershell
# تنظیم متغیر محیطی (اگر .env در ریشه وجود دارد این مرحله اختیاری است)
$env:DATABASE_URL = 'postgresql://vaahedi:vaahedi_pass@localhost:5433/vaahedi?schema=public'

# اجرای migration
npm run db:migrate:prod --workspace @repo/db

# اجرای seed (کاربر admin با کد 0000001 / Admin@1234 ساخته می‌شود)
npm run db:seed --workspace @repo/db
```

> اگر seed را قبلاً اجرا کرده‌اید upsert است و خطا نمی‌دهد. بی‌خطر است.

---

## مرحله 3 — بالا آوردن سرویس‌های برنامه

هر دستور را در یک ترمینال جداگانه اجرا کنید:

```powershell
# ترمینال 1 — Backend (port 4000)
npm run dev --workspace @repo/server
```

```powershell
# ترمینال 2 — Frontend (port 3002)
# --host 0.0.0.0 ضروری است تا Playwright روی localhost:3002 دسترسی داشته باشد
npm run dev --workspace @repo/web -- --host 0.0.0.0 --port 3002
```

### تأیید سلامت سرویس‌ها

```powershell
# Backend health
(Invoke-WebRequest -Uri http://localhost:4000/health -UseBasicParsing).StatusCode
# انتظار: 200

# Frontend
(Invoke-WebRequest -Uri http://localhost:3002/auth/login -UseBasicParsing).StatusCode
# انتظار: 200
```

---

## مرحله 4 — اجرای تست‌های E2E

```powershell
# اجرای کل مجموعه
npx playwright test

# تست‌های بحرانی مسیر اصلی
npx playwright test e2e/critical-paths.spec.ts

# تست‌های هدفمند RFQ/Chat
npx playwright test e2e/critical-paths.spec.ts --grep "RFQ|Chat"

# مشاهده گزارش HTML
npx playwright show-report
```

---

## مرجع سریع — اطلاعات seed

| فیلد | مقدار |
|------|-------|
| کد کاربری | `0000001` |
| رمز عبور | `Admin@1234` |
| نقش | TRADER + SUPER_ADMIN |
| ایمیل | admin@vaahedi.ir |
| موبایل | 09000000000 |

---

## توقف محیط

```powershell
# متوقف کردن سرویس‌های Docker
docker compose -f docker-compose.dev.yml down

# متوقف کردن backend و frontend
# با Ctrl+C در ترمینال‌های مربوطه
```

---

## عیب‌یابی سریع

| خطا | علت احتمالی | راه‌حل |
|-----|------------|--------|
| `ERR_CONNECTION_REFUSED localhost:3002` | Vite فقط روی IPv6 listen کرده | `--host 0.0.0.0` اضافه کنید |
| `Environment variable not found: DATABASE_URL` | .env لود نشده در Prisma CLI | `$env:DATABASE_URL` را دستی تنظیم کنید |
| `Bind for 0.0.0.0:5433 failed` | تداخل با کانتینر دیگر | کانتینر متداخل را stop کنید |
| تست لاگین timeout | کاربر seed وجود ندارد | مرحله 2 (seed) را دوباره اجرا کنید |
| `[Redis] WRONGTYPE` | داده قدیمی ناسازگار در Redis | `docker compose ... down -v` و راه‌اندازی مجدد |
