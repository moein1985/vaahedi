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
          ? 'bg-[var(--brand)] text-white shadow-sm shadow-blue-200'
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] text-white font-black text-sm">
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
        <div className="px-4 py-3 border-t border-border bg-[var(--brand-light)]">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>تکمیل پروفایل</span>
            <span className="font-semibold text-[var(--brand)]">{completion.percent}%</span>
          </div>
          <Progress value={completion.percent} className="h-1.5" />
          <Link to="/profile" className="text-xs text-[var(--brand)] hover:underline mt-1.5 block">
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
        <div className="h-7 w-7 rounded-lg bg-[var(--brand)] text-white flex items-center justify-center font-black text-xs">و</div>
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
          <AvatarFallback className="text-xs bg-[var(--brand-light)] text-[var(--brand)]">
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

// ─── Mobile Bottom Nav ───────────────────────────────────────────────────────

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
              isActive ? 'text-[var(--brand)]' : 'text-muted-foreground'
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
          <div className="h-8 w-8 rounded-full border-2 border-[var(--brand)] border-t-transparent animate-spin" />
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
