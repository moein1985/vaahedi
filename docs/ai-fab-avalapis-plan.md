# برنامه پیاده سازی FAB چت AI (Avalapis)

تاریخ: 2026-05-04
وضعیت: در حال اجرا
دامنه: MVP

## 1) هدف

- افزودن FAB در صفحه اصلی (Dashboard) برای شروع سریع چت با AI.
- استفاده از مسیر AI فعلی بک اند و یکپارچه سازی با Avalapis.
- ارسال context واقعی کاربر به Orchestrator:
  - حوزه فعالیت (activityType / commodityGroup)
  - خدمات/کدهای فعال کاربر (serviceCode)
  - خدمات پلتفرم (RFQ, Marketplace, Messages, Documents, Finance, HS Codes, Circulars, Support)

## 2) تصمیم های فنی

- Endpoint: `POST /v1/chat/completions`
- Base URL پیش فرض: `https://api.avalapis.ir/v1`
- مدل پیش فرض کم هزینه: `gemini-3.1-flash-lite-preview`
- نگهداری کلید API فقط در سمت سرور (env)

## 3) طراحی MVP

- FAB فقط روی مسیر Dashboard نمایش داده می شود.
- کلیک روی FAB یک پنل سبک چت باز می کند.
- در اولین استفاده، یک conversation جدید ایجاد می شود.
- پیام کاربر به `trpc.chat.sendMessage` ارسال می شود.
- پاسخ AI در همان پنل نمایش داده می شود.

## 4) Orchestrator Context

- داده های پروفایل:
  - نقش کاربر
  - companyName / unitName
  - activityType
  - commodityGroup
  - درصد تکمیل پروفایل
- داده های عملیاتی:
  - تعداد کالاها
  - تعداد RFQ فعال
  - تعداد اعلان خوانده نشده
  - serviceCode های فعال کاربر از محصولات و trade requests
- داده ثابت پلتفرم:
  - فهرست خدمات جاری محصول

## 5) معیار پذیرش

- FAB روی Dashboard قابل مشاهده و قابل استفاده باشد.
- ارسال پیام و دریافت پاسخ AI بدون خطای UI انجام شود.
- در لاگ/رفتار سیستم مشخص باشد context کاربر به AI تزریق می شود.
- اگر AI key تنظیم نباشد، پیام خطای قابل فهم نمایش داده شود.

## 6) ریسک ها

- محدودیت نرخ یا تاخیر Avalapis:
  - مدیریت خطای 429/5xx در لایه API و پیام مناسب در UI.
- کیفیت پاسخ:
  - بهبود تدریجی system prompt و context با بازخورد.

## 7) گام های بعدی

- افزودن استریم پاسخ در FAB.
- اضافه کردن حافظه کوتاه مدت گفتگو و خلاصه سازی context.
- اضافه کردن گزارش هزینه بر مبنای `x-request-id` و User API.
