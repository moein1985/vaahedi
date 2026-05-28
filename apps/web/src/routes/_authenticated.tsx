import { createFileRoute, Outlet, Link, useNavigate, useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, ArrowLeftRight, Ticket, MessageSquare,
  Bell, User, LogOut, ChevronLeft, ChevronRight, Globe,
  Users, FileText, Megaphone, BookOpen, BarChart3, Hash,
  Download, Wheat, TrendingUp, TreePine, BadgeCheck,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store.js';
import { trpc } from '../trpc.js';
import { cn } from '../lib/utils.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { Progress } from '../components/ui/progress.js';
import { Avatar, AvatarFallback } from '../components/ui/avatar.js';
import { Separator } from '../components/ui/separator.js';
import { ThemeToggle } from '../components/theme-toggle.js';
import { LanguageSwitcher } from '../components/LanguageSwitcher.js';
import { AiFabChat } from '../components/ai-fab-chat.js';
import { getFriendlyTrpcError } from '../lib/trpc-error.js';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
});

// ─── Navigation Config ────────────────────────────────────────────────────────

type AdminRoleName = 'SUPER_ADMIN' | 'EXPERT' | 'MEDIA_SUPERVISOR' | 'ANALYST';

type NavConfigItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  allowedAdminRoles?: readonly AdminRoleName[];
  external?: boolean;
};

const NAV_MAIN: NavConfigItem[] = [
  { href: '/dashboard',           icon: LayoutDashboard,  label: 'داشبورد' },
  { href: '/products',            icon: Package,          label: 'محصولات' },
  { href: '/rfq',                 icon: ArrowLeftRight,   label: 'درخواست ها و فرصت ها' },
  { href: '/catalog',             icon: Globe,            label: 'بازار محصولات', external: true },
  { href: '/messages',            icon: MessageSquare,    label: 'پیام ها' },
  { href: '/ai-advisor',          icon: Bell,             label: 'مشاور کشاورزی' },
  { href: '/licenses',            icon: BadgeCheck,       label: 'مجوزهای من' },
  { href: '/harvest',             icon: Wheat,            label: 'تقویم برداشت' },
  { href: '/market-insights',     icon: TrendingUp,       label: 'تحلیل بازار' },
  { href: '/documents',           icon: FileText,         label: 'اسناد' },
  { href: '/finance',             icon: BarChart3,        label: 'مالی' },
];

const NAV_SERVICES: NavConfigItem[] = [
  { href: '/support',             icon: Ticket,    label: 'پشتیبانی' },
  { href: '/services/hs-codes',   icon: Hash,      label: 'کدهای گمرکی' },
  { href: '/services/circulars',  icon: BookOpen,  label: 'بخشنامه‌ها' },
  { href: '/downloads',           icon: Download,  label: 'دانلودها' },
  { href: '/ads-request',         icon: Megaphone, label: 'درخواست تبلیغ' },
];

const NAV_ADMIN: NavConfigItem[] = [
  { href: '/admin',               icon: BarChart3,  label: 'پنل مدیریت' },
  { href: '/admin/admins',        icon: Users,      label: 'مدیریت ادمین ها', allowedAdminRoles: ['SUPER_ADMIN'] },
  { href: '/admin/users',         icon: Users,      label: 'کاربران', allowedAdminRoles: ['SUPER_ADMIN', 'EXPERT'] },
  { href: '/admin/documents',     icon: FileText,   label: 'مدارک', allowedAdminRoles: ['SUPER_ADMIN', 'EXPERT'] },
  { href: '/admin/products',      icon: Package,    label: 'محصولات', allowedAdminRoles: ['SUPER_ADMIN', 'MEDIA_SUPERVISOR'] },
  { href: '/admin/ads',           icon: Megaphone,  label: 'تبلیغات', allowedAdminRoles: ['SUPER_ADMIN', 'MEDIA_SUPERVISOR'] },
  { href: '/admin/support',       icon: Ticket,     label: 'پشتیبانی' },
  { href: '/admin/circulars',     icon: BookOpen,   label: 'بخشنامه‌ها', allowedAdminRoles: ['SUPER_ADMIN', 'MEDIA_SUPERVISOR'] },
  { href: '/admin/taxonomy',      icon: TreePine,   label: 'دسته‌بندی شغلی', allowedAdminRoles: ['SUPER_ADMIN'] },
  { href: '/admin/harvest',       icon: Wheat,      label: 'تقویم برداشت', allowedAdminRoles: ['SUPER_ADMIN'] },
  { href: '/admin/market',        icon: TrendingUp, label: 'تحلیل بازار', allowedAdminRoles: ['SUPER_ADMIN'] },
];

const MOBILE_NAV: NavConfigItem[] = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'خانه' },
  { href: '/products',   icon: Package,         label: 'محصولات' },
  { href: '/rfq',        icon: ArrowLeftRight,  label: 'درخواست ها' },
  { href: '/messages',   icon: MessageSquare,   label: 'پیام ها' },
  { href: '/finance',    icon: BarChart3,       label: 'مالی' },
];

// ─── NavItem ─────────────────────────────────────────────────────────────────

function NavItem({
  href,
  icon: Icon,
  label,
  collapsed = false,
  badge,
  external = false,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  collapsed?: boolean;
  badge?: number;
  external?: boolean;
}) {
  const location = useLocation();
  const isActive =
    !external &&
    (location.pathname === href ||
      (href !== '/dashboard' && href !== '/admin' && location.pathname.startsWith(href)));

  const className = cn(
    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative',
    isActive
      ? 'border-r-2 bg-[var(--sidebar-active-bg)] border-r-[var(--sidebar-active-border)] text-[var(--sidebar-text-active)]'
      : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-bg-hover)] hover:brightness-125',
    collapsed && 'justify-center px-2'
  );

  const content = (
    <>
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
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={collapsed ? label : undefined}
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={href as '/dashboard'}
      title={collapsed ? label : undefined}
      className={className}
    >
      {content}
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
  items: NavConfigItem[];
  collapsed: boolean;
  titleColor?: string;
}) {
  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className={cn('px-3 text-[10px] font-semibold uppercase tracking-widest mb-2', titleColor ?? 'text-[hsl(215_15%_40%)]')}>
          {title}
        </p>
      )}
      {collapsed && <div className="my-2 mx-3 h-px bg-[var(--sidebar-border)]" />}
      {items.map((item) => (
        <NavItem key={item.href} {...item} collapsed={collapsed} />
      ))}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function Sidebar({ isAdmin, adminRole }: { isAdmin: boolean; adminRole?: string | null }) {
  const [collapsed, setCollapsed] = useState(false);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const { data: completion } = trpc.profile.completionStatus.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: () => { clearAuth(); void navigate({ to: '/auth/login' }); },
  });
  const adminItems = NAV_ADMIN.filter((item) => {
    if (!item.allowedAdminRoles) return true;
    return !!adminRole && item.allowedAdminRoles.includes(adminRole as AdminRoleName);
  });

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col min-h-screen transition-all duration-300 flex-shrink-0 bg-[var(--sidebar-bg)] border-l border-l-[var(--sidebar-border)]',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-b-[var(--sidebar-border)]', collapsed && 'justify-center px-2')}>
        <img
          src="/brand/logo_without_persian_words.png"
          alt="ذینفعان کشاورزی"
          className="h-9 w-9 shrink-0 rounded-xl border border-white/20 bg-white/90 object-contain p-1"
        />
        {!collapsed && (
          <div>
            <div className="text-sm font-black text-[hsl(0_0%_95%)]">ذینفعان کشاورزی</div>
            <div className="text-[10px] text-[var(--sidebar-text)]">شبکه تخصصی حوزه کشاورزی</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        <NavSection title="منو اصلی" items={NAV_MAIN} collapsed={collapsed} />
        <NavSection title="خدمات" items={NAV_SERVICES} collapsed={collapsed} />
        {isAdmin && (
          <NavSection title="مدیریت" items={adminItems} collapsed={collapsed} titleColor="text-red-400/70" />
        )}
      </nav>

      {/* Profile Progress */}
      {!collapsed && completion && !completion.isComplete && (
        <div className="px-4 py-3 border-t border-t-[var(--sidebar-border)] bg-[var(--brand-light)]">
          <div className="flex items-center justify-between text-xs mb-1.5 text-[var(--sidebar-text)]">
            <span>تکمیل پروفایل</span>
            <span className="font-semibold text-[var(--brand)]">{completion.percent}%</span>
          </div>
          <Progress value={completion.percent} className="h-1.5" />
          <Link to="/profile" className="text-xs hover:underline mt-1.5 block text-[var(--brand)]">
            تکمیل کنید ←
          </Link>
        </div>
      )}

      {/* Bottom */}
      <div className={cn('p-2 space-y-1 border-t border-t-[var(--sidebar-border)]', collapsed && 'flex flex-col items-center')}>
        <NavItem href="/profile" icon={User} label="پروفایل" collapsed={collapsed} />
        {!collapsed && <LanguageSwitcher />}
        <ThemeToggle collapsed={collapsed} />
        <button
          onClick={() => logoutMutation.mutate()}
          className={cn(
            'group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-[var(--sidebar-text)] hover:text-[hsl(0_84%_65%)] hover:bg-[hsl(0_84%_60%_/_0.1)]',
            collapsed && 'justify-center px-2 w-10 h-10'
          )}
          title={collapsed ? 'خروج' : undefined}
          aria-label="خروج از حساب"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>خروج</span>}
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'}
        className="sticky bottom-20 self-end m-2 absolute top-1/2 -translate-y-1/2 -left-3 h-6 w-6 rounded-full flex items-center justify-center shadow-sm transition-all hover:shadow-md z-10 bg-[var(--sidebar-bg-hover)] border border-[var(--sidebar-border)] text-[var(--sidebar-text)]"
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
    <header className="lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center justify-between bg-[var(--sidebar-bg)] border-b border-b-[var(--sidebar-border)]" dir="rtl">
      <div className="flex items-center gap-2">
        <img
          src="/brand/logo_without_persian_words.png"
          alt="ذینفعان کشاورزی"
          className="h-7 w-7 rounded-lg border border-white/20 bg-white/90 object-contain p-0.5"
        />
        <span className="text-sm font-black text-[hsl(0_0%_95%)]">ذینفعان کشاورزی</span>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/notifications" className="relative p-2 transition-colors text-[var(--sidebar-text)]" aria-label="اعلان‌ها">
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Link>
        <div className="scale-75 -mx-1">
          <LanguageSwitcher />
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-[var(--sidebar-bg-hover)] text-[var(--brand)]">
            {String(user?.userCode ?? '').slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => logoutMutation.mutate()}
          className="h-8 w-8 text-[var(--sidebar-text)]"
          aria-label="خروج از حساب"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

// ─── Mobile Bottom Nav ───────────────────────────────────────────────────────

function MobileNav() {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 flex z-40 safe-area-inset-bottom bg-[var(--sidebar-bg)] border-t border-t-[var(--sidebar-border)]">
      {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
        const isActive = location.pathname === href ||
          (href !== '/dashboard' && location.pathname.startsWith(href));
        return (
          <Link
            key={href}
            to={href as '/dashboard'}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-colors',
              isActive ? 'text-[var(--brand)]' : 'text-[var(--sidebar-text)]'
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
  const routeLocation = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const [tokenReady, setTokenReady] = useState(!!accessToken);

  const refreshMutation = trpc.auth.refreshToken.useMutation({
    onSuccess: (data) => { setAuth(data.user, data.accessToken); setTokenReady(true); },
    onError: (error) => {
      console.warn('[Auth] refreshToken failed:', getFriendlyTrpcError(error));
      clearAuth();
      void navigate({ to: '/auth/login' });
    },
  });

  useEffect(() => {
    if (!isAuthenticated) { void navigate({ to: '/auth/login' }); return; }
    if (!accessToken && !refreshMutation.isPending) { refreshMutation.mutate(); }
    else { setTokenReady(true); }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Proactive token refresh every 13 minutes (token expires in 15 min)
  useEffect(() => {
    if (!isAuthenticated) return;
    const REFRESH_INTERVAL = 13 * 60 * 1000;
    const interval = setInterval(() => {
      refreshMutation.mutate();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
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
          <div className="h-8 w-8 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30" dir="rtl">
      <Sidebar isAdmin={user?.isAdmin ?? false} adminRole={user?.adminRole} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div key={routeLocation.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <AiFabChat enabled={routeLocation.pathname.startsWith('/dashboard') || routeLocation.pathname === '/'} />
      <MobileNav />
    </div>
  );
}
