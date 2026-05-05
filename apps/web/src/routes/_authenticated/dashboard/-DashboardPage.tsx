import { Link } from '@tanstack/react-router';
import {
  Package,
  ArrowLeftRight,
  Ticket,
  MessageSquare,
  Sparkles,
  Newspaper,
  Store,
  Bell,
  AlertCircle,
  TrendingUp,
  Building2,
} from 'lucide-react';
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
  error,
  color = 'default',
}: {
  title: string;
  value?: number;
  icon: React.ElementType;
  sub?: string;
  loading?: boolean;
  error?: boolean;
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
            ) : error ? (
              <p className="text-sm text-muted-foreground/60 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                خطا
              </p>
            ) : (
              <p className="text-3xl font-bold text-foreground">{value ?? '—'}</p>
            )}
            {sub && !error && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
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
  const { data: myProfile } = trpc.profile.me.useQuery();
  const { data: completion, isLoading: loadingCompletion } = trpc.profile.completionStatus.useQuery();
  const { data: productStats, isLoading: loadingProducts, isError: errorProducts } = trpc.product.myStats.useQuery();
  const { data: tradeStats, isLoading: loadingTrade, isError: errorTrade } = trpc.trade.myStats.useQuery();
  const { data: recentTrades, isLoading: loadingRecentTrades } = trpc.trade.myRequests.useQuery({ page: 1, limit: 3 });
  const { data: supportStats, isLoading: loadingSupport, isError: errorSupport } = trpc.support.myStats.useQuery();
  const { data: unreadCount, isLoading: loadingUnread, isError: errorUnread } = trpc.notification.unreadCount.useQuery();
  const { data: unreadNotifications, isLoading: loadingNotifications } = trpc.notification.list.useQuery({
    page: 1,
    limit: 3,
    unreadOnly: true,
  });
  const { data: latestNews, isLoading: loadingNews } = trpc.news.latest.useQuery({ limit: 3 });
  const { data: marketplaceData, isLoading: loadingMarketplace } = trpc.product.list.useQuery({
    page: 1,
    limit: 4,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const activeTradeRequests = (tradeStats?.pending ?? 0) + (tradeStats?.inNegotiation ?? 0);

  const aiSuggestions: Array<{ title: string; desc: string; to: '/profile' | '/products/new' | '/rfq' | '/messages' | '/ai-advisor' }> = [];

  if (completion && !completion.isComplete) {
    aiSuggestions.push({
      title: 'تکمیل پروفایل برای افزایش اعتماد خریداران',
      desc: 'پروفایل کامل، شانس دیده شدن و دریافت درخواست معتبر را افزایش می دهد.',
      to: '/profile',
    });
  }

  if ((productStats?.total ?? 0) === 0) {
    aiSuggestions.push({
      title: 'اولین کالا را در Marketplace ثبت کنید',
      desc: 'با ثبت حداقل یک کالا، در نتایج جستجو نمایش داده می شوید.',
      to: '/products/new',
    });
  }

  if (activeTradeRequests === 0) {
    aiSuggestions.push({
      title: 'یک RFQ فعال بسازید',
      desc: 'با ایجاد RFQ، فرصت های جدید تامین یا فروش سریع تر کشف می شود.',
      to: '/rfq',
    });
  }

  if ((unreadCount ?? 0) > 0) {
    aiSuggestions.push({
      title: 'پیام های خوانده نشده را بررسی کنید',
      desc: 'برخی گفتگوها یا اعلان ها نیاز به اقدام سریع شما دارند.',
      to: '/messages',
    });
  }

  if (aiSuggestions.length === 0) {
    aiSuggestions.push({
      title: 'عملکرد شما عالی است',
      desc: 'برای بهینه سازی بیشتر، از مشاور AI برای تحلیل مسیر فروش استفاده کنید.',
      to: '/ai-advisor',
    });
  }

  return (
    <div className="p-5 lg:p-7 space-y-7" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">داشبورد</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            خوش آمدید،{' '}
            <span className="font-medium text-foreground">
              {myProfile?.profile?.companyName || myProfile?.profile?.unitName || String(user?.userCode ?? '')}
            </span>
          </p>
          {myProfile?.profile?.companyName && (
            <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
              <Building2 className="h-3 w-3" />
              کد کاربری: {user?.userCode}
            </p>
          )}
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
        <StatCard title="تعداد کالا" value={productStats?.total} icon={Package} loading={loadingProducts} error={errorProducts} color="blue" />
        <StatCard title="درخواست فعال" value={activeTradeRequests} icon={ArrowLeftRight} loading={loadingTrade} error={errorTrade} color="green" />
        <StatCard title="پیام جدید" value={unreadCount} icon={MessageSquare} loading={loadingUnread} error={errorUnread} color="orange" />
        <StatCard title="تیکت باز" value={supportStats?.open} icon={Ticket} loading={loadingSupport} error={errorSupport} color="default" />
      </div>

      {/* AI Suggestions + Opportunities */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--brand)]" />
              پیشنهادهای AI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiSuggestions.slice(0, 3).map((suggestion) => (
              <div key={suggestion.title} className="rounded-xl border p-3">
                <p className="text-sm font-semibold text-foreground">{suggestion.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{suggestion.desc}</p>
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link to={suggestion.to}>اقدام پیشنهادی</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-[var(--brand)]" />
              فرصت های جدید
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Newspaper className="h-3.5 w-3.5" />
                جدیدترین اخبار بازار
              </p>
              {loadingNews ? (
                <Skeleton className="h-12 w-full" />
              ) : latestNews?.length ? (
                <div className="space-y-2">
                  {latestNews.map((item: any) => (
                    <div key={item.id} className="rounded-lg bg-muted/40 p-2.5">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(item.publishedAt).toLocaleDateString('fa-IR')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">فعلا خبر جدیدی منتشر نشده است.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Bell className="h-3.5 w-3.5" />
                اعلان های نیازمند اقدام
              </p>
              {loadingNotifications ? (
                <Skeleton className="h-12 w-full" />
              ) : unreadNotifications?.notifications?.length ? (
                <div className="space-y-2">
                  {unreadNotifications.notifications.map((note) => (
                    <div key={note.id} className="rounded-lg border border-dashed p-2.5">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{note.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{note.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">اعلان خوانده نشده ای وجود ندارد.</p>
              )}
            </div>

            <div className="pt-1">
              <p className="text-xs font-semibold text-muted-foreground mb-2">کالاهای تازه در Marketplace</p>
              {loadingMarketplace ? (
                <Skeleton className="h-10 w-full" />
              ) : marketplaceData?.data?.length ? (
                <div className="flex flex-wrap gap-2">
                  {marketplaceData.data.slice(0, 3).map((product) => (
                    <Badge key={product.id} variant="outline" className="font-normal">
                      {product.nameFa}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">هنوز کالای تایید شده ای برای نمایش وجود ندارد.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trade Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--brand)]" />
            آخرین فعالیت تجاری
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Link to="/rfq">مشاهده همه</Link>
          </Button>
        </div>
        {loadingRecentTrades ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : recentTrades?.items?.length ? (
          <div className="grid sm:grid-cols-3 gap-3">
            {recentTrades.items.map((trade) => (
              <Card key={trade.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-foreground line-clamp-1 flex-1">
                      {trade.productNameFa || trade.productNameEn || '—'}
                    </p>
                    <Badge
                      variant={({ PENDING: 'warning', MATCHED: 'success', IN_NEGOTIATION: 'default', COMPLETED: 'outline', CANCELLED: 'destructive' } as const)[trade.status as string] ?? 'outline'}
                      className="text-[10px] shrink-0"
                    >
                      {{ PENDING: 'در انتظار', MATCHED: 'تطابق', IN_NEGOTIATION: 'مذاکره', COMPLETED: 'تکمیل', CANCELLED: 'لغو' }[trade.status as string] ?? trade.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{trade.quantity} · {trade.currency}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{new Date(trade.createdAt).toLocaleDateString('fa-IR')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-5 text-center">
              <ArrowLeftRight className="h-7 w-7 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">هنوز درخواست تجاری ایجاد نکرده‌اید.</p>
              <Button asChild size="sm">
                <Link to="/rfq">ایجاد اولین RFQ</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">دسترسی سریع</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/products/new', icon: Package,        label: 'کالای جدید',        color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
            { href: '/rfq',          icon: ArrowLeftRight,  label: 'RFQ جدید',          color: 'bg-green-50 text-green-600 hover:bg-green-100' },
            { href: '/messages',     icon: MessageSquare,   label: 'پیام ها',           color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
            { href: '/ai-advisor',   icon: Sparkles,        label: 'مشاور AI',          color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
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
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-slate-400 inline-block" />
                <span className="text-muted-foreground">کل:</span>
                <span className="font-semibold">{supportStats.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
