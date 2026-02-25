# سند مشخصات فنی و اجرایی پروژه
## پلتفرم تجارت متمرکز هوشمند ایرانیان

**تاریخ تنظیم:** اسفند ۱۴۰۴  
**نسخه سند:** 1.0  
**تهیه‌کننده:** تیم توسعه  
**وضعیت:** منتظر بازخورد کارفرما

---

## فهرست مطالب
1. [خلاصه اجرایی](#1-خلاصه-اجرایی)
2. [استک فنی و معماری](#2-استک-فنی-و-معماری)
3. [معماری سیستم](#3-معماری-سیستم)
4. [شرح ماژول‌ها و قابلیت‌ها](#4-شرح-ماژول‌ها-و-قابلیت‌ها)
5. [مدل داده (Entity‌های اصلی)](#5-مدل-داده)
6. [نقشه API (tRPC Routers)](#6-نقشه-api)
7. [زیرساخت و DevOps](#7-زیرساخت-و-devops)
8. [چت هوشمند (فاز آینده)](#8-چت-هوشمند-فاز-آینده)
9. [ابهامات و سؤالات از کارفرما](#9-ابهامات-و-سؤالات-از-کارفرما)
10. [تخمین زمان‌بندی فازها](#10-تخمین-زمان‌بندی-فازها)
11. [ضمائم](#11-ضمائم)

---

## 1. خلاصه اجرایی

هدف پروژه، طراحی و پیاده‌سازی یک **پلتفرم B2B تجارت الکترونیک** برای مرکز تجارت متمرکز هوشمند ایرانیان است. این پلتفرم به‌عنوان واسط دیجیتال بین:

- صادرکنندگان و واردکنندگان
- تولیدکنندگان صنعتی و کارخانه‌ها
- شرکت‌های دانش‌بنیان
- کارگزاران و عمده‌فروشان
- شرکت‌های واسط (فاقد کارت بازرگانی)

عمل می‌کند و تحت نظارت **انجمن صنفی واردکنندگان و صادرکنندگان کالا و خدمات خراسان رضوی** اداره می‌شود.

---

## 2. استک فنی و معماری

### 2.1. Frontend
| فناوری | نسخه | کاربرد |
|---------|-------|--------|
| React | 19.x | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 6.x | Build Tool |
| TanStack Router | latest | Routing (Type-safe) |
| TanStack Query | v5 | Server State Management |
| Zustand | latest | Client State Management |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | Component Library |
| React Hook Form + Zod | latest | Form Management & Validation |
| i18next | latest | چندزبانگی (فارسی/انگلیسی) |

### 2.2. Backend
| فناوری | نسخه | کاربرد |
|---------|-------|--------|
| Node.js | 22 LTS | Runtime |
| TypeScript | 5.x | Type Safety |
| tRPC | v11 | API Layer (End-to-End Type Safety) |
| Fastify | latest | HTTP Server (Adapter for tRPC) |
| Prisma | latest | ORM |
| PostgreSQL | 17 | Primary Database |
| Redis | 7.x | Caching / Session / Queue |
| MinIO / S3 | latest | Object Storage (اسناد و تصاویر) |
| BullMQ | latest | Job Queue (ایمیل، نوتیفیکیشن) |
| Zod | latest | Schema Validation (مشترک با Frontend) |

### 2.3. Shared
| فناوری | کاربرد |
|---------|--------|
| Turborepo | Monorepo Management |
| `@repo/shared` | Zod Schemas, Types, Constants مشترک |
| `@repo/db` | Prisma Client و Migration‌ها |

### 2.4. DevOps & Infrastructure
| فناوری | کاربرد |
|---------|--------|
| Docker + Docker Compose | Containerization |
| Nginx | Reverse Proxy + SSL |
| GitHub Actions | CI/CD |
| Sentry | Error Tracking |
| Prometheus + Grafana | Monitoring (اختیاری) |

---

## 3. معماری سیستم

### 3.1. Clean Architecture

پروژه از اصول **Clean Architecture** پیروی می‌کند. هر لایه فقط به لایه داخلی‌تر وابسته است:

```
┌─────────────────────────────────────────────┐
│            Presentation Layer               │
│   (React Components, Pages, Hooks)          │
├─────────────────────────────────────────────┤
│            Interface Adapters               │
│   (tRPC Routers, Controllers, Presenters)   │
├─────────────────────────────────────────────┤
│            Application Layer                │
│   (Use Cases / Services)                    │
├─────────────────────────────────────────────┤
│            Domain Layer                     │
│   (Entities, Value Objects, Domain Events)  │
├─────────────────────────────────────────────┤
│            Infrastructure Layer             │
│   (Prisma Repos, S3, Redis, Email, AI)      │
└─────────────────────────────────────────────┘
```

### 3.2. ساختار پوشه‌ها (Monorepo)

```
vaahedi/
├── apps/
│   ├── web/                          # React Frontend
│   │   ├── src/
│   │   │   ├── app/                  # Routes & Pages
│   │   │   ├── components/           # UI Components
│   │   │   │   ├── ui/               # shadcn base components
│   │   │   │   └── domain/           # Business-specific components
│   │   │   ├── features/             # Feature-based modules
│   │   │   │   ├── auth/
│   │   │   │   ├── profile/
│   │   │   │   ├── product/
│   │   │   │   ├── trade/
│   │   │   │   └── chat/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── trpc.ts               # tRPC client setup
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── server/                       # Node.js Backend
│       ├── src/
│       │   ├── domain/               # 🟢 Domain Layer
│       │   │   ├── entities/
│       │   │   │   ├── User.ts
│       │   │   │   ├── Company.ts
│       │   │   │   ├── Product.ts
│       │   │   │   └── TradeRequest.ts
│       │   │   ├── value-objects/
│       │   │   │   ├── NationalCode.ts
│       │   │   │   ├── BusinessLicense.ts
│       │   │   │   └── TariffCode.ts
│       │   │   ├── enums/
│       │   │   │   ├── UserRole.ts
│       │   │   │   ├── MembershipType.ts
│       │   │   │   └── TradeType.ts
│       │   │   └── repositories/     # Repository Interfaces (Ports)
│       │   │       ├── IUserRepository.ts
│       │   │       ├── IProductRepository.ts
│       │   │       └── ITradeRepository.ts
│       │   │
│       │   ├── application/          # 🟡 Application Layer (Use Cases)
│       │   │   ├── auth/
│       │   │   │   ├── RegisterUseCase.ts
│       │   │   │   ├── LoginUseCase.ts
│       │   │   │   └── VerifyDocumentsUseCase.ts
│       │   │   ├── profile/
│       │   │   │   ├── CreateProfileUseCase.ts
│       │   │   │   └── UpdateProfileUseCase.ts
│       │   │   ├── product/
│       │   │   │   ├── CreateProductUseCase.ts
│       │   │   │   ├── ListProductsUseCase.ts
│       │   │   │   └── SearchProductsUseCase.ts
│       │   │   ├── trade/
│       │   │   │   ├── CreateTradeRequestUseCase.ts
│       │   │   │   ├── MatchBuyerSellerUseCase.ts
│       │   │   │   └── TradeAnalysisUseCase.ts
│       │   │   └── ports/            # Port Interfaces
│       │   │       ├── IStorageService.ts
│       │   │       ├── IEmailService.ts
│       │   │       ├── INotificationService.ts
│       │   │       └── IAIChatService.ts
│       │   │
│       │   ├── infrastructure/       # 🔴 Infrastructure Layer
│       │   │   ├── database/
│       │   │   │   └── prisma/
│       │   │   ├── repositories/     # Repository Implementations
│       │   │   │   ├── PrismaUserRepository.ts
│       │   │   │   ├── PrismaProductRepository.ts
│       │   │   │   └── PrismaTradeRepository.ts
│       │   │   ├── storage/
│       │   │   │   └── MinioStorageService.ts
│       │   │   ├── email/
│       │   │   │   └── SmtpEmailService.ts
│       │   │   ├── ai/
│       │   │   │   └── AvalaiChatService.ts
│       │   │   └── cache/
│       │   │       └── RedisCacheService.ts
│       │   │
│       │   ├── interface/            # 🔵 Interface Adapters
│       │   │   ├── trpc/
│       │   │   │   ├── router.ts     # Root Router
│       │   │   │   ├── context.ts    # tRPC Context
│       │   │   │   ├── middleware/
│       │   │   │   │   ├── auth.ts
│       │   │   │   │   ├── rateLimit.ts
│       │   │   │   │   └── logging.ts
│       │   │   │   └── routers/
│       │   │   │       ├── auth.router.ts
│       │   │   │       ├── profile.router.ts
│       │   │   │       ├── product.router.ts
│       │   │   │       ├── trade.router.ts
│       │   │   │       ├── admin.router.ts
│       │   │   │       └── chat.router.ts
│       │   │   └── http/
│       │   │       └── healthcheck.ts
│       │   │
│       │   └── main.ts              # Application Bootstrap
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── shared/                       # Shared Types & Schemas
│   │   ├── src/
│   │   │   ├── schemas/             # Zod Schemas
│   │   │   ├── types/               # TypeScript Types
│   │   │   ├── constants/           # Enums, Codes
│   │   │   └── utils/               # Shared Utilities
│   │   └── package.json
│   │
│   ├── db/                           # Database Package
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   └── eslint-config/               # Shared ESLint Config
│       └── package.json
│
├── docker/
│   ├── nginx/
│   │   └── nginx.conf
│   ├── postgres/
│   │   └── init.sql
│   └── redis/
│       └── redis.conf
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── turbo.json
├── package.json
├── .env.example
└── README.md
```

### 3.3. نمودار سطح بالای سیستم

```
                    ┌──────────────┐
                    │   کاربران    │
                    └──────┬───────┘
                           │ HTTPS
                    ┌──────▼───────┐
                    │    Nginx     │
                    │ Reverse Proxy│
                    └──┬───────┬───┘
                       │       │
            ┌──────────▼─┐  ┌──▼──────────┐
            │  React App │  │  Node.js    │
            │  (Static)  │  │  (tRPC API) │
            │  Port 3000 │  │  Port 4000  │
            └────────────┘  └──┬──┬──┬────┘
                               │  │  │
                 ┌─────────────┘  │  └─────────────┐
                 │                │                 │
          ┌──────▼─────┐  ┌──────▼─────┐  ┌───────▼──────┐
          │ PostgreSQL │  │   Redis    │  │    MinIO     │
          │ Port 5432  │  │ Port 6379  │  │  Port 9000   │
          └────────────┘  └────────────┘  └──────────────┘
                                                 │
                                          ┌──────▼──────┐
                                          │  avalai.ir  │
                                          │  Gemini API │
                                          │ (فاز آینده) │
                                          └─────────────┘
```

---

## 4. شرح ماژول‌ها و قابلیت‌ها

### 4.1. ماژول احراز هویت و عضویت (`auth`)

| قابلیت | شرح | اولویت |
|--------|------|--------|
| ثبت‌نام حقیقی | با کد ملی، شماره همراه، تأیید OTP | P0 |
| ثبت‌نام حقوقی | با شماره ثبت شرکت، شناسه ملی، اطلاعات مدیرعامل | P0 |
| ورود با رمز | یوزرنیم (کد کاربری) + رمز عبور | P0 |
| ورود با OTP | شماره همراه + کد تأیید | P1 |
| کد امنیتی (Captcha) | تصویر امنیتی در صفحه ورود | P0 |
| تولید کد کاربری خودکار | بر اساس فرمول: `[نوع فعالیت 2 رقم][حوزه کالایی 2 رقم][شمارشی]` | P0 |
| مدیریت نشست | JWT (Access + Refresh Token) ذخیره در httpOnly cookie | P0 |

#### فرمول کد کاربری (از سند):
```
[2 رقم: حوزه فعالیت شغلی] + [2 رقم: نوع حوزه کالایی/تولیدی] + [2+ رقم: شمارشی]
```

**⚠️ ابهام شماره ۱:** جدول نگاشت کدهای حوزه فعالیت و حوزه کالایی از کارفرما دریافت نشده.

---

### 4.2. ماژول پروفایل کاربر (`profile`)

#### نقش‌های قابل انتخاب:
| کد | نقش | توضیح |
|----|------|--------|
| `TRADER` | تاجر | واردکننده/صادرکننده دارای کارت بازرگانی |
| `PRODUCER` | تولیدکننده | دارای مجوز تولید و پروانه بهره‌برداری |
| `KNOWLEDGE_BASED` | دانش‌بنیان | دارای مجوز دانش‌بنیان |
| `WHOLESALER` | عمده‌فروش | عمده‌فروش کالا |
| `BROKER` | کارگزار | واسطه بازرگانی |
| `INTERMEDIARY` | شرکت واسط | بدون کارت بازرگانی |
| `GUILD` | صنفی | دارای مجوز صنفی |

#### فیلدهای پروفایل:
```
اطلاعات پایه:
  ├── نام و نام خانوادگی
  ├── کد ملی
  ├── شناسه ملی (اشخاص حقوقی)
  ├── کد صنفی
  ├── شناسه کسب و کار
  ├── تلفن ثابت / همراه
  ├── آدرس ایمیل
  ├── کد پستی
  └── سابقه فعالیت (سال)

اطلاعات سازمانی:
  ├── نام شرکت / واحد تولیدی-صنعتی
  ├── نوع واحد (بر اساس دسته‌بندی تعریف‌شده)
  │   ├── واحد نوع 1
  │   ├── واحد نوع 2
  │   └── واحد نوع 3
  ├── سمت / مسئولیت سازمانی
  ├── نوع فعالیت (شرکتی/صنفی/صنعتی/...)
  └── نوع گروه‌بندی کالایی (صنعتی/شیمیایی/مخابراتی/فلزی/...)

مجوزها و مدارک (بارگذاری تصویر):
  ├── 1. آگهی تأسیس شرکت
  ├── 2. آخرین تغییرات هیئت مدیره (از لحاظ حق امضاء)
  ├── 3. تصویر پروانه بهره‌برداری
  ├── 4. مجوز تأسیس تولید صنعتی / کارگاهی
  ├── 5. مجوز صنفی معتبر
  ├── 6. مجوز دانش‌بنیان
  ├── 7. سایر مجوزهای مرتبط (برای گریدبندی عضویت)
  ├── 8. گواهی ایزو و استانداردها
  └── 9. تصویر کارت بازرگانی
```

**⚠️ ابهام شماره ۲:** دسته‌بندی «نوع واحد» (۱، ۲، ۳) در سند مشخص نشده.  
**⚠️ ابهام شماره ۳:** نحوه «گریدبندی عضویت» بر اساس مجوزها تعریف نشده.  
**⚠️ ابهام شماره ۴:** حداکثر حجم فایل هر مدرک و فرمت‌های مجاز چیست؟

---

### 4.3. ماژول محصول (`product`)

#### فیلدهای پروفایل محصول:
| فیلد | نوع | توضیح |
|------|------|--------|
| نام فارسی و انگلیسی | `string` | نام رسمی کالا |
| گرید محصول | `string` | درجه‌بندی کیفی |
| شناسه کالا/خدمات | `string` | - |
| کد تعرفه گمرکی | `string` | HS Code |
| مشخصات فنی | `text` | شرح فنی محصول |
| تصویر واقعی کالا | `file[]` | بدون تبلیغات - عکس واقعی |
| ابعاد و وزن | `object` | طول/عرض/ارتفاع/وزن |
| شماره استاندارد | `string` | کد استاندارد ملی |
| منشأ کالا | `enum` | دانش‌بنیان / تولید کارخانه / وارداتی |
| نوع بسته‌بندی | `string` | فله/جامبو/کیسه/تانکر/پالت/کارتن |
| شرایط تحویل (Incoterms) | `enum` | `EXW` / `FCA` / `FOB` |
| مبدأ کالا | `string` | شهر/کشور |
| حداقل ثبت سفارش | `string` | تعداد / تناژ |
| زمان آماده‌سازی تحویل | `string` | روز/هفته |
| شرایط فروش | `object` | درصد پیش‌نقد + درصد موقع تحویل |
| نحوه پرداخت | `enum` | `LC` / `SBLC` / `TT` |
| کلیپ کارخانه / محصول | `file` | ویدئو از خط تولید یا انبار |
| مجوزهای تخصصی محصول | `file[]` | مدارک خاص محصول |
| تاریخ تولید / انقضا | `date` | - |

---

### 4.4. ماژول خرید و فروش (`trade`)

#### فرآیند درخواست تجاری:

```
                     ┌─────────────────┐
                     │  ورود به سایت   │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  ثبت‌نام/ورود   │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  تکمیل پروفایل │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │   تأیید مدارک   │
                     │  (توسط کارشناس) │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  دریافت کد عضو │
                     └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────▼───────┐      │     ┌─────────▼────────┐
     │ ثبت محصول برای │      │     │ ثبت درخواست خرید │
     │     فروش       │      │     │                  │
     └────────┬───────┘      │     └─────────┬────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                     ┌────────▼────────┐
                     │  تطبیق خریدار   │
                     │  و فروشنده      │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │ مذاکره و توافق  │
                     │  (انجمن=حَکَم)  │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  نهایی‌سازی     │
                     │  معامله         │
                     └────────────────┘
```

#### جدول درخواست خرید/فروش:
| فیلد | توضیح |
|------|--------|
| کد ورود متقاضی فروش | شناسه فروشنده |
| موجودی کالا | وضعیت انبار |
| نوع کالا | دسته‌بندی |
| کد ورود متقاضی خرید | شناسه خریدار |
| درخواست خرید | مشخصات مورد نیاز |

#### دو روش جذب مشتری:
1. **فعال (Outbound):** تیم بازرگانی انجمن با شرکت‌ها به‌صورت رایگان ارتباط برقرار می‌کند
2. **غیرفعال (Inbound):** عضویت دائم شرکت‌ها همراه با آدرس و کد امنیتی — بدون دخالت انجمن

**⚠️ ابهام شماره ۵:** فرآیند «تطبیق خریدار و فروشنده» دقیقاً چگونه انجام می‌شود؟ الگوریتمی/دستی/هر دو؟  
**⚠️ ابهام شماره ۶:** نقش «حکم مرضی‌الطرفین» انجمن در سیستم چه workflow دیجیتالی دارد؟

---

### 4.5. ماژول خدمات و لیست‌ها (`services`)

| قابلیت | شرح |
|--------|------|
| لیست کدهای تعرفه گمرکی | جستجو و فیلتر بر اساس حوزه واردات/صادرات |
| لیست کدهای آیسیک (ISIC) | کدهای طبقه‌بندی صنعتی |
| لیست حوزه دسته‌بندی کالایی | دسته‌بندی گروه‌های کالایی |
| بخشنامه‌ها | آرشیو بخشنامه‌های مرتبط بازرگانی |
| مشاوره تخصصی | امور گمرکی، ارزی، خرید کالایی، رفع تعهدات ارزی، لجستیک |

**⚠️ ابهام شماره ۷:** دیتابیس کدهای تعرفه گمرکی و آیسیک از چه منبعی تأمین می‌شود؟ آیا API وجود دارد یا باید import شود؟  
**⚠️ ابهام شماره ۸:** بخشنامه‌ها توسط چه کسی و با چه فرآیندی در سایت منتشر می‌شود؟

---

### 4.6. ماژول درباره ما (`about`)

| قابلیت | شرح |
|--------|------|
| معرفی انجمن | متن استاتیک + تصاویر |
| چارت سازمانی | نمودار سلسله‌مراتبی مدیران |
| معرفی مدیران | عکس + سمت + بیوگرافی مختصر |
| اهداف و چشم‌انداز | متن استاتیک |
| نقش انجمن در مرکز توسعه مطالعات | متن توضیحی |

---

### 4.7. ماژول دانلود (`downloads`)

| قابلیت | شرح |
|--------|------|
| کاتالوگ‌ها | PDF فایل‌های معرفی خدمات |
| کلیپ‌ها | ویدئوهای آموزشی و تبلیغی |
| فرم‌ها و مستندات | فرم‌های قابل دانلود |

---

### 4.8. ماژول ارتباط با ما و نظرسنجی (`contact`)

| قابلیت | شرح |
|--------|------|
| فرم تماس | ارسال پیام به کارشناس |
| نظرسنجی | فرم‌های نظرسنجی برای بازدیدکنندگان |
| اطلاعات تماس | آدرس، تلفن، ایمیل |

---

### 4.9. ماژول تبلیغات رسانه‌ای (`advertising`)

| قابلیت | شرح |
|--------|------|
| درخواست تبلیغ | متقاضیان درخواست تبلیغات درون‌سایتی ثبت کنند |
| مدیریت بنر | ناظر رسانه‌ای بنرها را مدیریت کند |
| ثبت کامنت تبلیغاتی | بر اساس پیام‌رسانی هدفمند |

**⚠️ ابهام شماره ۹:** مدل درآمدی تبلیغات چگونه است؟ (CPC/CPM/ثابت؟) آیا پرداخت آنلاین نیاز است؟

---

### 4.10. ماژول پنل ادمین (`admin`)

| قابلیت | شرح | اولویت |
|--------|------|--------|
| داشبورد | آمار کلی کاربران، محصولات، معاملات | P0 |
| مدیریت کاربران | لیست، جستجو، تغییر وضعیت، تأیید مدارک | P0 |
| تأیید پروفایل‌ها | بررسی و تأیید/رد مدارک بارگذاری‌شده | P0 |
| مدیریت محصولات | بررسی و تأیید محصولات ثبت‌شده | P0 |
| مدیریت بخشنامه‌ها | ایجاد، ویرایش، حذف بخشنامه‌ها | P1 |
| مدیریت تبلیغات | تأیید/رد درخواست‌های تبلیغاتی | P1 |
| مدیریت کدهای تعرفه | CRUD عملیات روی کدهای گمرکی و آیسیک | P1 |
| گزارش‌گیری | گزارش‌های آماری از عملکرد سیستم | P2 |
| مدیریت نظرسنجی | ایجاد و مشاهده نتایج نظرسنجی‌ها | P2 |

---

### 4.11. ماژول چت آنلاین پشتیبانی (`support-chat`)

| قابلیت | شرح |
|--------|------|
| چت زنده | ارتباط real-time کاربر با کارشناس |
| تیکت | در صورت آفلاین بودن کارشناس، ثبت تیکت |
| تاریخچه مکالمات | دسترسی کاربر و ادمین به تاریخچه |

---

### 4.12. ماژول تحلیل بازرگانی (`analysis`)

| قابلیت | شرح |
|--------|------|
| ثبت درخواست تحلیل | متقاضی درخواست تحلیل بازار را ثبت کند |
| پیگیری درخواست | مشاهده وضعیت درخواست |
| دریافت نتیجه | دانلود گزارش تحلیل |

**⚠️ ابهام شماره ۱۰:** تحلیل بازرگانی توسط سیستم خودکار انجام می‌شود یا توسط کارشناس انسانی؟

---

## 5. مدل داده

### 5.1. Entity‌های اصلی (ERD ساده‌شده)

```
┌────────────────┐     ┌────────────────────┐     ┌─────────────────┐
│      User      │────▶│    UserProfile     │────▶│    Document     │
│                │     │                    │     │                 │
│ id             │     │ id                 │     │ id              │
│ nationalCode   │     │ userId       (FK)  │     │ profileId (FK)  │
│ mobile         │     │ companyName        │     │ type (enum)     │
│ email          │     │ nationalId         │     │ fileUrl         │
│ passwordHash   │     │ role (enum)        │     │ status          │
│ userCode       │     │ activityType       │     │ verifiedAt      │
│ status         │     │ guildCode          │     │ verifiedBy      │
│ membershipType │     │ businessId         │     └─────────────────┘
│ createdAt      │     │ phone/fax          │
└────────────────┘     │ postalCode         │
                       │ experienceYears    │
                       │ membershipGrade    │
                       │ isVerified         │
                       └────────────────────┘

┌────────────────────┐     ┌──────────────────┐
│      Product       │     │   TradeRequest   │
│                    │     │                  │
│ id                 │     │ id               │
│ profileId    (FK)  │     │ type (BUY/SELL)  │
│ nameFa             │     │ requesterId (FK) │
│ nameEn             │     │ productId   (FK) │
│ grade              │     │ quantity         │
│ hsCode             │     │ status           │
│ isicCode           │     │ matchedWith (FK) │
│ technicalSpecs     │     │ notes            │
│ images[]           │     │ createdAt        │
│ weight/dimensions  │     └──────────────────┘
│ standardNumber     │
│ origin             │          ┌──────────────────┐
│ packagingType      │          │   Announcement   │
│ deliveryTerms      │          │                  │
│ deliveryLocation   │          │ id               │
│ minOrder           │          │ title            │
│ preparationTime    │          │ content          │
│ paymentTerms       │          │ publishedAt      │
│ paymentMethod      │          │ authorId   (FK)  │
│ saleConditions     │          └──────────────────┘
│ isApproved         │
│ createdAt          │     ┌──────────────────┐
└────────────────────┘     │   ChatMessage    │
                           │                  │
┌────────────────────┐     │ id               │
│   Advertisement    │     │ conversationId   │
│                    │     │ senderId   (FK)  │
│ id                 │     │ content          │
│ requesterId  (FK)  │     │ role (enum)      │
│ type               │     │ isAI             │
│ content            │     │ createdAt        │
│ status             │     └──────────────────┘
│ startDate          │
│ endDate            │     ┌──────────────────┐
│ createdAt          │     │     Survey       │
└────────────────────┘     │                  │
                           │ id               │
                           │ title            │
                           │ questions (JSON) │
                           │ responses (rel)  │
                           │ isActive         │
                           └──────────────────┘
```

---

## 6. نقشه API

### 6.1. tRPC Routers

```typescript
// Root Router Structure
appRouter = {
  // 🔐 Auth
  auth: {
    register:        mutation  // ثبت‌نام
    login:           mutation  // ورود
    logout:          mutation  // خروج
    refreshToken:    mutation  // بازیابی توکن
    verifyOtp:       mutation  // تأیید OTP
    forgotPassword:  mutation  // فراموشی رمز
  },

  // 👤 Profile
  profile: {
    get:             query     // دریافت پروفایل
    create:          mutation  // ایجاد پروفایل
    update:          mutation  // بروزرسانی
    uploadDocument:  mutation  // آپلود مدرک
    getDocuments:    query     // لیست مدارک
  },

  // 📦 Product
  product: {
    list:            query     // لیست محصولات (با فیلتر و صفحه‌بندی)
    getById:         query     // جزئیات محصول
    create:          mutation  // ثبت محصول
    update:          mutation  // ویرایش محصول
    delete:          mutation  // حذف محصول
    search:          query     // جستجوی پیشرفته
    uploadMedia:     mutation  // آپلود تصویر/ویدئو
  },

  // 🔄 Trade
  trade: {
    createRequest:   mutation  // ثبت درخواست خرید/فروش
    listRequests:    query     // لیست درخواست‌ها
    getMatches:      query     // تطبیق‌های پیشنهادی
    updateStatus:    mutation  // تغییر وضعیت معامله
    requestAnalysis: mutation  // درخواست تحلیل بازرگانی
  },

  // 📋 Services
  services: {
    searchHSCode:    query     // جستجوی کد تعرفه گمرکی
    searchISIC:      query     // جستجوی کد آیسیک
    listCategories:  query     // لیست دسته‌بندی‌ها
    listCirculars:   query     // لیست بخشنامه‌ها
    getCircular:     query     // جزئیات بخشنامه
  },

  // 📥 Downloads
  downloads: {
    list:            query     // لیست فایل‌های قابل دانلود
    getUrl:          query     // دریافت لینک دانلود
  },

  // 📞 Contact
  contact: {
    submit:          mutation  // ارسال فرم تماس
    submitSurvey:    mutation  // ارسال نظرسنجی
    getSurveys:      query     // لیست نظرسنجی‌های فعال
  },

  // 💬 Chat (فاز آینده - با AI)
  chat: {
    sendMessage:     mutation  // ارسال پیام
    getHistory:      query     // تاریخچه مکالمه
    listConversations: query   // لیست مکالمات
  },

  // 💬 Support Chat
  support: {
    startChat:       mutation  // شروع چت با کارشناس
    sendMessage:     mutation  // ارسال پیام
    getHistory:      query     // تاریخچه
    createTicket:    mutation  // ایجاد تیکت
  },

  // 📢 Advertising
  advertising: {
    requestAd:       mutation  // درخواست تبلیغ
    listMyAds:       query     // تبلیغات من
  },

  // 🔧 Admin
  admin: {
    users: {
      list:          query
      verify:        mutation  // تأیید مدارک کاربر
      changeStatus:  mutation
      getDetails:    query
    },
    products: {
      listPending:   query
      approve:       mutation
      reject:        mutation
    },
    circulars: {
      create:        mutation
      update:        mutation
      delete:        mutation
    },
    ads: {
      listPending:   query
      approve:       mutation
      reject:        mutation
    },
    analytics: {
      dashboard:     query     // آمار داشبورد
      reports:       query     // گزارش‌ها
    }
  }
}
```

---

## 7. زیرساخت و DevOps

### 7.1. Docker Compose (Production)

```yaml
# ساختار سرویس‌ها
services:
  nginx:          # Reverse Proxy + SSL Termination
  web:            # React Frontend (served as static by nginx)
  api:            # Node.js tRPC Backend
  postgres:       # Primary Database
  redis:          # Cache + Sessions + Queue
  minio:          # Object Storage
  worker:         # Background Job Worker (BullMQ)
```

### 7.2. شبکه و امنیت

| لایه | اقدام |
|------|--------|
| Transport | HTTPS (Let's Encrypt / Certbot) |
| API | Rate Limiting (per IP + per User) |
| Input | Zod Validation در هر دو سمت |
| Auth | JWT httpOnly Secure Cookie |
| CORS | محدود به دامنه اصلی |
| Upload | فیلتر MIME type + محدودیت حجم |
| SQL | Prisma Parameterized Queries |
| XSS | DOMPurify + CSP Headers |
| CSRF | SameSite Cookie + Custom Header |

### 7.3. استراتژی Deploy

```
┌────────────┐     ┌──────────────┐     ┌──────────────┐
│   GitHub   │────▶│ GitHub       │────▶│  Production  │
│   Push     │     │ Actions CI   │     │  Server      │
│            │     │  - Lint      │     │  (Docker)    │
│            │     │  - Type Check│     │              │
│            │     │  - Test      │     │              │
│            │     │  - Build     │     │              │
│            │     │  - Deploy    │     │              │
└────────────┘     └──────────────┘     └──────────────┘
```

---

## 8. چت هوشمند (فاز آینده)

### 8.1. معماری چت با avalai.ir + Google Gemini

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  کاربر/     │     │   Backend    │     │  avalai.ir   │
│  صاحب کسب‌و │────▶│   tRPC API   │────▶│  Gemini API  │
│  کار        │     │              │     │              │
│             │◀────│  Stream /    │◀────│  Response    │
│             │     │  WebSocket   │     │              │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │
                    │  Chat History│
                    └──────────────┘
```

### 8.2. قابلیت‌های پیش‌بینی‌شده

| قابلیت | شرح |
|--------|------|
| چت عمومی | پاسخ به سؤالات کلی بازرگانی |
| چت تخصصی | راهنمایی در مورد کدهای گمرکی، مقررات ارزی |
| چت B2B | کمک در تطبیق خریدار و فروشنده |
| Context-Aware | آگاهی از پروفایل کاربر و تاریخچه فعالیت |
| Streaming | نمایش تدریجی پاسخ (SSE/WebSocket) |

### 8.3. پیاده‌سازی فنی

```typescript
// Infrastructure Layer - AI Chat Service
interface IAIChatService {
  sendMessage(params: {
    conversationId: string;
    message: string;
    context?: UserContext;
  }): AsyncIterable<string>;  // Streaming response

  getConversationHistory(conversationId: string): Promise<ChatMessage[]>;
}

// Implementation using avalai.ir API
class AvalaiChatService implements IAIChatService {
  // Uses OpenAI-compatible API format
  // Endpoint: https://api.avalai.ir/v1/chat/completions
  // Model: google/gemini-...
}
```

**⚠️ ابهام شماره ۱۱:** آیا System Prompt/Context خاصی برای چت‌بات در نظر گرفته شده؟ (مثلاً: فقط سؤالات بازرگانی پاسخ دهد)  
**⚠️ ابهام شماره ۱۲:** آیا چت‌بات باید به داده‌های داخلی سایت (محصولات، پروفایل‌ها) دسترسی داشته باشد؟ (RAG)

---

## 9. ابهامات و سؤالات از کارفرما

> ⚠️ **توجه: پاسخ به این سؤالات قبل از شروع توسعه الزامی است.**

### 🔴 سؤالات بحرانی (مانع شروع توسعه)

| # | سؤال | تأثیر |
|---|------|--------|
| 1 | **جدول نگاشت کدهای حوزه فعالیت شغلی و حوزه کالایی-تولیدی** برای تولید کد کاربری چیست؟ لیست کامل ۲ رقمی هر حوزه لازم است. | بدون این جدول، سیستم تولید کد کاربری قابل پیاده‌سازی نیست |
| 2 | **دسته‌بندی «نوع واحد» (۱، ۲، ۳)** در پروفایل دقیقاً چه معنایی دارد؟ | ساختار فرم پروفایل |
| 3 | **سیستم «گریدبندی عضویت»** بر اساس تعداد/نوع مجوزها چگونه محاسبه می‌شود؟ چند سطح وجود دارد و هر سطح چه مزایایی دارد؟ | تعریف Entity و Business Logic |
| 4 | **متن دقیق اقرارنامه الکترونیکی** که کاربر باید تأیید کند چیست؟ آیا متن حقوقی نهایی آماده است؟ | الزام قانونی قبل از عضویت |
| 5 | **منبع داده کدهای تعرفه گمرکی و کدهای آیسیک** کجاست؟ فایل Excel/CSV موجود است؟ | ماژول خدمات |

### 🟡 سؤالات مهم (لازم قبل از فاز مربوطه)

| # | سؤال | تأثیر |
|---|------|--------|
| 6 | **فرآیند تطبیق خریدار و فروشنده** چگونه است؟ خودکار (الگوریتمی)، دستی (توسط کارشناس)، یا ترکیبی؟ | معماری ماژول trade |
| 7 | **نقش «حکم مرضی‌الطرفین» انجمن** در سیستم چه workflow دیجیتالی‌ای دارد؟ آیا فقط ناظر است یا باید تأیید کند؟ | flow معاملات |
| 8 | فایل‌های بارگذاری مدارک: **حداکثر حجم** هر فایل چقدر باشد؟ **فرمت‌های مجاز** کدامند؟ (PDF/JPG/PNG؟) | تنظیمات storage |
| 9 | آیا سایت ابتدائاً **فقط فارسی** است یا **فارسی + انگلیسی** از ابتدا لازم است؟ | حجم کار UI |
| 10 | آیا **پرداخت آنلاین** (درگاه بانکی) برای هر بخشی نیاز است؟ (حق عضویت، تبلیغات، خدمات مشاوره) | یکپارچگی با درگاه |
| 11 | مدل درآمدی تبلیغات رسانه‌ای چگونه است؟ (**CPC/CPM/اشتراکی/ثابت**) | ماژول تبلیغات |
| 12 | **تحلیل بازرگانی** توسط سیستم خودکار انجام می‌شود یا کارشناس انسانی؟ | معماری ماژول analysis |

### 🟢 سؤالات تکمیلی (بهینه‌سازی)

| # | سؤال | تأثیر |
|---|------|--------|
| 13 | آیا **اپلیکیشن موبایل** یا **PWA** هم در آینده نیاز است؟ | انتخاب فناوری UI |
| 14 | **دسته‌بندی هشت‌گانه صنعتی** که در سند ذکر شده، دقیقاً شامل کدام صنایع می‌شود؟ | دسته‌بندی‌ها |
| 15 | آیا **نوتیفیکیشن** (ایمیل/SMS/Push) برای رویدادهایی مثل تأیید مدرک، تطبیق خریدار و... لازم است؟ | زیرساخت notification |
| 16 | آیا کاربر می‌تواند **چندین شرکت/واحد تولیدی** در یک حساب داشته باشد، یا هر شرکت حساب جداگانه دارد؟ | مدل داده |
| 17 | **System Prompt** چت‌بات AI: آیا فقط به سؤالات تجاری پاسخ دهد یا عمومی هم باشد؟ آیا باید به داده‌های داخلی سایت دسترسی داشته باشد؟ | فاز AI Chat |
| 18 | آیا **سطوح دسترسی ادمین** مختلف داریم؟ (ادمین کل، ناظر رسانه، کارشناس، بازاریاب) | RBAC سیستم |
| 19 | آیا نام «مرکز تجارت متمرکز هوشمند ایرانیان» نام تجاری نهایی سایت است؟ **دامنه سایت** چیست؟ | Branding و تنظیمات |
| 20 | آیا **لوگو، رنگ‌بندی و هویت بصری** برند آماده است یا باید طراحی شود؟ | طراحی UI |

---

## 10. تخمین زمان‌بندی فازها

> ⚠️ زمان‌بندی تقریبی است و پس از دریافت پاسخ ابهامات، نهایی می‌شود.

### فاز ۰ — زیرساخت و راه‌اندازی (هفته ۱-۲)
- [  ] راه‌اندازی Monorepo (Turborepo)
- [  ] Docker Compose (dev + prod)
- [  ] تنظیم CI/CD اولیه
- [  ] Prisma Schema اولیه + Migration
- [  ] تنظیم tRPC + Fastify
- [  ] تنظیم React + Vite + Tailwind
- [  ] Authentication base (JWT + OTP)

### فاز ۱ — هسته اصلی (هفته ۳-۶)
- [  ] ثبت‌نام و ورود (حقیقی + حقوقی)
- [  ] تولید کد کاربری خودکار
- [  ] پروفایل کاربر + بارگذاری مدارک
- [  ] پنل ادمین: مدیریت کاربران + تأیید مدارک
- [  ] صفحه «درباره ما»

### فاز ۲ — محصولات و تجارت (هفته ۷-۱۰)
- [  ] ثبت و مدیریت محصولات
- [  ] جستجو و فیلتر محصولات
- [  ] ثبت درخواست خرید/فروش
- [  ] سیستم تطبیق خریدار و فروشنده
- [  ] پنل ادمین: مدیریت محصولات

### فاز ۳ — خدمات و محتوا (هفته ۱۱-۱۳)
- [  ] لیست کدهای تعرفه گمرکی + جستجو
- [  ] لیست کدهای آیسیک
- [  ] بخشنامه‌ها
- [  ] مشاوره تخصصی
- [  ] دانلودها
- [  ] ارتباط با ما + نظرسنجی

### فاز ۴ — تکمیلی (هفته ۱۴-۱۶)
- [  ] تبلیغات رسانه‌ای
- [  ] چت آنلاین پشتیبانی (with کارشناس)
- [  ] تحلیل بازرگانی
- [  ] بهینه‌سازی SEO + عملکرد

### فاز ۵ — چت هوشمند AI (هفته ۱۷-۲۰)
- [  ] یکپارچگی با avalai.ir API
- [  ] طراحی System Prompt تخصصی بازرگانی
- [  ] ذخیره تاریخچه مکالمات
- [  ] Streaming responses (SSE)
- [  ] Context-aware با داده‌های پروفایل
- [  ] تست و بهینه‌سازی prompt

### فاز ۶ — QA و استقرار (هفته ۲۱-۲۲)
- [  ] تست جامع (Unit + Integration + E2E)
- [  ] Security audit
- [  ] Performance optimization
- [  ] استقرار production
- [  ] مستندسازی نهایی

---

## 11. ضمائم

### ضمیمه الف: Enum‌های سیستم

```typescript
enum UserRole {
  TRADER = 'TRADER',               // تاجر
  PRODUCER = 'PRODUCER',           // تولیدکننده
  KNOWLEDGE_BASED = 'KNOWLEDGE_BASED', // دانش‌بنیان
  WHOLESALER = 'WHOLESALER',       // عمده‌فروش
  BROKER = 'BROKER',               // کارگزار
  INTERMEDIARY = 'INTERMEDIARY',   // واسط
  GUILD = 'GUILD',                 // صنفی
}

enum MembershipType {
  INDIVIDUAL = 'INDIVIDUAL',       // حقیقی
  LEGAL = 'LEGAL',                 // حقوقی
}

enum TradeType {
  BUY = 'BUY',                     // خرید
  SELL = 'SELL',                   // فروش
}

enum DeliveryTerms {
  EXW = 'EXW',
  FCA = 'FCA',
  FOB = 'FOB',
}

enum PaymentMethod {
  LC = 'LC',
  SBLC = 'SBLC',
  TT = 'TT',
}

enum DocumentType {
  ESTABLISHMENT_NOTICE = 'ESTABLISHMENT_NOTICE',     // آگهی تأسیس
  BOARD_CHANGES = 'BOARD_CHANGES',                   // تغییرات هیئت مدیره
  OPERATION_LICENSE = 'OPERATION_LICENSE',             // پروانه بهره‌برداری
  PRODUCTION_LICENSE = 'PRODUCTION_LICENSE',           // مجوز تولید
  GUILD_LICENSE = 'GUILD_LICENSE',                     // مجوز صنفی
  KNOWLEDGE_BASED_LICENSE = 'KNOWLEDGE_BASED_LICENSE', // مجوز دانش‌بنیان
  OTHER_LICENSES = 'OTHER_LICENSES',                   // سایر مجوزها
  ISO_CERTIFICATE = 'ISO_CERTIFICATE',                 // گواهی ایزو
  BUSINESS_CARD = 'BUSINESS_CARD',                     // کارت بازرگانی
}

enum ProductOrigin {
  DOMESTIC_FACTORY = 'DOMESTIC_FACTORY',   // تولید کارخانه
  KNOWLEDGE_BASED = 'KNOWLEDGE_BASED',     // دانش‌بنیان
  IMPORTED = 'IMPORTED',                   // وارداتی
}

enum CommodityGroup {
  INDUSTRIAL = 'INDUSTRIAL',       // صنعتی
  CHEMICAL = 'CHEMICAL',           // شیمیایی
  TELECOM = 'TELECOM',             // مخابراتی
  METAL = 'METAL',                 // فلزی
  // ... بقیه گروه‌ها از کارفرما دریافت شود
}

enum TradeRequestStatus {
  PENDING = 'PENDING',             // در انتظار
  MATCHED = 'MATCHED',             // تطبیق‌یافته
  IN_NEGOTIATION = 'IN_NEGOTIATION', // در حال مذاکره
  COMPLETED = 'COMPLETED',         // تکمیل‌شده
  CANCELLED = 'CANCELLED',         // لغوشده
}

enum ProfileVerificationStatus {
  PENDING = 'PENDING',             // در انتظار بررسی
  APPROVED = 'APPROVED',           // تأیید‌شده
  REJECTED = 'REJECTED',           // رد‌شده
  NEEDS_REVISION = 'NEEDS_REVISION', // نیاز به اصلاح
}
```

### ضمیمه ب: نکات حقوقی مطرح‌شده در سند

1. اقرار الکترونیکی کاربر هنگام عضویت — مطابق **قوانین تجارت الکترونیک و رایانه‌ای**
2. انجمن صنفی به‌عنوان **حکم مرضی‌الطرفین** در خرید و فروش
3. متقاضی **تمام عواقب قانونی** محصول ارائه‌شده از لحاظ سلامت، استاندارد و مجوزهای قانونی را می‌پذیرد
4. کد عضویت بدون نام شرکت در سایت نمایش داده می‌شود (حفظ حریم محرمانگی)
5. مدارک قانونی باید از **درگاه ملی مجوزها** یا سازمان مربوطه باشد

### ضمیمه پ: Environment Variables مورد نیاز

```env
# Application
NODE_ENV=production
APP_PORT=4000
APP_URL=https://your-domain.ir
FRONTEND_URL=https://your-domain.ir

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/vaahedi?schema=public

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_ACCESS_SECRET=<random-secret>
JWT_REFRESH_SECRET=<random-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# MinIO / S3
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=<access-key>
S3_SECRET_KEY=<secret-key>
S3_BUCKET=vaahedi-uploads

# OTP / SMS
SMS_PROVIDER_API_KEY=<key>
SMS_PROVIDER_URL=https://api.sms-provider.ir

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@your-domain.ir
SMTP_PASS=<password>

# AI Chat (فاز آینده)
AVALAI_API_KEY=<api-key>
AVALAI_BASE_URL=https://api.avalai.ir/v1
AVALAI_MODEL=google/gemini-2.0-flash

# Sentry
SENTRY_DSN=<dsn>
```

---

**— پایان سند —**

> این سند پس از دریافت پاسخ ابهامات از کارفرما بروزرسانی خواهد شد.  
> نسخه بعدی شامل Wireframe‌های صفحات و Prisma Schema نهایی خواهد بود.
