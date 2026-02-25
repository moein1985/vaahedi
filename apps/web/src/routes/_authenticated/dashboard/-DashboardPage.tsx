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
    blue: 'bg-[var(--brand-light)] text-[var(--brand)]',
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
        <Card className="border-[var(--brand)] bg-[var(--brand-light)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--brand)] mb-1">پروفایل شما ناقص است</p>
                <div className="flex items-center gap-3">
                  <Progress value={completion.percent} className="h-1.5 flex-1 max-w-xs" />
                  <span className="text-xs font-bold text-[var(--brand)]">{completion.percent}%</span>
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
