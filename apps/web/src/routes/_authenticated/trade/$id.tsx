import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '../../../trpc.js';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card.js';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { Skeleton } from '../../../components/ui/skeleton.js';
import {
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Handshake,
  CheckCircle2,
  XCircle,
  Package,
  MapPin,
  DollarSign,
  Hash,
  CalendarDays,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const Route = createFileRoute('/_authenticated/trade/$id')({
  component: TradeDetailPage,
});

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار تطابق',
  MATCHED: 'تطابق یافته',
  IN_NEGOTIATION: 'در مذاکره',
  UNDER_REVIEW: 'در بررسی',
  COMPLETED: 'تکمیل شده',
  CANCELLED: 'لغو شده',
};

const STATUS_VARIANT: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
  PENDING: 'warning',
  MATCHED: 'success',
  IN_NEGOTIATION: 'default',
  COMPLETED: 'outline',
  CANCELLED: 'destructive',
  UNDER_REVIEW: 'warning',
};

const CURRENCY_LABELS: Record<string, string> = {
  USD: 'دلار آمریکا',
  EUR: 'یورو',
  AED: 'درهم امارات',
  IRR: 'ریال ایران',
};

const PIPELINE_STEPS = [
  { key: 'PENDING',        label: 'ثبت شد',    icon: Clock,        desc: 'درخواست ثبت و منتظر تطابق است' },
  { key: 'MATCHED',        label: 'تطابق',      icon: Handshake,    desc: 'طرف مقابل پیدا شده' },
  { key: 'IN_NEGOTIATION', label: 'مذاکره',     icon: ArrowUpCircle, desc: 'در حال مذاکره با طرف مقابل' },
  { key: 'COMPLETED',      label: 'تکمیل',      icon: CheckCircle2, desc: 'معامله با موفقیت انجام شد' },
] as const;

const STATUS_STEP: Record<string, number> = {
  PENDING: 1, MATCHED: 2, IN_NEGOTIATION: 3, COMPLETED: 4,
  CANCELLED: -1, UNDER_REVIEW: 1,
};

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className="rounded-lg bg-muted p-2 shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function TradeDetailPage() {
  const { id } = Route.useParams();
  const { data, isLoading, isError } = trpc.trade.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl space-y-4" dir="rtl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-center" dir="rtl">
        <XCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">درخواست یافت نشد یا دسترسی ندارید.</p>
        <Button asChild variant="outline">
          <Link to="/trade"><ArrowRight className="h-4 w-4 ml-2" />بازگشت به لیست</Link>
        </Button>
      </div>
    );
  }

  const step = data.status === 'CANCELLED' ? -1 : (STATUS_STEP[data.status] ?? 1);
  const isCancelled = data.status === 'CANCELLED';
  const isActive = !isCancelled && data.status !== 'COMPLETED';

  return (
    <div className="p-5 lg:p-7 max-w-2xl space-y-6" dir="rtl">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-mr-2">
          <Link to="/trade">
            <ArrowRight className="h-4 w-4 ml-1" />
            لیست درخواست ها
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={data.type === 'BUY' ? 'blue' : 'green'} className="text-xs">
              {data.type === 'BUY'
                ? <><ArrowDownCircle className="h-3 w-3 ml-1 inline" />خرید</>
                : <><ArrowUpCircle className="h-3 w-3 ml-1 inline" />فروش</>
              }
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {data.productNameFa || data.productNameEn || '—'}
          </h1>
          {data.productNameEn && data.productNameFa && (
            <p className="text-sm text-muted-foreground mt-0.5">{data.productNameEn}</p>
          )}
        </div>
        <Badge
          variant={STATUS_VARIANT[data.status] ?? 'outline'}
          className="text-sm px-3 py-1"
        >
          {STATUS_LABELS[data.status] ?? data.status}
        </Badge>
      </div>

      {/* Pipeline Timeline */}
      {!isCancelled ? (
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-4">مرحله فعلی درخواست</p>
            <div className="flex items-start gap-0">
              {PIPELINE_STEPS.map((s, idx) => {
                const done = step > idx + 1;
                const active = step === idx + 1;
                const Icon = s.icon;
                return (
                  <div key={s.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`rounded-full p-2 mb-1.5 ${done ? 'bg-green-100 text-green-600' : active ? 'bg-[hsl(148_62%_24%_/_0.14)] text-[var(--agri-primary)]' : 'bg-muted text-muted-foreground/40'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className={`text-xs font-medium text-center leading-tight ${active ? 'text-[var(--agri-primary)]' : done ? 'text-green-700' : 'text-muted-foreground/50'}`}>
                        {s.label}
                      </p>
                      {active && (
                        <p className="text-[10px] text-[var(--data-blue)] text-center mt-0.5 leading-tight hidden sm:block">{s.desc}</p>
                      )}
                    </div>
                    {idx < PIPELINE_STEPS.length - 1 && (
                      <div className={`h-px w-6 shrink-0 mx-1 mt-[-16px] ${done ? 'bg-green-300' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-100 bg-red-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">این درخواست لغو شده است.</p>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-base">جزئیات درخواست</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-2">
          <DetailRow icon={Package}      label="مقدار"          value={(data.quantity ? String(data.quantity).replace(/\s*undefined\s*/g, '').trim() : null) || null} />
          <DetailRow icon={DollarSign}   label="قیمت هدف"       value={data.targetPrice ? `${data.targetPrice} ${CURRENCY_LABELS[data.currency ?? ''] ?? data.currency ?? ''}` : null} />
          <DetailRow icon={MapPin}       label="محل تحویل"      value={data.deliveryLocation} />
          <DetailRow icon={Hash}         label="کد HS"           value={data.hsCode} />
          <DetailRow icon={Hash}         label="کد کالا/خدمات"  value={data.serviceCode} />
          <DetailRow icon={CalendarDays} label="تاریخ ثبت"      value={new Date(data.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })} />
          {data.expiresAt && (
            <DetailRow icon={CalendarDays} label="تاریخ انقضا" value={new Date(data.expiresAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })} />
          )}
          {data.notes && (
            <div className="py-3">
              <p className="text-xs text-muted-foreground mb-1">یادداشت</p>
              <p className="text-sm text-foreground leading-6">{data.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matched info */}
      {data.matchedAt && (
        <Card className="border-green-100 bg-green-50/40">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">تطابق در {new Date(data.matchedAt).toLocaleDateString('fa-IR')}</p>
              {data.matchedBy?.userCode && (
                <p className="text-xs text-green-700 mt-0.5">توسط: {data.matchedBy.userCode}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {isActive && (
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link to="/chat">
              <MessageSquare className="h-4 w-4 ml-2" />
              پیام به پشتیبانی
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link to="/chat">
              <Sparkles className="h-4 w-4 ml-2" />
              تحلیل AI برای این درخواست
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
