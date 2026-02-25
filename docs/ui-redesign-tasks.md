# وظایف بازطراحی UI — پلتفرم وهدی

> **مجری:** Raptor Mini  
> **پروژه:** `c:\Users\Moein\Documents\Codes\Vaahedi`  
> **فرانت‌اند:** `apps/web/` — React 19، Vite 6، TanStack Router، Tailwind CSS v4  
> **هدف:** تبدیل ظاهر فعلی به یک UI حرفه‌ای، منسجم و زیبا با shadcn/ui

---

## اطلاعات پایه پروژه

```
apps/web/
├── src/
│   ├── routes/
│   │   ├── _authenticated.tsx      ← Layout اصلی (Sidebar + Header + MobileNav)
│   │   ├── _authenticated/
│   │   │   ├── dashboard/index.tsx
│   │   │   ├── products/index.tsx + new.tsx
│   │   │   ├── trade/index.tsx
│   │   │   ├── profile/index.tsx
│   │   │   ├── chat/index.tsx
│   │   │   ├── support/index.tsx
│   │   │   ├── services/hs-codes.tsx + circulars.tsx
│   │   │   ├── admin/index.tsx + users.tsx + products.tsx + ...
│   │   ├── auth/login.tsx + register.tsx + login-otp.tsx
│   │   ├── catalog.tsx + catalog.$productId.tsx
│   │   └── index.tsx               ← صفحه اصلی عمومی
│   ├── components/
│   ├── styles/global.css
│   └── main.tsx
└── package.json
```

### وابستگی‌های موجود
- `tailwindcss: ^4.0.9`
- `clsx: ^2.1.1`
- `tailwind-merge: ^3.0.0`
- `react-hook-form`, `zod`, `@hookform/resolvers`
- فونت Vazirmatn از Google Fonts (در global.css)
- آیکون‌ها: فعلاً emoji — باید با Lucide جایگزین شوند

---

## ⚠️ نکات مهم قبل از شروع

1. **module type: "module"** — تمام import های نسبی در `apps/web` باید پسوند `.js` داشته باشند
2. **Tailwind v4** — سینتکس متفاوت از v3: از `@import "tailwindcss"` استفاده می‌کند نه `@tailwind base`
3. **RTL** — تمام layout ها `dir="rtl"` دارند. کامپوننت‌های shadcn را باید RTL-aware کنید
4. **TypeScript strict** — بعد از هر تغییر `npx tsc --noEmit` در `apps/web` اجرا کنید
5. **shadcn/ui با Tailwind v4** سازگاری خاص نیاز دارد — دستورالعمل دقیق در وظیفه ۱ آمده

---

## وظیفه ۱ — نصب و پیکربندی shadcn/ui

### ۱.۱ نصب وابستگی‌ها
```bash
cd apps/web
npm install lucide-react
npm install class-variance-authority
npm install @radix-ui/react-slot
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-tooltip
npm install @radix-ui/react-separator
npm install @radix-ui/react-progress
npm install @radix-ui/react-avatar
npm install @radix-ui/react-badge 2>/dev/null || true
npm install @radix-ui/react-scroll-area
npm install @radix-ui/react-tabs
```

### ۱.۲ ایجاد فایل `src/lib/utils.ts`
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### ۱.۳ به‌روزرسانی `src/styles/global.css`
فایل فعلی را با این محتوا **جایگزین** کنید:

```css
@import "tailwindcss";

/* ─── فونت فارسی ─────────────────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100..900&display=swap');

/* ─── Design Tokens ──────────────────────────────────────────────────────────── */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71.4% 4.1%;

    --card: 0 0% 100%;
    --card-foreground: 224 71.4% 4.1%;

    --popover: 0 0% 100%;
    --popover-foreground: 224 71.4% 4.1%;

    --primary: 220.9 39.3% 11%;
    --primary-foreground: 210 20% 98%;

    --secondary: 220 14.3% 95.9%;
    --secondary-foreground: 220.9 39.3% 11%;

    --muted: 220 14.3% 95.9%;
    --muted-foreground: 220 8.9% 46.1%;

    --accent: 220 14.3% 95.9%;
    --accent-foreground: 220.9 39.3% 11%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 20% 98%;

    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 224 71.4% 4.1%;

    --radius: 0.5rem;

    /* برند وهدی */
    --brand: 217 91% 40%;
    --brand-foreground: 0 0% 100%;
    --brand-light: 214 100% 97%;

    --font-persian: 'Vazirmatn', system-ui, sans-serif;
  }

  .dark {
    --background: 224 71.4% 4.1%;
    --foreground: 210 20% 98%;
    --card: 224 71.4% 4.1%;
    --card-foreground: 210 20% 98%;
    --popover: 224 71.4% 4.1%;
    --popover-foreground: 210 20% 98%;
    --primary: 210 20% 98%;
    --primary-foreground: 220.9 39.3% 11%;
    --secondary: 215 27.9% 16.9%;
    --secondary-foreground: 210 20% 98%;
    --muted: 215 27.9% 16.9%;
    --muted-foreground: 217.9 10.6% 64.9%;
    --accent: 215 27.9% 16.9%;
    --accent-foreground: 210 20% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 20% 98%;
    --border: 215 27.9% 16.9%;
    --input: 215 27.9% 16.9%;
    --ring: 216 12.2% 83.9%;
    --brand: 217 91% 60%;
    --brand-foreground: 224 71.4% 4.1%;
    --brand-light: 217 30% 15%;
  }

  * {
    box-sizing: border-box;
    border-color: hsl(var(--border));
  }

  html {
    font-family: var(--font-persian);
    -webkit-font-smoothing: antialiased;
  }

  body {
    margin: 0;
    padding: 0;
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
}

/* ─── کامپوننت‌های پایه ────────────────────────────────────────────────────── */
@layer components {
  .label-text {
    @apply block text-sm font-medium text-foreground/80 mb-1;
  }

  .input-field {
    @apply w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background
           focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
           transition-colors placeholder:text-muted-foreground;
  }

  .field-error {
    @apply text-destructive text-xs mt-1;
  }

  .btn-primary {
    @apply bg-[hsl(var(--brand))] text-[hsl(var(--brand-foreground))] px-4 py-2.5 rounded-lg text-sm font-medium
           hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
           transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2;
  }

  .btn-secondary {
    @apply bg-background text-foreground border border-input px-4 py-2.5 rounded-lg text-sm font-medium
           hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
           transition-all inline-flex items-center justify-center gap-2;
  }

  .card {
    @apply bg-card text-card-foreground rounded-xl border border-border shadow-sm;
  }

  .skeleton {
    @apply animate-pulse bg-muted rounded;
  }
}
```

---

## وظیفه ۲ — ساخت کامپوننت‌های پایه

### ۲.۱ `src/components/ui/button.tsx`
```tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[hsl(var(--brand))] text-white hover:opacity-90 shadow-sm',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-muted hover:text-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-muted hover:text-foreground',
        link: 'text-[hsl(var(--brand))] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### ۲.۲ `src/components/ui/card.tsx`
```tsx
import * as React from 'react';
import { cn } from '../../lib/utils.js';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('bg-card text-card-foreground rounded-xl border border-border shadow-sm', className)} {...props} />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-5 pb-0', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
```

### ۲.۳ `src/components/ui/badge.tsx`
```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[hsl(var(--brand-light))] text-[hsl(var(--brand))]',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-red-100 text-red-700',
        success: 'bg-green-100 text-green-700',
        warning: 'bg-yellow-100 text-yellow-700',
        outline: 'border border-input text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

### ۲.۴ `src/components/ui/skeleton.tsx`
```tsx
import { cn } from '../../lib/utils.js';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export { Skeleton };
```

### ۲.۵ `src/components/ui/separator.tsx`
```tsx
import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '../../lib/utils.js';

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
```

### ۲.۶ `src/components/ui/input.tsx`
```tsx
import * as React from 'react';
import { cn } from '../../lib/utils.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

### ۲.۷ `src/components/ui/progress.tsx`
```tsx
import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../lib/utils.js';

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-[hsl(var(--brand))] transition-all"
      style={{ transform: `translateX(${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
```

### ۲.۸ `src/components/ui/avatar.tsx`
```tsx
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../../lib/utils.js';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('aspect-square h-full w-full', className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium', className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
```

---

## وظیفه ۳ — بازطراحی Layout اصلی (`_authenticated.tsx`)

فایل `apps/web/src/routes/_authenticated.tsx` را **کامل** با این نسخه جایگزین کنید:

```tsx
import { createFileRoute, Outlet, Link, useNavigate, useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, ArrowLeftRight, Ticket, MessageSquare,
  Bell, User, LogOut, ChevronLeft, ChevronRight, Globe, Shield,
  Users, FileText, Megaphone, BookOpen, BarChart3, Settings, Hash,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store.js';
import { trpc } from '../trpc.js';
import { cn } from '../lib/utils.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { Progress } from '../components/ui/progress.js';
import { Avatar, AvatarFallback } from '../components/ui/avatar.js';
import { Separator } from '../components/ui/separator.js';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
});

// ─── Navigation Config ────────────────────────────────────────────────────────

const NAV_MAIN = [
  { href: '/dashboard',           icon: LayoutDashboard,  label: 'داشبورد' },
  { href: '/products',            icon: Package,          label: 'محصولات' },
  { href: '/trade',               icon: ArrowLeftRight,   label: 'تجارت' },
  { href: '/support',             icon: Ticket,           label: 'پشتیبانی' },
  { href: '/chat',                icon: MessageSquare,    label: 'پیام‌رسان' },
  { href: '/notifications',       icon: Bell,             label: 'اعلان‌ها' },
];

const NAV_SERVICES = [
  { href: '/services/hs-codes',   icon: Hash,      label: 'کدهای گمرکی' },
  { href: '/services/circulars',  icon: BookOpen,  label: 'بخشنامه‌ها' },
];

const NAV_ADMIN = [
  { href: '/admin',               icon: BarChart3,  label: 'پنل مدیریت' },
  { href: '/admin/users',         icon: Users,      label: 'کاربران' },
  { href: '/admin/documents',     icon: FileText,   label: 'مدارک' },
  { href: '/admin/products',      icon: Package,    label: 'محصولات' },
  { href: '/admin/ads',           icon: Megaphone,  label: 'تبلیغات' },
  { href: '/admin/support',       icon: Ticket,     label: 'پشتیبانی' },
  { href: '/admin/circulars',     icon: BookOpen,   label: 'بخشنامه‌ها' },
];

const MOBILE_NAV = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'خانه' },
  { href: '/products',   icon: Package,         label: 'محصولات' },
  { href: '/trade',      icon: ArrowLeftRight,  label: 'تجارت' },
  { href: '/support',    icon: Ticket,          label: 'پشتیبانی' },
  { href: '/profile',    icon: User,            label: 'پروفایل' },
];

// ─── NavItem ─────────────────────────────────────────────────────────────────

function NavItem({
  href,
  icon: Icon,
  label,
  collapsed = false,
  badge,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  collapsed?: boolean;
  badge?: number;
}) {
  const location = useLocation();
  const isActive =
    location.pathname === href ||
    (href !== '/dashboard' && href !== '/admin' && location.pathname.startsWith(href));

  return (
    <Link
      to={href as '/dashboard'}
      title={collapsed ? label : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative',
        isActive
          ? 'bg-[hsl(var(--brand))] text-white shadow-sm shadow-blue-200'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && badge && badge > 0 && (
        <Badge variant="destructive" className="h-5 min-w-[20px] px-1 text-xs">
          {badge > 99 ? '99+' : badge}
        </Badge>
      )}
      {collapsed && badge && badge > 0 && (
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
      )}
    </Link>
  );
}

// ─── NavSection ───────────────────────────────────────────────────────────────

function NavSection({
  title,
  items,
  collapsed,
  titleColor,
}: {
  title: string;
  items: typeof NAV_MAIN;
  collapsed: boolean;
  titleColor?: string;
}) {
  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className={cn('px-3 text-[10px] font-semibold uppercase tracking-widest mb-2', titleColor ?? 'text-muted-foreground/60')}>
          {title}
        </p>
      )}
      {collapsed && <Separator className="my-2 mx-2" />}
      {items.map((item) => (
        <NavItem key={item.href} {...item} collapsed={collapsed} />
      ))}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const { data: unreadNotif } = trpc.notification.unreadCount.useQuery();
  const { data: completion } = trpc.profile.completionStatus.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: () => { clearAuth(); void navigate({ to: '/auth/login' }); },
  });

  const navWithBadge = NAV_MAIN.map((item) =>
    item.href === '/notifications' ? { ...item, badge: unreadNotif ?? 0 } : item
  );

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col min-h-screen bg-card border-l border-border transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-border', collapsed && 'justify-center px-2')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--brand))] text-white font-black text-sm">
          و
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-black text-foreground">وهدی</div>
            <div className="text-[10px] text-muted-foreground">تجارت هوشمند</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        <NavSection title="منو اصلی" items={navWithBadge} collapsed={collapsed} />
        <NavSection title="خدمات" items={NAV_SERVICES} collapsed={collapsed} />
        {isAdmin && (
          <NavSection title="مدیریت" items={NAV_ADMIN} collapsed={collapsed} titleColor="text-red-400/70" />
        )}
      </nav>

      {/* Profile Progress */}
      {!collapsed && completion && !completion.isComplete && (
        <div className="px-4 py-3 border-t border-border bg-[hsl(var(--brand-light))]">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>تکمیل پروفایل</span>
            <span className="font-semibold text-[hsl(var(--brand))]">{completion.percent}%</span>
          </div>
          <Progress value={completion.percent} className="h-1.5" />
          <Link to="/profile" className="text-xs text-[hsl(var(--brand))] hover:underline mt-1.5 block">
            تکمیل کنید ←
          </Link>
        </div>
      )}

      {/* Bottom */}
      <div className={cn('border-t border-border p-2 space-y-1', collapsed && 'flex flex-col items-center')}>
        <NavItem href="/profile" icon={User} label="پروفایل" collapsed={collapsed} />
        <button
          onClick={() => logoutMutation.mutate()}
          className={cn(
            'group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-muted-foreground hover:bg-red-50 hover:text-red-600',
            collapsed && 'justify-center px-2 w-10 h-10'
          )}
          title={collapsed ? 'خروج' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>خروج</span>}
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -translate-y-1/2 -left-3 h-6 w-6 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center shadow-sm transition-all hover:shadow-md z-10"
        style={{ position: 'sticky', bottom: 80, alignSelf: 'flex-end', margin: '0 8px 8px' }}
      >
        {collapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
    </aside>
  );
}

// ─── Top Header (mobile) ──────────────────────────────────────────────────────

function TopHeader() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const { data: unreadCount } = trpc.notification.unreadCount.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: () => { clearAuth(); void navigate({ to: '/auth/login' }); },
  });

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between" dir="rtl">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-[hsl(var(--brand))] text-white flex items-center justify-center font-black text-xs">و</div>
        <span className="text-sm font-black text-foreground">وهدی</span>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/notifications" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Link>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-[hsl(var(--brand-light))] text-[hsl(var(--brand))]">
            {String(user?.userCode ?? '').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => logoutMutation.mutate()}
          className="h-8 w-8 text-muted-foreground hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────

function MobileNav() {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex z-40 safe-area-inset-bottom">
      {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
        const isActive = location.pathname === href ||
          (href !== '/dashboard' && location.pathname.startsWith(href));
        return (
          <Link
            key={href}
            to={href as '/dashboard'}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-[hsl(var(--brand))]' : 'text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Auth Guard + Layout ──────────────────────────────────────────────────────

function AuthenticatedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const [tokenReady, setTokenReady] = useState(!!accessToken);

  const refreshMutation = trpc.auth.refreshToken.useMutation({
    onSuccess: (data) => { setAuth(data.user, data.accessToken); setTokenReady(true); },
    onError: () => { clearAuth(); void navigate({ to: '/auth/login' }); },
  });

  useEffect(() => {
    if (!isAuthenticated) { void navigate({ to: '/auth/login' }); return; }
    if (!accessToken && !refreshMutation.isPending) { refreshMutation.mutate(); }
    else { setTokenReady(true); }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-muted-foreground text-sm">در حال انتقال...</div>
      </div>
    );
  }

  if (!tokenReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[hsl(var(--brand))] border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30" dir="rtl">
      <Sidebar isAdmin={user?.isAdmin ?? false} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
```

**⚠️ نکته:** `LanguageSwitcher` از `import` برداشته شد چون در layout جدید جا نداشت — اگر لازم است آن را در جایی مناسب برگردانید.

---

## وظیفه ۴ — بازطراحی داشبورد (`-DashboardPage.tsx`)

فایل `apps/web/src/routes/_authenticated/dashboard/-DashboardPage.tsx` را با این نسخه **جایگزین** کنید:

```tsx
import { Link } from '@tanstack/react-router';
import { Package, ArrowLeftRight, Ticket, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react';
import { trpc } from '../../../trpc.js';
import { useAuthStore } from '../../../store/auth.store.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.js';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { Progress } from '../../../components/ui/progress.js';
import { Skeleton } from '../../../components/ui/skeleton.js';

function StatCard({
  title,
  value,
  icon: Icon,
  sub,
  loading,
  color = 'default',
}: {
  title: string;
  value?: number;
  icon: React.ElementType;
  sub?: string;
  loading?: boolean;
  color?: 'default' | 'blue' | 'green' | 'orange' | 'red';
}) {
  const colors = {
    default: 'bg-muted text-muted-foreground',
    blue: 'bg-[hsl(var(--brand-light))] text-[hsl(var(--brand))]',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground">{value ?? '—'}</p>
            )}
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`rounded-xl p-2.5 ${colors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
    PENDING: 'warning',
    ACTIVE: 'success',
    SUSPENDED: 'destructive',
    REJECTED: 'outline',
  };
  const labels: Record<string, string> = {
    PENDING: 'در انتظار تأیید',
    ACTIVE: 'فعال',
    SUSPENDED: 'معلق',
    REJECTED: 'رد شده',
  };
  return <Badge variant={map[status] ?? 'outline'}>{labels[status] ?? status}</Badge>;
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: completion, isLoading: loadingCompletion } = trpc.profile.completionStatus.useQuery();
  const { data: productStats, isLoading: loadingProducts } = trpc.product.myStats.useQuery();
  const { data: tradeStats, isLoading: loadingTrade } = trpc.trade.myStats.useQuery();
  const { data: supportStats, isLoading: loadingSupport } = trpc.support.myStats.useQuery();

  return (
    <div className="p-5 lg:p-7 space-y-7" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">داشبورد</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            خوش آمدید، <span className="font-medium text-foreground">{String(user?.userCode ?? '')}</span>
          </p>
        </div>
        <StatusBadge status={user?.status ?? 'PENDING'} />
      </div>

      {/* Profile Completion Alert */}
      {!loadingCompletion && completion && !completion.isComplete && (
        <Card className="border-[hsl(var(--brand))] bg-[hsl(var(--brand-light))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--brand))] mb-1">پروفایل شما ناقص است</p>
                <div className="flex items-center gap-3">
                  <Progress value={completion.percent} className="h-1.5 flex-1 max-w-xs" />
                  <span className="text-xs font-bold text-[hsl(var(--brand))]">{completion.percent}%</span>
                </div>
              </div>
              <Button asChild size="sm">
                <Link to="/profile">تکمیل پروفایل</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="کل محصولات" value={productStats?.total} icon={Package} loading={loadingProducts} color="blue" />
        <StatCard title="تأیید شده" value={productStats?.approved} icon={CheckCircle2} loading={loadingProducts} color="green" />
        <StatCard title="در انتظار" value={productStats?.pending} icon={Clock} loading={loadingProducts} color="orange" />
        <StatCard title="درخواست تجاری" value={tradeStats?.total} icon={ArrowLeftRight} loading={loadingTrade} color="default" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">دسترسی سریع</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/products/new', icon: Package,        label: 'محصول جدید',      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
            { href: '/trade',        icon: ArrowLeftRight,  label: 'درخواست تجاری',   color: 'bg-green-50 text-green-600 hover:bg-green-100' },
            { href: '/support',      icon: Ticket,          label: 'تیکت جدید',       color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
            { href: '/profile',      icon: TrendingUp,      label: 'تکمیل پروفایل',   color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link
              key={href}
              to={href as '/dashboard'}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 text-sm font-medium transition-colors ${color}`}
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Support Summary */}
      {!loadingSupport && supportStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">وضعیت تیکت‌های پشتیبانی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />
                <span className="text-muted-foreground">باز:</span>
                <span className="font-semibold">{supportStats.open}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
                <span className="text-muted-foreground">در بررسی:</span>
                <span className="font-semibold">{supportStats.inProgress}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
                <span className="text-muted-foreground">بسته:</span>
                <span className="font-semibold">{supportStats.closed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## وظیفه ۵ — بهبود صفحات Auth

### فایل `apps/web/src/routes/auth/login.tsx`
در بخش‌های زیر تغییراتی اعمال کنید:

1. **لاگو و header:** به جای متن ساده، از Card و طراحی ساختارمند استفاده کنید
2. **دکمه submit:** از `<Button loading={...}>` استفاده کنید
3. **input ها:** از کامپوننت `<Input>` استفاده کنید

نمونه ساختار:
```tsx
<div className="min-h-screen flex items-center justify-center bg-muted/50 p-4" dir="rtl">
  <div className="w-full max-w-md">
    {/* Logo */}
    <div className="text-center mb-8">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--brand))] text-white text-2xl font-black mb-3">و</div>
      <h1 className="text-2xl font-bold text-foreground">وهدی</h1>
      <p className="text-muted-foreground text-sm mt-1">مرکز تجارت متمرکز هوشمند</p>
    </div>

    <Card>
      <CardHeader><CardTitle>ورود به حساب</CardTitle></CardHeader>
      <CardContent>
        {/* فرم */}
      </CardContent>
    </Card>
  </div>
</div>
```

---

## وظیفه ۶ — بهبود صفحه محصولات (`products/index.tsx`)

در این صفحه تغییرات زیر را اعمال کنید:

1. جدول محصولات را به کارت‌های گرید تبدیل کنید یا از `<table>` با styling مناسب استفاده کنید
2. دکمه «محصول جدید» را از `<Button asChild>` + `<Link>` استفاده کنید
3. وضعیت تأیید را با `<Badge variant="success/warning">` نشان دهید
4. حالت loading را با `<Skeleton>` نشان دهید

نمونه:
```tsx
import { Skeleton } from '../../../components/ui/skeleton.js';
import { Card, CardContent } from '../../../components/ui/card.js';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';

// در حالت loading:
{isLoading && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <Skeleton className="h-40 w-full rounded-lg mb-3" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </CardContent>
      </Card>
    ))}
  </div>
)}
```

---

## وظیفه ۷ — صفحه عمومی (Landing Page — `routes/index.tsx`)

ساختار کلی:
```tsx
<div dir="rtl">
  {/* Navbar */}
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-[hsl(var(--brand))] text-white flex items-center justify-center font-black text-sm">و</div>
        <span className="font-black text-foreground">وهدی</span>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" asChild><Link to="/auth/login">ورود</Link></Button>
        <Button asChild><Link to="/auth/register">ثبت‌نام رایگان</Link></Button>
      </div>
    </div>
  </header>

  {/* Hero */}
  <section className="max-w-6xl mx-auto px-4 py-20 text-center">
    <Badge className="mb-4">پلتفرم جدید تجارت هوشمند ایران</Badge>
    <h1 className="text-4xl lg:text-6xl font-black text-foreground mb-6 leading-tight">
      تجارت هوشمند<br />
      <span className="text-[hsl(var(--brand))]">با واحدی</span>
    </h1>
    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
      اتصال تولیدکنندگان، بازرگانان و خریداران در یک پلتفرم یکپارچه
    </p>
    <div className="flex gap-3 justify-center flex-wrap">
      <Button size="lg" asChild><Link to="/auth/register">شروع رایگان</Link></Button>
      <Button size="lg" variant="outline" asChild><Link to="/catalog">مشاهده کاتالوگ</Link></Button>
    </div>
  </section>

  {/* Features */}
  <section className="bg-muted/50 py-16">
    <div className="max-w-6xl mx-auto px-4">
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'کاتالوگ محصولات', desc: 'معرفی و فروش محصولات به هزاران بازرگان', icon: '📦' },
          { title: 'تجارت امن', desc: 'درخواست‌های تجاری با پشتیبانی کارشناس', icon: '🔒' },
          { title: 'خدمات گمرکی', desc: 'کدهای HS، بخشنامه‌ها و مستندات جامع', icon: '📊' },
        ].map((f) => (
          <Card key={f.title}>
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
</div>
```

---

## وظیفه ۸ — فایل `components/ui/index.ts` (barrel export)

```typescript
export * from './button.js';
export * from './card.js';
export * from './badge.js';
export * from './skeleton.js';
export * from './separator.js';
export * from './input.js';
export * from './progress.js';
export * from './avatar.js';
```

---

## چک‌لیست نهایی

پس از اتمام تمام وظایف:

```bash
cd apps/web

# بررسی TypeScript
npx tsc --noEmit

# در صورت موفقیت → سرور را راه‌اندازی کنید و بررسی بصری کنید
npm run dev
```

**نکات:**
- هر import از کامپوننت‌های جدید باید با پسوند `.js` باشد (مثال: `'../../../components/ui/button.js'`)
- اگر import ای از `LanguageSwitcher` در `_authenticated.tsx` وجود دارد و error می‌دهد، آن را کامنت کنید یا در TopHeader قرار دهید
- `trpc.support.myStats` و `trpc.trade.myStats` باید در routers موجود باشند — اگر نبودند از `trpc.product.myStats` به تنهایی استفاده کنید

---

## خلاصه وابستگی‌های جدید

| پکیج | هدف |
|------|-----|
| `lucide-react` | آیکون‌های SVG حرفه‌ای جایگزین emoji |
| `class-variance-authority` | مدیریت variant های کامپوننت |
| `@radix-ui/react-slot` | کامپوننت Button با `asChild` |
| `@radix-ui/react-progress` | نوار پیشرفت |
| `@radix-ui/react-avatar` | آواتار کاربر |
| `@radix-ui/react-separator` | خط جداکننده |
