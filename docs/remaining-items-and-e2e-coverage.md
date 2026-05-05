# موارد احتمالی باقی مانده + ماتریس پوشش E2E

تاریخ: 2026-04-28

## 0) وضعیت پیاده سازی (شروع شده)

- انجام شد:
  - بروزرسانی مسیر «مدرک هویتی/پاسپورت» در UI و پیام های اعتبارسنجی پروفایل
  - افزودن تست E2E اختصاصی: جلوگیری از ذخیره پروفایل وقتی مدرک هویتی/پاسپورت انتخاب شده اما آپلود نشده
  - افزودن «واحد مقدار» به فرم Trade (KG/TON/PIECE/LITER/METER) و انتقال آن به API
  - ذخیره مقدار + واحد در بک‌اند به صورت مقدار نرمال شده (مثال: `100 ton`)
  - افزودن تست E2E موفقیت آپلود PDF در مسیر محصول

- در حال انجام (گام بعد):
  - اجرای migration و تست های E2E مرتبط با پاسپورت

- انجام شده در این گام:
  - افزودن فیلدهای مستقل پاسپورت در پروفایل (شماره پاسپورت + تاریخ اعتبار) در دیتابیس
  - افزودن migration دیتابیس برای ستون های پاسپورت
  - افزودن فیلدهای پاسپورت در schema اشتراکی پروفایل
  - اتصال API پروفایل (upsert/update) به فیلدهای پاسپورت
  - افزودن ورودی های پاسپورت در فرم پروفایل وب
  - افزودن CTA عضویت (ثبت نام) کنار ورود در هدر صفحه اصلی
  - افزودن تست E2E برای دیده شدن CTA عضویت و ناوبری به صفحه ثبت نام
  - افزودن تست E2E برای سویچ زبان در صفحه اصلی و تغییر جهت RTL/LTR

## 1) خروجی سریع

این فایل بر اساس مقایسه مشکلات (DOCX/PDF) با roadmap و کد فعلی تهیه شده است.

- موردهای اصلی که احتمالاً هنوز کامل نشده اند:
  - اجرای migration پاسپورت در محیط های مقصد و حذف workaround تایپی موقت در UI
  - گسترش سناریوی چندزبانه (به جز صفحه اصلی) با assert متن های کلیدی
  - پوشش E2E برای واکنش گرایی موبایل/Android و جلوگیری از black-out در فیلتر

## 2) وضعیت تست های E2E موجود (دیده شده)

فایل های فعلی:

- e2e/critical-paths.spec.ts
- e2e/auth.spec.ts
- e2e/auth-complete-flow.spec.ts
- e2e/login.spec.ts
- e2e/profile.spec.ts
- e2e/admin.spec.ts
- e2e/simple.spec.ts

سناریوهای پوشش داده شده:

- Auth
  - ورود موفق
  - ورود ناموفق با رمز اشتباه
  - ثبت نام + ورود + رسیدن به داشبورد
  - خطای ثبت نام نامعتبر
- Profile
  - تکمیل پروفایل
  - جلوگیری از ذخیره وقتی مدرک الزامی آپلود نشده
- Product
  - رد شدن بازه تاریخ نامعتبر (expiry قبل از production)
- Trade
  - ثبت درخواست معامله با clarity fields
- Upload
  - رد شدن MIME نامعتبر
  - رد شدن فایل حجیم
- Admin
  - نمایش لیست کاربران
- Smoke
  - بارگذاری ساده صفی حه

## 3) ماتریس پوشش برای کامل شدن همه ویژگی ها

| ویژگی | وضعیت فعلی | شواهد E2E فعلی | گپ | اقدام پیشنهادی |
|---|---|---|---|---|
| ورود/احراز هویت | پوشش خوب | auth.spec.ts, login.spec.ts, auth-complete-flow.spec.ts, critical-paths.spec.ts | همپوشانی/تکرار برخی سناریوها | اختیاری: یکپارچه سازی تست های تکراری |
| ثبت نام + قوانین/توافق نامه | عمدتاً انجام شده | auth-complete-flow.spec.ts | نبود assert دقیق روی متن/لینک قوانین | افزودن تست terms-content-and-link |
| نقش فروشنده/خریدار در auth | در UI موجود | غیرمستقیم | سناریوی نقش ها به صورت صریح تست نشده | افزودن auth-role-selection.spec.ts |
| تکمیل پروفایل پایه | پوشش خوب | profile.spec.ts, critical-paths.spec.ts | نبود سناریوی passport | افزودن profile-passport-required.spec.ts |
| بارگذاری مدارک الزامی پروفایل | پوشش خوب | critical-paths.spec.ts | نیاز به سناریوی موفقیت همه مدارک | افزودن profile-docs-success.spec.ts |
| ثبت محصول (تاریخ) | پوشش خوب | critical-paths.spec.ts | ترتیب فیلدها/UX فرم تست نشده | افزودن product-form-order.spec.ts |
| آپلود رسانه محصول (image/video/pdf) | نیمه کامل | critical-paths.spec.ts (invalid type, oversize) | موفقیت PDF صراحتاً تست نشده | افزودن upload-success-pdf.spec.ts |
| ثبت درخواست تامین/معامله | انجام شده | critical-paths.spec.ts | unit برای quantity فعلاً دیده نمی شود | افزودن trade-quantity-unit.spec.ts پس از پیاده سازی |
| پنل ادمین | پوشش پایه | admin.spec.ts | فقط لیست کاربران | افزودن admin-permission-and-actions.spec.ts |
| صفحه اصلی + CTA عضویت | انجام شده | simple.spec.ts (page load + CTA visibility + register navigation) | نیاز به assert جایگاه بصری دقیق در صورت الزام UX | اختیاری: افزودن assertion دقیق محل CTA در هدر |
| فیلترها/کاتالوگ (عدم black-out) | نامشخص | شواهد مستقیم E2E دیده نشد | ریسک UI regression | افزودن catalog-filter-visibility.spec.ts |
| چندزبانه/RTL-LTR | پوشش پایه | simple.spec.ts (language switch + dir toggle) | نیاز به assert ترجمه کلیدی در چند صفحه | افزودن i18n-language-switch.spec.ts گسترده برای مسیرهای بیشتر |
| واکنش گرایی موبایل/Android | نامشخص | شواهد مستقیم E2E دیده نشد | ریسک UI mobile | افزودن responsive-mobile-android.spec.ts |

## 4) اولویت اجرای تست های جدید

1. profile-passport-required.spec.ts
2. trade-quantity-unit.spec.ts (بعد از اضافه شدن unit)
3. upload-success-pdf.spec.ts
4. home-membership-cta.spec.ts
5. i18n-language-switch.spec.ts
6. responsive-mobile-android.spec.ts
7. catalog-filter-visibility.spec.ts
8. product-form-order.spec.ts

## 5) Definition of Done برای پوشش کامل

وقتی موارد زیر برقرار باشد، می توان گفت پوشش E2E همه ویژگی های درخواستی کامل است:

- برای هر آیتم جدول بالا، حداقل یک تست سبز و پایدار وجود داشته باشد.
- سناریوی منفی + سناریوی مثبت برای فرم های حساس (auth/profile/product/trade/upload) وجود داشته باشد.
- حداقل یک اجرای CI متوالی بدون flaky failure انجام شده باشد.
- تست های موبایل و زبان (RTL/LTR) در CI نیز اجرا شوند.