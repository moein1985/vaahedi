# مشخصات بهبود UI/UX — هماهنگ‌سازی با لندینگ

> **هدف:** تمام صفحات پنل کاربری، auth و عمومی باید از نظر تم رنگی و هویت بصری با صفحه لندینگ هماهنگ باشند.
> **فایل‌ها:** `apps/web/src/`
> **ترتیب اجرا:** از بالا به پایین — هر مورد مستقل است.

---

## رنگ‌شناسی لندینگ (مرجع)

لندینگ از دو پالت استفاده می‌کند:
- **تیره/dramatic:** `hsl(15, 75%, 10%)` navy تیره + amber/طلایی برای hero
- **روشن/content:** سفید با `--brand` آبی (`hsl(217, 91%, 40%)`) برای بخش‌های میانی

تمام صفحات باید در sidebar، header و بخش‌های کلیدی از **navy تیره + amber/طلایی** به‌جای **خاکستری بی‌رنگ** استفاده کنند.

---

## ۱. CSS Variables — افزودن توکن‌های رنگی جدید

**فایل:** `apps/web/src/styles/global.css`

در بخش `:root` این متغیرها را اضافه کنید (بعد از `--brand-light`):

```css
/* ─── توکن‌های ثانویه برند — amber/gold از لندینگ */
--brand-amber:             hsl(38 95% 52%);
--brand-amber-light:       hsl(40 100% 96%);
--brand-amber-dark:        hsl(30 85% 28%);

/* ─── sidebar dark background — همان navy لندینگ */
--sidebar-bg:              hsl(222 47% 9%);
--sidebar-bg-hover:        hsl(222 40% 14%);
--sidebar-text:            hsl(215 20% 75%);
--sidebar-text-active:     hsl(0 0% 100%);
--sidebar-active-bg:       hsl(38 95% 52% / 0.15);
--sidebar-active-border:   hsl(38 95% 52%);
--sidebar-border:          hsl(222 35% 16%);
```

در بخش `.dark` هم همین متغیرها را کپی کنید (مقادیر یکسان هستند چون sidebar همیشه تیره است).

---

## ۲. Sidebar — تم navy تیره با accent طلایی

**فایل:** `apps/web/src/routes/_authenticated.tsx`

### ۲.۱ پس‌زمینه Sidebar

```tsx
// قبل:
'hidden lg:flex flex-col min-h-screen bg-card border-l border-border ...'

// بعد:
'hidden lg:flex flex-col min-h-screen border-l transition-all duration-300 flex-shrink-0'
// + style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
```

### ۲.۲ Logo در Sidebar

```tsx
// قبل: حرف «ت» ساده روی آبی
<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] text-white font-black text-sm">ت</div>
<div className="text-sm font-black text-foreground">تجارت هوشمند</div>
<div className="text-[10px] text-muted-foreground">سامانه بورس هوشمند</div>

// بعد: لوگو با پس‌زمینه amber + متن روشن
<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-sm"
     style={{ background: 'linear-gradient(135deg, hsl(38,95%,52%), hsl(30,85%,40%))', color: '#fff' }}>
  ت
</div>
<div style={{ color: 'hsl(0,0%,95%)' }} className="text-sm font-black">تجارت هوشمند</div>
<div style={{ color: 'var(--sidebar-text)' }} className="text-[10px]">سامانه تجارت ایرانیان</div>
```

### ۲.۳ NavItem — active state با border amber

```tsx
// قبل:
isActive
  ? 'bg-[var(--brand)] text-white shadow-sm shadow-blue-200'
  : 'text-muted-foreground hover:bg-muted hover:text-foreground'

// بعد:
isActive
  ? 'text-white border-r-2'
  : 'hover:text-white'
// + style برای isActive: { background: 'var(--sidebar-active-bg)', borderColor: 'var(--sidebar-active-border)', color: 'var(--sidebar-text-active)' }
// + style برای hover: { color: 'var(--sidebar-text)' }
// + style برای normal: { color: 'var(--sidebar-text)' }
```

### ۲.۴ NavSection titles

```tsx
// قبل:
'px-3 text-[10px] font-semibold uppercase tracking-widest mb-2 text-muted-foreground/60'

// بعد:
'px-3 text-[10px] font-semibold uppercase tracking-widest mb-2'
// + style: { color: 'hsl(215,15%,45%)' }
```

### ۲.۵ Separator بین section‌ها

```tsx
// قبل: <Separator className="my-2 mx-2" />
// بعد:
<div className="my-2 mx-3 h-px" style={{ background: 'var(--sidebar-border)' }} />
```

### ۲.۶ Profile Progress در Sidebar

```tsx
// قبل: bg-[var(--brand-light)]
// بعد:
style={{ background: 'hsl(38,95%,52%,0.08)', borderTop: '1px solid var(--sidebar-border)' }}
// + متن: color: 'var(--sidebar-text)'
// + عدد درصد: color: 'var(--brand-amber)'
// + لینک: color: 'var(--brand-amber)'
```

### ۲.۷ دکمه خروج

```tsx
// قبل: hover:bg-red-50 hover:text-red-600
// بعد: + style: { color: 'var(--sidebar-text)' }
// hover: style: { background: 'hsl(0,84%,60%,0.1)', color: 'hsl(0,84%,60%)' }
```

### ۲.۸ Toggle Button جمع/باز کردن

```tsx
// قبل: border border-border bg-card
// بعد:
style={{ background: 'var(--sidebar-bg-hover)', borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text)' }}
```

---

## ۳. Top Header (mobile)

**فایل:** `apps/web/src/routes/_authenticated.tsx` — تابع `TopHeader`

```tsx
// قبل:
'lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 py-3 ...'

// بعد:
'lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center justify-between'
// + style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--sidebar-border)' }}

// لوگو در header موبایل:
// قبل: bg-[var(--brand)] text-white
// بعد: background: 'linear-gradient(135deg, hsl(38,95%,52%), hsl(30,85%,40%))'

// نام برند:
// قبل: text-foreground
// بعد: color: 'hsl(0,0%,95%)'
```

---

## ۴. Mobile Bottom Navbar

**فایل:** `apps/web/src/routes/_authenticated.tsx` — بخش `MobileNav`

```tsx
// قبل: bg-card border-t border-border
// بعد:
style={{ background: 'var(--sidebar-bg)', borderTop: '1px solid var(--sidebar-border)' }}

// آیتم active:
// قبل: text-[var(--brand)]
// بعد: color: 'var(--brand-amber)'

// آیتم غیرفعال:
// قبل: text-muted-foreground
// بعد: color: 'var(--sidebar-text)'
```

---

## ۵. صفحه لاگین — حذف role selection + brand visual

**فایل:** `apps/web/src/routes/auth/login.tsx`

### ۵.۱ حذف Role Selection Step

مرحله انتخاب seller/buyer کاملاً حذف شود. این state اصلاً کاربردی ندارد در لاگین:

```tsx
// حذف:
const [userRole, setUserRole] = useState<'seller' | 'buyer' | null>(null);

// حذف: تمام بلاک if (!userRole) { ... }
// بعد از Card شروع می‌شود مستقیم با tabs لاگین
```

### ۵.۲ پس‌زمینه صفحه لاگین

```tsx
// قبل:
<div className="min-h-screen flex items-center justify-center bg-muted/50 p-4" dir="rtl">

// بعد:
<div className="min-h-screen flex items-center justify-center p-4" dir="rtl"
     style={{ background: 'radial-gradient(ellipse at 60% 30%, hsl(38,80%,22%), hsl(222,47%,9%) 65%)' }}>
```

### ۵.۳ لوگو در صفحه لاگین

```tsx
// قبل: bg-[var(--brand)] text-white + متن تیره
// بعد:
<div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-black mb-3 shadow-lg"
     style={{ background: 'linear-gradient(135deg, hsl(38,95%,52%), hsl(30,85%,40%))' }}>
  ت
</div>
<h1 className="text-2xl font-bold" style={{ color: 'hsl(0,0%,95%)' }}>تجارت هوشمند</h1>
<p className="text-sm mt-1" style={{ color: 'hsl(215,20%,65%)' }}>سامانه تجارت ایرانیان</p>
```

### ۵.۴ Card لاگین

```tsx
// قبل: <Card> بدون custom style
// بعد: اضافه کردن backdrop و border ملایم
<Card className="border-0 shadow-2xl"
      style={{ background: 'hsl(0,0%,100%,0.97)', backdropFilter: 'blur(8px)' }}>
```

---

## ۶. صفحه Catalog — hero هماهنگ با لندینگ

**فایل:** `apps/web/src/routes/catalog.tsx`

### ۶.۱ Hero Section

پیدا کنید بخش hero/header صفحه کاتالوگ و پس‌زمینه‌اش را به گرادیان لندینگ تغییر دهید:

```tsx
// در JSX بخش hero:
style={{
  background: 'radial-gradient(circle at 52% 56%, rgba(255,217,99,0.85), rgba(245,132,31,0.5) 30%, rgba(19,19,19,0.92) 70%), linear-gradient(180deg, rgba(197,99,10,0.65), rgba(9,18,33,0.88))',
  minHeight: '220px'
}}

// عنوان hero: color: 'hsl(0,0%,95%)'
// توضیح: color: 'hsl(215,20%,75%)'
```

### ۶.۲ Product Cards

```tsx
// قبل: border + hover:shadow
// بعد: اضافه کردن transition و hover lift
className="... transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
```

---

## ۷. صفحه Product Detail (`catalog.$productId.tsx`)

**فایل:** `apps/web/src/routes/catalog.$productId.tsx`

### ۷.۱ اضافه کردن Navbar عمومی

صفحه جزئیات محصول Navbar ندارد و کاربر بعد از ورود به صفحه، راه بازگشت ساده‌ای ندارد:

```tsx
// اضافه کردن در بالای return:
<nav className="sticky top-0 z-20 border-b px-6 py-3 flex items-center gap-4"
     style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}>
  <Link to="/catalog" className="text-sm flex items-center gap-1"
        style={{ color: 'var(--sidebar-text)' }}>
    ← بازگشت به کاتالوگ
  </Link>
  <span style={{ color: 'var(--sidebar-border)' }}>|</span>
  <span className="text-sm" style={{ color: 'var(--sidebar-text)' }}>{product.nameFa}</span>
</nav>
```

### ۷.۲ اصلاح رنگ‌های hardcode

```tsx
// قبل: text-gray-900, text-gray-600, border-blue-500, border-gray-200, text-blue-600
// بعد: استفاده از CSS variables:
//   text-gray-900 → text-foreground
//   text-gray-600 → text-muted-foreground
//   border-blue-500 → border-[var(--brand)]
//   border-gray-200 → border-border
//   text-blue-600 → text-[var(--brand)]
//   bg-gray-100 → bg-muted
```

---

## ۸. Dashboard — بهبود StatCard‌ها

**فایل:** `apps/web/src/routes/_authenticated/dashboard/-DashboardPage.tsx`

### ۸.۱ StatCard با visual depth

```tsx
// در تابع StatCard، به Card اضافه کنید:
<Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">

// آیکون blue را بهبود دهید:
// قبل: 'bg-[var(--brand-light)] text-[var(--brand)]'
// بعد: 'text-[var(--brand)]' + style={{ background: 'linear-gradient(135deg, hsl(38,95%,52%,0.12), hsl(217,91%,40%,0.08))' }}
```

### ۸.۲ Header داشبورد — خوش‌آمدگویی با رنگ‌بندی بهتر

پیدا کنید بخش خوش‌آمدگویی `سلام، ...` و به آن depth بدهید:

```tsx
// قبل: div ساده با text
// بعد: اضافه کردن پس‌زمینه gradient ملایم
<div className="rounded-xl p-5 mb-6 border"
     style={{ background: 'linear-gradient(135deg, hsl(222,47%,9%,0.04), hsl(38,95%,52%,0.04))', borderColor: 'hsl(38,95%,52%,0.15)' }}>
  {/* محتوای فعلی */}
</div>
```

---

## ۹. صفحه ثبت محصول (`products/new.tsx`)

**فایل:** `apps/web/src/routes/_authenticated/products/new.tsx`

### ۹.۱ Step Indicator بهتر

پیدا کنید step indicator (مراحل ۱، ۲، ۳) و آن را از دایره ساده به نوار پیشرفت تبدیل کنید:

```tsx
// بجای دایره‌های عددی ساده:
// ۱. شماره step با رنگ amber برای step فعال
// ۲. خطوط اتصال بین step‌ها با رنگ‌بندی
// active step: background: 'var(--brand-amber)', color: '#fff'
// completed step: background: 'hsl(120,60%,40%)', color: '#fff' (سبز = تکمیل شده)
// upcoming step: background: 'var(--muted)', color: 'var(--muted-foreground)'
```

### ۹.۲ Section Headers در فرم

هر بخش فرم (اطلاعات پایه، مشخصات فنی، ...) باید header واضح‌تری داشته باشد:

```tsx
// قبل: h2 ساده یا div با border-b
// بعد:
<div className="flex items-center gap-3 mb-4 pb-3 border-b">
  <div className="h-8 w-1 rounded-full" style={{ background: 'var(--brand-amber)' }} />
  <h2 className="text-base font-semibold text-foreground">{sectionTitle}</h2>
</div>
```

---

## ۱۰. صفحه‌های About, Contact, News

**فایل‌ها:** `apps/web/src/routes/about.tsx`, `contact.tsx`, `news.tsx`

### ۱۰.۱ بررسی و هماهنگی Navbar

این صفحات از Navbar لندینگ استفاده می‌کنند. مطمئن شوید:
- رنگ navbar با لندینگ یکسان است (اگر sticky می‌شود، به صورت `bg-[var(--sidebar-bg)]` شود)
- لوگو و دکمه‌ها یکسان با لندینگ هستند

### ۱۰.۲ Hero هر صفحه

در صورتی که hero section دارند، از همان گرادیان لندینگ (amber+navy) استفاده کنند.

---

## ۱۱. جزئیات Component — Field Errors

**فایل‌های فرم:** `products/new.tsx`, `profile/`, `auth/register.tsx`

```tsx
// قبل: <p className="text-red-500 text-sm mt-1">
// بعد: با آیکون و background ملایم
<p className="flex items-center gap-1.5 text-destructive text-xs mt-1.5 px-2 py-1 rounded-md bg-destructive/8">
  <AlertCircle className="h-3 w-3 shrink-0" />
  {errorMessage}
</p>
```

---

## ۱۲. Tooltip روی Nav Items (collapsed sidebar)

**فایل:** `apps/web/src/routes/_authenticated.tsx`

وقتی sidebar collapsed است، title attribute روی NavItem کافی نیست. باید از Radix Tooltip استفاده شود:

```tsx
// اگر collapsed، NavItem را در Tooltip بپوشانید:
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../../components/ui/tooltip.js';

// در NavItem:
if (collapsed) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{navItemJsx}</TooltipTrigger>
        <TooltipContent side="left" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

## ۱۳. Sticky Submit Button در فرم‌های طولانی

**فایل:** `apps/web/src/routes/_authenticated/products/new.tsx`

```tsx
// بجای دکمه Submit معمولی در پایین فرم، آن را sticky کنید:
<div className="sticky bottom-0 bg-background/95 backdrop-blur border-t pt-3 pb-3 -mx-4 px-4 mt-6">
  <Button type="submit" className="w-full" disabled={isLoading}>
    {isLoading ? 'در حال ثبت...' : 'ثبت محصول'}
  </Button>
</div>
```

---

## ۱۴. Empty State‌های بهتر

در تمام صفحاتی که لیست خالی نشان می‌دهند (`trade`, `products`, `messages`, ...):

```tsx
// قبل: <p className="text-muted-foreground text-center">موردی یافت نشد</p>
// بعد:
<div className="flex flex-col items-center justify-center py-16 gap-3">
  <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
       style={{ background: 'hsl(38,95%,52%,0.08)' }}>
    <Icon className="h-8 w-8" style={{ color: 'var(--brand-amber)' }} />
  </div>
  <p className="text-foreground font-medium">{emptyTitle}</p>
  <p className="text-muted-foreground text-sm text-center max-w-xs">{emptyDesc}</p>
  {/* دکمه action اختیاری */}
</div>
```

---

## ترتیب اجرای پیشنهادی

| اولویت | مورد | فایل | تأثیر |
|--------|------|------|-------|
| 🔴 ۱ | توکن‌های رنگی (CSS Variables) | `global.css` | پایه همه چیز |
| 🔴 ۲ | Sidebar — تم navy/amber | `_authenticated.tsx` | بیشترین تأثیر بصری |
| 🔴 ۳ | Top Header و Mobile Nav | `_authenticated.tsx` | هماهنگی با sidebar |
| 🔴 ۴ | صفحه لاگین — حذف role + brand bg | `auth/login.tsx` | اولین تجربه کاربر |
| 🟡 ۵ | Catalog Hero | `catalog.tsx` | صفحه عمومی پرتردد |
| 🟡 ۶ | Product Detail — navbar + رنگ‌ها | `catalog.$productId.tsx` | تجربه مشاهده محصول |
| 🟡 ۷ | Dashboard StatCards | `-DashboardPage.tsx` | صفحه اصلی پنل |
| 🟡 ۸ | Field Errors | همه فرم‌ها | UX فرم‌ها |
| 🟢 ۹ | Step Indicator فرم محصول | `products/new.tsx` | clarity |
| 🟢 ۱۰ | Tooltip collapsed sidebar | `_authenticated.tsx` | polish |
| 🟢 ۱۱ | Empty States | صفحات لیست | polish |
| 🟢 ۱۲ | Sticky Submit Button | `products/new.tsx` | UX فرم طولانی |
