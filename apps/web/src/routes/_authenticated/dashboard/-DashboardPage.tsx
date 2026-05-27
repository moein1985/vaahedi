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
  Wheat,
  MapPin,
} from 'lucide-react';
import { trpc } from '../../../trpc.js';
import { useAuthStore } from '../../../store/auth.store.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.js';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { Progress } from '../../../components/ui/progress.js';
import { Skeleton } from '../../../components/ui/skeleton.js';
import { cn } from '../../../lib/utils.js';

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
  const iconClasses: Record<string, string> = {
    default: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
    blue: 'bg-[linear-gradient(135deg,var(--brand-light),hsl(195_56%_33%_/_0.09))] text-[var(--brand)]',
    green: 'bg-[hsl(139_50%_37%_/_0.12)] text-[var(--agri-leaf)]',
    orange: 'bg-[hsl(40_62%_57%_/_0.16)] text-[var(--soil-neutral)]',
    red: 'bg-[hsl(2_52%_50%_/_0.12)] text-[var(--error-red)]',
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
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
          <div className={cn('rounded-xl p-2.5', iconClasses[color])}>
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
  const { data: catalogData, isLoading: loadingCatalog } = trpc.product.list.useQuery({
    page: 1,
    limit: 4,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const { data: harvestData } = trpc.agri.harvest.list.useQuery({
    onlyActive: true,
    page: 1,
    limit: 4,
  });
  const { data: marketData } = trpc.agri.market.list.useQuery({
    onlyPublished: true,
    page: 1,
    limit: 3,
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
      title: 'اولین کالا را در بازار محصولات ثبت کنید',
      desc: 'با ثبت حداقل یک کالا، در نتایج جستجو نمایش داده می شوید.',
      to: '/products/new',
    });
  }

  if (activeTradeRequests === 0) {
    aiSuggestions.push({
      title: 'یک درخواست فعال بسازید',
      desc: 'با ایجاد درخواست، فرصت های جدید تامین یا فروش سریع تر کشف می شود.',
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
      <div
        className="flex items-center justify-between rounded-xl p-5 border bg-[linear-gradient(135deg,hsl(153_30%_12%_/_0.03),hsl(195_56%_33%_/_0.05))] border-[hsl(139_50%_37%_/_0.24)]"
      >
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
        <Card className="border border-[hsl(139_50%_37%_/_0.35)] bg-[hsl(139_50%_37%_/_0.07)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1 text-[var(--agri-leaf)]">پروفایل شما ناقص است</p>
                <div className="flex items-center gap-3">
                  <Progress value={completion.percent} className="h-1.5 flex-1 max-w-xs" />
                  <span className="text-xs font-bold text-[var(--agri-leaf)]">{completion.percent}%</span>
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
        <StatCard title="تعداد کالا" value={productStats?.total} icon={Package} loading={loadingProducts} error={errorProducts} color="blue" sub={productStats ? `تأیید شده: ${productStats.approved} · در انتظار: ${productStats.pending}` : undefined} />
        <StatCard title="درخواست فعال" value={activeTradeRequests} icon={ArrowLeftRight} loading={loadingTrade} error={errorTrade} color="green" />
        <StatCard title="اعلان جدید" value={unreadCount} icon={MessageSquare} loading={loadingUnread} error={errorUnread} color="orange" />
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
              <p className="text-xs font-semibold text-muted-foreground mb-2">کالاهای تازه در بازار محصولات</p>
              {loadingCatalog ? (
                <Skeleton className="h-10 w-full" />
              ) : catalogData?.data?.length ? (
                <div className="flex flex-wrap gap-2">
                  {catalogData.data.slice(0, 3).map((product) => (
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
            آخرین فعالیت درخواست ها
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
              <p className="text-sm text-muted-foreground mb-3">هنوز درخواستی ایجاد نکرده اید.</p>
              <Button asChild size="sm">
                <Link to="/rfq">ایجاد اولین درخواست</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Agri Widgets */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* تقویم برداشت */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wheat className="h-4 w-4 text-[var(--agri-leaf)]" />
                تقویم برداشت
              </CardTitle>
              <Link to="/harvest" className="text-xs text-[var(--agri-leaf)] hover:underline">
                مشاهده همه ›
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {harvestData?.items?.length ? (
              harvestData.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-[hsl(139_50%_37%_/_0.1)] px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.cropNameFa}</p>
                    {item.province && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />{item.province}
                      </p>
                    )}
                  </div>
                  <span className="text-xs bg-white border border-[hsl(139_50%_37%_/_0.35)] text-[var(--agri-leaf)] px-2 py-0.5 rounded-full">
                    {['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'][item.harvestStartMonth - 1]}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">هنوز اطلاعاتی ثبت نشده است.</p>
            )}
          </CardContent>
        </Card>

        {/* تحلیل بازار */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--data-blue)]" />
                تحلیل بازار
              </CardTitle>
              <Link to="/market-insights" className="text-xs text-[var(--data-blue)] hover:underline">
                مشاهده همه ›
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {marketData?.items?.length ? (
              marketData.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.title}</p>
                    <span className="text-[10px] bg-[hsl(195_56%_33%_/_0.14)] text-[var(--data-blue)] px-1.5 py-0.5 rounded shrink-0">
                      {({ price: 'قیمت', demand: 'تقاضا', supply: 'عرضه', trend: 'روند', regulation: 'مقررات' } as Record<string, string>)[item.insightType] ?? item.insightType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.commodityFa}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">هنوز تحلیلی منتشر نشده است.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">دسترسی سریع</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { href: '/products/new',    icon: Package,        label: 'کالای جدید',   color: 'bg-[hsl(139_50%_37%_/_0.1)] text-[var(--agri-leaf)] hover:bg-[hsl(139_50%_37%_/_0.16)]' },
            { href: '/rfq',             icon: ArrowLeftRight, label: 'درخواست جدید',  color: 'bg-[hsl(146_22%_90%)] text-[var(--brand)] hover:bg-[hsl(146_22%_86%)]' },
            { href: '/harvest',         icon: Wheat,          label: 'تقویم برداشت', color: 'bg-[hsl(139_50%_37%_/_0.1)] text-[var(--agri-leaf)] hover:bg-[hsl(139_50%_37%_/_0.16)]' },
            { href: '/market-insights', icon: TrendingUp,     label: 'تحلیل بازار',  color: 'bg-[hsl(195_56%_33%_/_0.12)] text-[var(--data-blue)] hover:bg-[hsl(195_56%_33%_/_0.2)]' },
            { href: '/messages',        icon: MessageSquare,  label: 'پیام ها',      color: 'bg-[hsl(40_62%_57%_/_0.16)] text-[var(--soil-neutral)] hover:bg-[hsl(40_62%_57%_/_0.24)]' },
            { href: '/ai-advisor',      icon: Sparkles,       label: 'مشاور کشاورزی', color: 'bg-[hsl(153_30%_12%_/_0.08)] text-[var(--brand)] hover:bg-[hsl(153_30%_12%_/_0.14)]' },
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
