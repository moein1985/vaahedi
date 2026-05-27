import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Wallet,
  BarChart3,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
  TrendingUp,
  PackageCheck,
  Handshake,
  Clock3,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import { trpc } from '../../../trpc.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.js';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { Skeleton } from '../../../components/ui/skeleton.js';
import { Progress } from '../../../components/ui/progress.js';

export const Route = createFileRoute('/_authenticated/finance/')({
  component: FinancePage,
});

const TRADE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار تطابق',
  MATCHED: 'تطابق یافته',
  IN_NEGOTIATION: 'در حال مذاکره',
  COMPLETED: 'تکمیل شده',
  CANCELLED: 'لغو شده',
};

const TRADE_STATUS_VARIANT: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
  PENDING: 'warning',
  MATCHED: 'success',
  IN_NEGOTIATION: 'default',
  COMPLETED: 'outline',
  CANCELLED: 'destructive',
};

const TRADE_TYPE_LABELS: Record<string, string> = {
  BUY: 'خرید',
  SELL: 'فروش',
};

function PipelineCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            {loading ? (
              <Skeleton className="h-7 w-12 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{value}</p>
            )}
          </div>
          <div className={`rounded-xl p-2.5 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancePage() {
  const { data: tradeStats, isLoading: loadingStats } = trpc.trade.myStats.useQuery();
  const { data: recentTrades, isLoading: loadingTrades } = trpc.trade.myRequests.useQuery({
    page: 1,
    limit: 5,
  });
  const { data: productStats, isLoading: loadingProducts } = trpc.product.myStats.useQuery();

  const activeDeals = (tradeStats?.matched ?? 0) + (tradeStats?.inNegotiation ?? 0);
  const completionRate = tradeStats?.total
    ? Math.round(((tradeStats.total - (tradeStats.pending ?? 0)) / tradeStats.total) * 100)
    : 0;

  return (
    <div className="p-5 lg:p-7 space-y-7" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مالی</h1>
          <p className="text-sm text-muted-foreground mt-0.5">خلاصه فعالیت تجاری و وضعیت معاملات</p>
        </div>
      </div>

      {/* Trade Pipeline KPIs */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          پایپ‌لاین معاملاتی
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PipelineCard
            label="کل درخواست‌ها"
            value={tradeStats?.total ?? 0}
            icon={BarChart3}
            color="bg-[hsl(195_56%_33%_/_0.12)] text-[var(--data-blue)]"
            loading={loadingStats}
          />
          <PipelineCard
            label="در انتظار تطابق"
            value={tradeStats?.pending ?? 0}
            icon={Clock3}
            color="bg-amber-100 text-amber-600"
            loading={loadingStats}
          />
          <PipelineCard
            label="معامله فعال"
            value={activeDeals}
            icon={Handshake}
            color="bg-green-100 text-green-600"
            loading={loadingStats}
          />
          <PipelineCard
            label="کالاهای ثبت‌شده"
            value={productStats?.total ?? 0}
            icon={PackageCheck}
            color="bg-purple-100 text-purple-600"
            loading={loadingProducts}
          />
        </div>
      </div>

      {/* Trade Activity + Wallet Side by Side */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Trades */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-[var(--brand)]" />
                  آخرین درخواست‌های تجاری
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  <Link to="/rfq">مشاهده همه <ChevronLeft className="h-3 w-3 mr-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTrades ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : recentTrades?.items?.length ? (
                <div className="divide-y">
                  {recentTrades.items.map((trade) => (
                    <div key={trade.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-[10px] shrink-0 font-normal">
                            {TRADE_TYPE_LABELS[trade.type] ?? trade.type}
                          </Badge>
                          <p className="text-sm font-medium text-foreground truncate">
                            {trade.productNameFa || trade.productNameEn || '—'}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {trade.quantity} · {trade.currency} · {new Date(trade.createdAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                      <Badge variant={TRADE_STATUS_VARIANT[trade.status] ?? 'outline'} className="text-[10px] shrink-0">
                        {TRADE_STATUS_LABELS[trade.status] ?? trade.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <ArrowUpCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">هنوز درخواست تجاری ثبت نکرده‌اید.</p>
                  <Button asChild size="sm" className="mt-3">
                    <Link to="/rfq">ایجاد اولین درخواست</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Progress summary + wallet coming soon */}
        <div className="space-y-4">
          {/* Completion Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                نرخ پیشرفت معاملات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-16 w-full" />
              ) : tradeStats?.total ? (
                <div className="space-y-3">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-foreground">{completionRate}%</span>
                    <span className="text-xs text-muted-foreground mb-1">از کل درخواست‌ها پردازش شده</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <Progress value={completionRate} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-lg bg-muted/60 p-2 text-center">
                      <p className="text-lg font-bold text-foreground">{tradeStats.matched ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">تطابق یافته</p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-2 text-center">
                      <p className="text-lg font-bold text-foreground">{tradeStats.inNegotiation ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">در مذاکره</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">هنوز داده‌ای برای نمایش وجود ندارد.</p>
              )}
            </CardContent>
          </Card>

          {/* Wallet — coming next */}
          <Card className="border-dashed opacity-75">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-muted p-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">کیف پول</p>
                <Badge variant="outline" className="text-[10px] mr-auto">فاز بعدی</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-5">
                مدیریت موجودی، شارژ و تسویه حساب در فاز بعدی اضافه می‌شود.
              </p>
            </CardContent>
          </Card>

          {/* Payment gateway — coming next */}
          <Card className="border-dashed opacity-75">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-muted p-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">درگاه پرداخت</p>
                <Badge variant="outline" className="text-[10px] mr-auto">فاز بعدی</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-5">
                پرداخت امن برای تضمین سفارش و تسویه معاملات.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Future Roadmap — compact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            قابلیت‌های مالی در نقشه راه
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: ArrowDownCircle, label: 'تسویه با فروشندگان' },
              { icon: ArrowUpCircle,   label: 'پرداخت به خریداران' },
              { icon: ShieldCheck,     label: 'اعتبار تجاری' },
              { icon: BarChart3,       label: 'گزارش مالی جامع' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
